import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { LogWithDecodedArgs, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');
import 'make-promises-safe';

import { DummyERC20TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c20_token';
import { DummyERC721TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c721_token';
import { ERC20ProxyContract } from '../../src/contract_wrappers/generated/e_r_c20_proxy';
import { ERC721ProxyContract } from '../../src/contract_wrappers/generated/e_r_c721_proxy';
import {
    CancelContractEventArgs,
    ExchangeContract,
    ExchangeStatusContractEventArgs,
    FillContractEventArgs,
} from '../../src/contract_wrappers/generated/exchange';
import { artifacts } from '../../src/utils/artifacts';
import { assetProxyUtils } from '../../src/utils/asset_proxy_utils';
import { chaiSetup } from '../../src/utils/chai_setup';
import { constants } from '../../src/utils/constants';
import { crypto } from '../../src/utils/crypto';
import { ERC20Wrapper } from '../../src/utils/erc20_wrapper';
import { ERC721Wrapper } from '../../src/utils/erc721_wrapper';
import { ExchangeWrapper } from '../../src/utils/exchange_wrapper';
import { OrderFactory } from '../../src/utils/order_factory';
import { orderUtils } from '../../src/utils/order_utils';
import { AssetProxyId, ContractName, ERC20BalancesByOwner, ExchangeStatus } from '../../src/utils/types';
import { provider, txDefaults, web3Wrapper } from '../../src/utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Exchange core', () => {
    let makerAddress: string;
    let owner: string;
    let takerAddress: string;
    let feeRecipientAddress: string;

    let erc20TokenA: DummyERC20TokenContract;
    let erc20TokenB: DummyERC20TokenContract;
    let zrxToken: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let exchange: ExchangeContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;

    let signedOrder: SignedOrder;
    let erc20Balances: ERC20BalancesByOwner;
    let exchangeWrapper: ExchangeWrapper;
    let erc20Wrapper: ERC20Wrapper;
    let erc721Wrapper: ERC721Wrapper;
    let orderFactory: OrderFactory;

    let erc721MakerAssetIds: BigNumber[];
    let erc721TakerAssetIds: BigNumber[];

    let defaultMakerAssetAddress: string;
    let defaultTakerAssetAddress: string;

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, makerAddress, takerAddress, feeRecipientAddress] = accounts);

        erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);

        [erc20TokenA, erc20TokenB, zrxToken] = await erc20Wrapper.deployDummyTokensAsync();
        erc20Proxy = await erc20Wrapper.deployProxyAsync();
        await erc20Wrapper.setBalancesAndAllowancesAsync();

        [erc721Token] = await erc721Wrapper.deployDummyTokensAsync();
        erc721Proxy = await erc721Wrapper.deployProxyAsync();
        await erc721Wrapper.setBalancesAndAllowancesAsync();
        const erc721Balances = await erc721Wrapper.getBalancesAsync();
        erc721MakerAssetIds = erc721Balances[makerAddress][erc721Token.address];
        erc721TakerAssetIds = erc721Balances[takerAddress][erc721Token.address];

        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            artifacts.Exchange,
            provider,
            txDefaults,
            assetProxyUtils.encodeERC20ProxyData(zrxToken.address),
        );
        exchangeWrapper = new ExchangeWrapper(exchange, provider);
        await exchangeWrapper.registerAssetProxyAsync(AssetProxyId.ERC20, erc20Proxy.address, owner);
        await exchangeWrapper.registerAssetProxyAsync(AssetProxyId.ERC721, erc721Proxy.address, owner);

        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        await web3Wrapper.awaitTransactionSuccessAsync(
            await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(exchange.address, {
                from: owner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );

        defaultMakerAssetAddress = erc20TokenA.address;
        defaultTakerAssetAddress = erc20TokenB.address;

        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            exchangeAddress: exchange.address,
            makerAddress,
            feeRecipientAddress,
            makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultMakerAssetAddress),
            takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultTakerAssetAddress),
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[accounts.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('fillOrder', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            signedOrder = orderFactory.newSignedOrder();
        });

        it('should create an unfillable order', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1001),
                takerAssetAmount: new BigNumber(3),
            });

            const takerAssetFilledAmountBefore = await exchangeWrapper.getTakerAssetFilledAmountAsync(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerAssetFilledAmountBefore).to.be.bignumber.equal(0);

            const fillTakerAssetAmount1 = new BigNumber(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount: fillTakerAssetAmount1,
            });

            const takerAssetFilledAmountAfter1 = await exchangeWrapper.getTakerAssetFilledAmountAsync(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerAssetFilledAmountAfter1).to.be.bignumber.equal(fillTakerAssetAmount1);

            const fillTakerAssetAmount2 = new BigNumber(1);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount: fillTakerAssetAmount2,
            });

            const takerAssetFilledAmountAfter2 = await exchangeWrapper.getTakerAssetFilledAmountAsync(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerAssetFilledAmountAfter2).to.be.bignumber.equal(takerAssetFilledAmountAfter1);
        });

        it('should transfer the correct amounts when makerAssetAmount === takerAssetAmount', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
            });

            const takerAssetFilledAmountBefore = await exchangeWrapper.getTakerAssetFilledAmountAsync(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerAssetFilledAmountBefore).to.be.bignumber.equal(0);

            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });

            const makerAmountBoughtAfter = await exchangeWrapper.getTakerAssetFilledAmountAsync(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(makerAmountBoughtAfter).to.be.bignumber.equal(takerAssetFillAmount);

            const newBalances = await erc20Wrapper.getBalancesAsync();

            const makerAssetFilledAmount = takerAssetFillAmount
                .times(signedOrder.makerAssetAmount)
                .dividedToIntegerBy(signedOrder.takerAssetAmount);
            const makerFeePaid = signedOrder.makerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            const takerFeePaid = signedOrder.takerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFilledAmount),
            );
            expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultTakerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(makerFeePaid),
            );
            expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].add(makerAssetFilledAmount),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(makerFeePaid.add(takerFeePaid)),
            );
        });

        it('should transfer the correct amounts when makerAssetAmount > takerAssetAmount', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
            });

            const takerAssetFilledAmountBefore = await exchangeWrapper.getTakerAssetFilledAmountAsync(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerAssetFilledAmountBefore).to.be.bignumber.equal(0);

            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });

            const makerAmountBoughtAfter = await exchangeWrapper.getTakerAssetFilledAmountAsync(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(makerAmountBoughtAfter).to.be.bignumber.equal(takerAssetFillAmount);

            const newBalances = await erc20Wrapper.getBalancesAsync();

            const makerAssetFilledAmount = takerAssetFillAmount
                .times(signedOrder.makerAssetAmount)
                .dividedToIntegerBy(signedOrder.takerAssetAmount);
            const makerFeePaid = signedOrder.makerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            const takerFeePaid = signedOrder.takerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFilledAmount),
            );
            expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultTakerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(makerFeePaid),
            );
            expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].add(makerAssetFilledAmount),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(makerFeePaid.add(takerFeePaid)),
            );
        });

        it('should transfer the correct amounts when makerAssetAmount < takerAssetAmount', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), 18),
            });

            const takerAssetFilledAmountBefore = await exchangeWrapper.getTakerAssetFilledAmountAsync(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerAssetFilledAmountBefore).to.be.bignumber.equal(0);

            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });

            const makerAmountBoughtAfter = await exchangeWrapper.getTakerAssetFilledAmountAsync(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(makerAmountBoughtAfter).to.be.bignumber.equal(takerAssetFillAmount);

            const newBalances = await erc20Wrapper.getBalancesAsync();

            const makerAssetFilledAmount = takerAssetFillAmount
                .times(signedOrder.makerAssetAmount)
                .dividedToIntegerBy(signedOrder.takerAssetAmount);
            const makerFeePaid = signedOrder.makerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            const takerFeePaid = signedOrder.takerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFilledAmount),
            );
            expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultTakerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(makerFeePaid),
            );
            expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].add(makerAssetFilledAmount),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(makerFeePaid.add(takerFeePaid)),
            );
        });

        it('should transfer the correct amounts when taker is specified and order is claimed by taker', async () => {
            signedOrder = orderFactory.newSignedOrder({
                takerAddress,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), 18),
            });

            const takerAssetFilledAmountBefore = await exchangeWrapper.getTakerAssetFilledAmountAsync(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerAssetFilledAmountBefore).to.be.bignumber.equal(0);

            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });

            const makerAmountBoughtAfter = await exchangeWrapper.getTakerAssetFilledAmountAsync(
                orderUtils.getOrderHashHex(signedOrder),
            );
            const expectedMakerAmountBoughtAfter = takerAssetFillAmount.add(takerAssetFilledAmountBefore);
            expect(makerAmountBoughtAfter).to.be.bignumber.equal(expectedMakerAmountBoughtAfter);

            const newBalances = await erc20Wrapper.getBalancesAsync();

            const makerAssetFilledAmount = takerAssetFillAmount
                .times(signedOrder.makerAssetAmount)
                .dividedToIntegerBy(signedOrder.takerAssetAmount);
            const makerFeePaid = signedOrder.makerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            const takerFeePaid = signedOrder.takerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(makerAssetFilledAmount),
            );
            expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultTakerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(makerFeePaid),
            );
            expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].add(makerAssetFilledAmount),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(makerFeePaid.add(takerFeePaid)),
            );
        });

        it('should fill remaining value if takerAssetFillAmount > remaining takerAssetAmount', async () => {
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });

            const res = await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount: signedOrder.takerAssetAmount,
            });
            const log = res.logs[0] as LogWithDecodedArgs<FillContractEventArgs>;
            expect(log.args.takerAssetFilledAmount).to.be.bignumber.equal(
                signedOrder.takerAssetAmount.minus(takerAssetFillAmount),
            );
            const newBalances = await erc20Wrapper.getBalancesAsync();

            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(signedOrder.makerAssetAmount),
            );
            expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultTakerAssetAddress].add(signedOrder.takerAssetAmount),
            );
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(signedOrder.makerFee),
            );
            expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultTakerAssetAddress].minus(signedOrder.takerAssetAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].add(signedOrder.makerAssetAmount),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].minus(signedOrder.takerFee),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(
                    signedOrder.makerFee.add(signedOrder.takerFee),
                ),
            );
        });

        it('should log 1 event with the correct arguments when order has a feeRecipient', async () => {
            const divisor = 2;
            const res = await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount: signedOrder.takerAssetAmount.div(divisor),
            });
            expect(res.logs).to.have.length(1);

            const log = res.logs[0] as LogWithDecodedArgs<FillContractEventArgs>;
            const logArgs = log.args;
            const expectedFilledMakerAssetAmount = signedOrder.makerAssetAmount.div(divisor);
            const expectedFilledTakerAssetAmount = signedOrder.takerAssetAmount.div(divisor);
            const expectedFeeMPaid = signedOrder.makerFee.div(divisor);
            const expectedFeeTPaid = signedOrder.takerFee.div(divisor);

            expect(signedOrder.makerAddress).to.be.equal(logArgs.makerAddress);
            expect(takerAddress).to.be.equal(logArgs.takerAddress);
            expect(signedOrder.feeRecipientAddress).to.be.equal(logArgs.feeRecipientAddress);
            expect(signedOrder.makerAssetData).to.be.equal(logArgs.makerAssetData);
            expect(signedOrder.takerAssetData).to.be.equal(logArgs.takerAssetData);
            expect(expectedFilledMakerAssetAmount).to.be.bignumber.equal(logArgs.makerAssetFilledAmount);
            expect(expectedFilledTakerAssetAmount).to.be.bignumber.equal(logArgs.takerAssetFilledAmount);
            expect(expectedFeeMPaid).to.be.bignumber.equal(logArgs.makerFeePaid);
            expect(expectedFeeTPaid).to.be.bignumber.equal(logArgs.takerFeePaid);
            expect(orderUtils.getOrderHashHex(signedOrder)).to.be.equal(logArgs.orderHash);
        });

        it('should throw when taker is specified and order is claimed by other', async () => {
            signedOrder = orderFactory.newSignedOrder({
                takerAddress: feeRecipientAddress,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), 18),
            });
            return expect(exchangeWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should throw if signature is invalid', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(10), 18),
            });

            const v = ethUtil.toBuffer(signedOrder.signature.slice(0, 4));
            const invalidR = ethUtil.sha3('invalidR');
            const invalidS = ethUtil.sha3('invalidS');
            const signatureType = ethUtil.toBuffer(`0x${signedOrder.signature.slice(-2)}`);
            const invalidSigBuff = Buffer.concat([v, invalidR, invalidS, signatureType]);
            const invalidSigHex = `0x${invalidSigBuff.toString('hex')}`;
            signedOrder.signature = invalidSigHex;
            return expect(exchangeWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should throw if makerAssetAmount is 0', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(0),
            });

            return expect(exchangeWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should throw if takerAssetAmount is 0', async () => {
            signedOrder = orderFactory.newSignedOrder({
                takerAssetAmount: new BigNumber(0),
            });

            return expect(exchangeWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should throw if takerAssetFillAmount is 0', async () => {
            signedOrder = orderFactory.newSignedOrder();

            return expect(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                    takerAssetFillAmount: new BigNumber(0),
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if maker erc20Balances are too low to fill order', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            return expect(exchangeWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should throw if taker erc20Balances are too low to fill order', async () => {
            signedOrder = orderFactory.newSignedOrder({
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            return expect(exchangeWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should throw if maker allowances are too low to fill order', async () => {
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20TokenA.approve.sendTransactionAsync(erc20Proxy.address, new BigNumber(0), {
                    from: makerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            // HACK: `rejectWith` returns a "promise-like" type, but not an actual "Promise", so TSLint
            // complains, even though we do need to `await` it. So we disable the TSLint error below.
            // tslint:disable-next-line:await-promise
            await expect(exchangeWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20TokenA.approve.sendTransactionAsync(erc20Proxy.address, constants.INITIAL_ERC20_ALLOWANCE, {
                    from: makerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
        });

        it('should throw if taker allowances are too low to fill order', async () => {
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20TokenB.approve.sendTransactionAsync(erc20Proxy.address, new BigNumber(0), {
                    from: takerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            // HACK: `rejectWith` returns a "promise-like" type, but not an actual "Promise", so TSLint
            // complains, even though we do need to `await` it. So we disable the TSLint error below.
            // tslint:disable-next-line:await-promise
            await expect(exchangeWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20TokenB.approve.sendTransactionAsync(erc20Proxy.address, constants.INITIAL_ERC20_ALLOWANCE, {
                    from: takerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
        });

        it('should not change erc20Balances if an order is expired', async () => {
            signedOrder = orderFactory.newSignedOrder({
                expirationTimeSeconds: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);

            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances).to.be.deep.equal(erc20Balances);
        });

        it('should log an error event if an order is expired', async () => {
            signedOrder = orderFactory.newSignedOrder({
                expirationTimeSeconds: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });

            const res = await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);
            expect(res.logs).to.have.length(1);
            const log = res.logs[0] as LogWithDecodedArgs<ExchangeStatusContractEventArgs>;
            const statusCode = log.args.statusId;
            expect(statusCode).to.be.equal(ExchangeStatus.ORDER_EXPIRED);
        });

        it('should log an error event if no value is filled', async () => {
            signedOrder = orderFactory.newSignedOrder({});
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);

            const res = await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);
            expect(res.logs).to.have.length(1);
            const log = res.logs[0] as LogWithDecodedArgs<ExchangeStatusContractEventArgs>;
            const statusCode = log.args.statusId;
            expect(statusCode).to.be.equal(ExchangeStatus.ORDER_FULLY_FILLED);
        });
    });

    describe('cancelOrder', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            signedOrder = orderFactory.newSignedOrder();
        });

        it('should throw if not sent by maker', async () => {
            return expect(exchangeWrapper.cancelOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should throw if makerAssetAmount is 0', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(0),
            });

            return expect(exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should throw if takerAssetAmount is 0', async () => {
            signedOrder = orderFactory.newSignedOrder({
                takerAssetAmount: new BigNumber(0),
            });

            return expect(exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should be able to cancel a full order', async () => {
            await exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount: signedOrder.takerAssetAmount.div(2),
            });

            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances).to.be.deep.equal(erc20Balances);
        });

        it('should log 1 event with correct arguments', async () => {
            const divisor = 2;
            const res = await exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            expect(res.logs).to.have.length(1);

            const log = res.logs[0] as LogWithDecodedArgs<CancelContractEventArgs>;
            const logArgs = log.args;

            expect(signedOrder.makerAddress).to.be.equal(logArgs.makerAddress);
            expect(signedOrder.feeRecipientAddress).to.be.equal(logArgs.feeRecipientAddress);
            expect(signedOrder.makerAssetData).to.be.equal(logArgs.makerAssetData);
            expect(signedOrder.takerAssetData).to.be.equal(logArgs.takerAssetData);
            expect(orderUtils.getOrderHashHex(signedOrder)).to.be.equal(logArgs.orderHash);
        });

        it('should log an error if already cancelled', async () => {
            await exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);

            const res = await exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            expect(res.logs).to.have.length(1);
            const log = res.logs[0] as LogWithDecodedArgs<ExchangeStatusContractEventArgs>;
            const statusCode = log.args.statusId;
            expect(statusCode).to.be.equal(ExchangeStatus.ORDER_CANCELLED);
        });

        it('should log error if order is expired', async () => {
            signedOrder = orderFactory.newSignedOrder({
                expirationTimeSeconds: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });

            const res = await exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            expect(res.logs).to.have.length(1);
            const log = res.logs[0] as LogWithDecodedArgs<ExchangeStatusContractEventArgs>;
            const statusCode = log.args.statusId;
            expect(statusCode).to.be.equal(ExchangeStatus.ORDER_EXPIRED);
        });
    });

    describe('cancelOrdersUpTo', () => {
        it('should fail to set makerEpoch less than current makerEpoch', async () => {
            const makerEpoch = new BigNumber(1);
            await exchangeWrapper.cancelOrdersUpToAsync(makerEpoch, makerAddress);
            const lesserMakerEpoch = new BigNumber(0);
            return expect(exchangeWrapper.cancelOrdersUpToAsync(lesserMakerEpoch, makerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should fail to set makerEpoch equal to existing makerEpoch', async () => {
            const makerEpoch = new BigNumber(1);
            await exchangeWrapper.cancelOrdersUpToAsync(makerEpoch, makerAddress);
            return expect(exchangeWrapper.cancelOrdersUpToAsync(makerEpoch, makerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should cancel only orders with a makerEpoch less than existing makerEpoch', async () => {
            // Cancel all transactions with a makerEpoch less than 1
            const makerEpoch = new BigNumber(1);
            await exchangeWrapper.cancelOrdersUpToAsync(makerEpoch, makerAddress);

            // Create 3 orders with makerEpoch values: 0,1,2,3
            // Since we cancelled with makerEpoch=1, orders with makerEpoch<=1 will not be processed
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            const signedOrders = [
                orderFactory.newSignedOrder({
                    makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(9), 18),
                    takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(9), 18),
                    salt: new BigNumber(0),
                }),
                orderFactory.newSignedOrder({
                    makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(79), 18),
                    takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(79), 18),
                    salt: new BigNumber(1),
                }),
                orderFactory.newSignedOrder({
                    makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(979), 18),
                    takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(979), 18),
                    salt: new BigNumber(2),
                }),
                orderFactory.newSignedOrder({
                    makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(7979), 18),
                    takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(7979), 18),
                    salt: new BigNumber(3),
                }),
            ];
            await exchangeWrapper.batchFillOrdersNoThrowAsync(signedOrders, takerAddress);

            const newBalances = await erc20Wrapper.getBalancesAsync();
            const fillMakerAssetAmount = signedOrders[2].makerAssetAmount.add(signedOrders[3].makerAssetAmount);
            const fillTakerAssetAmount = signedOrders[2].takerAssetAmount.add(signedOrders[3].takerAssetAmount);
            const makerFee = signedOrders[2].makerFee.add(signedOrders[3].makerFee);
            const takerFee = signedOrders[2].takerFee.add(signedOrders[3].takerFee);
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(fillMakerAssetAmount),
            );
            expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultTakerAssetAddress].add(fillTakerAssetAmount),
            );
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(makerFee),
            );
            expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultTakerAssetAddress].minus(fillTakerAssetAmount),
            );
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].add(fillMakerAssetAmount),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].minus(takerFee),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(makerFee.add(takerFee)),
            );
        });
    });

    describe('Testing Exchange of ERC721 Tokens', () => {
        it('should successfully exchange a single token between the maker and taker (via fillOrder)', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            const takerAssetId = erc721TakerAssetIds[1];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: assetProxyUtils.encodeERC721ProxyData(erc721Token.address, makerAssetId),
                takerAssetData: assetProxyUtils.encodeERC721ProxyData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            const res = await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            // Verify post-conditions
            const newOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(newOwnerMakerAsset).to.be.bignumber.equal(takerAddress);
            const newOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(newOwnerTakerAsset).to.be.bignumber.equal(makerAddress);
        });

        it('should throw when maker does not own the token with id makerAssetId', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721TakerAssetIds[0];
            const takerAssetId = erc721TakerAssetIds[1];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: assetProxyUtils.encodeERC721ProxyData(erc721Token.address, makerAssetId),
                takerAssetData: assetProxyUtils.encodeERC721ProxyData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.not.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            return expect(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw when taker does not own the token with id takerAssetId', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            const takerAssetId = erc721MakerAssetIds[1];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: assetProxyUtils.encodeERC721ProxyData(erc721Token.address, makerAssetId),
                takerAssetData: assetProxyUtils.encodeERC721ProxyData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.not.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            return expect(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw when makerAssetAmount is greater than 1', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            const takerAssetId = erc721TakerAssetIds[0];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(2),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: assetProxyUtils.encodeERC721ProxyData(erc721Token.address, makerAssetId),
                takerAssetData: assetProxyUtils.encodeERC721ProxyData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            return expect(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw when takerAssetAmount is greater than 1', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            const takerAssetId = erc721TakerAssetIds[0];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(500),
                makerAssetData: assetProxyUtils.encodeERC721ProxyData(erc721Token.address, makerAssetId),
                takerAssetData: assetProxyUtils.encodeERC721ProxyData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            return expect(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw on partial fill', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            const takerAssetId = erc721TakerAssetIds[0];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(0),
                makerAssetData: assetProxyUtils.encodeERC721ProxyData(erc721Token.address, makerAssetId),
                takerAssetData: assetProxyUtils.encodeERC721ProxyData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            return expect(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should successfully fill order when makerAsset is ERC721 and takerAsset is ERC20', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                makerAssetData: assetProxyUtils.encodeERC721ProxyData(erc721Token.address, makerAssetId),
                takerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultTakerAssetAddress),
            });
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            // Call Exchange
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            // Verify ERC721 token was transferred from Maker to Taker
            const newOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(newOwnerMakerAsset).to.be.bignumber.equal(takerAddress);
            // Verify ERC20 tokens were transferred from Taker to Maker & fees were paid correctly
            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances[makerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultTakerAssetAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultTakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultTakerAssetAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(signedOrder.makerFee),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].minus(signedOrder.takerFee),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(
                    signedOrder.makerFee.add(signedOrder.takerFee),
                ),
            );
        });

        it('should successfully fill order when makerAsset is ERC20 and takerAsset is ERC721', async () => {
            // Construct Exchange parameters
            const takerAssetId = erc721TakerAssetIds[0];
            signedOrder = orderFactory.newSignedOrder({
                takerAssetAmount: new BigNumber(1),
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetData: assetProxyUtils.encodeERC721ProxyData(erc721Token.address, takerAssetId),
                makerAssetData: assetProxyUtils.encodeERC20ProxyData(defaultMakerAssetAddress),
            });
            // Verify pre-conditions
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            // Verify ERC721 token was transferred from Taker to Maker
            const newOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(newOwnerTakerAsset).to.be.bignumber.equal(makerAddress);
            // Verify ERC20 tokens were transferred from Maker to Taker & fees were paid correctly
            const newBalances = await erc20Wrapper.getBalancesAsync();
            expect(newBalances[takerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[takerAddress][defaultMakerAssetAddress].add(signedOrder.makerAssetAmount),
            );
            expect(newBalances[makerAddress][defaultMakerAssetAddress]).to.be.bignumber.equal(
                erc20Balances[makerAddress][defaultMakerAssetAddress].minus(signedOrder.makerAssetAmount),
            );
            expect(newBalances[makerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[makerAddress][zrxToken.address].minus(signedOrder.makerFee),
            );
            expect(newBalances[takerAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[takerAddress][zrxToken.address].minus(signedOrder.takerFee),
            );
            expect(newBalances[feeRecipientAddress][zrxToken.address]).to.be.bignumber.equal(
                erc20Balances[feeRecipientAddress][zrxToken.address].add(
                    signedOrder.makerFee.add(signedOrder.takerFee),
                ),
            );
        });
    });
}); // tslint:disable-line:max-file-line-count
