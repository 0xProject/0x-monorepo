import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { assetProxyUtils, orderHashUtils } from '@0xproject/order-utils';
import { AssetProxyId, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import ethUtil = require('ethereumjs-util');

import { DummyERC20TokenContract } from '../../src/generated_contract_wrappers/dummy_e_r_c20_token';
import { DummyERC721TokenContract } from '../../src/generated_contract_wrappers/dummy_e_r_c721_token';
import { ERC20ProxyContract } from '../../src/generated_contract_wrappers/e_r_c20_proxy';
import { ERC721ProxyContract } from '../../src/generated_contract_wrappers/e_r_c721_proxy';
import {
    CancelContractEventArgs,
    ExchangeContract,
    FillContractEventArgs,
} from '../../src/generated_contract_wrappers/exchange';
import { artifacts } from '../../src/utils/artifacts';
import { expectRevertOrAlwaysFailingTransactionAsync } from '../../src/utils/assertions';
import { chaiSetup } from '../../src/utils/chai_setup';
import { constants } from '../../src/utils/constants';
import { ERC20Wrapper } from '../../src/utils/erc20_wrapper';
import { ERC721Wrapper } from '../../src/utils/erc721_wrapper';
import { ExchangeWrapper } from '../../src/utils/exchange_wrapper';
import { OrderFactory } from '../../src/utils/order_factory';
import { ERC20BalancesByOwner } from '../../src/utils/types';
import { provider, txDefaults, web3Wrapper } from '../../src/utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe.only('Exchange core', () => {
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
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
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
            zrxToken.address,
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
            makerAssetData: assetProxyUtils.encodeERC20AssetData(defaultMakerAssetAddress),
            takerAssetData: assetProxyUtils.encodeERC20AssetData(defaultTakerAssetAddress),
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
    describe.only('fillOrder', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            signedOrder = orderFactory.newSignedOrder();
        });
        it.only('should transfer the correct amounts when makerAssetAmount === takerAssetAmount', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
            });

            const takerAssetFilledAmountBefore = await exchangeWrapper.getTakerAssetFilledAmountAsync(
                orderHashUtils.getOrderHashHex(signedOrder),
            );
            expect(takerAssetFilledAmountBefore).to.be.bignumber.equal(0);

            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            const res = await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            console.log(res.gasUsed);

            const makerAmountBoughtAfter = await exchangeWrapper.getTakerAssetFilledAmountAsync(
                orderHashUtils.getOrderHashHex(signedOrder),
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
                orderHashUtils.getOrderHashHex(signedOrder),
            );
            expect(takerAssetFilledAmountBefore).to.be.bignumber.equal(0);

            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });

            const makerAmountBoughtAfter = await exchangeWrapper.getTakerAssetFilledAmountAsync(
                orderHashUtils.getOrderHashHex(signedOrder),
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
                orderHashUtils.getOrderHashHex(signedOrder),
            );
            expect(takerAssetFilledAmountBefore).to.be.bignumber.equal(0);

            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });

            const makerAmountBoughtAfter = await exchangeWrapper.getTakerAssetFilledAmountAsync(
                orderHashUtils.getOrderHashHex(signedOrder),
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
                orderHashUtils.getOrderHashHex(signedOrder),
            );
            expect(takerAssetFilledAmountBefore).to.be.bignumber.equal(0);

            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });

            const makerAmountBoughtAfter = await exchangeWrapper.getTakerAssetFilledAmountAsync(
                orderHashUtils.getOrderHashHex(signedOrder),
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
            expect(takerAddress).to.be.equal(logArgs.senderAddress);
            expect(signedOrder.feeRecipientAddress).to.be.equal(logArgs.feeRecipientAddress);
            expect(signedOrder.makerAssetData).to.be.equal(logArgs.makerAssetData);
            expect(signedOrder.takerAssetData).to.be.equal(logArgs.takerAssetData);
            expect(expectedFilledMakerAssetAmount).to.be.bignumber.equal(logArgs.makerAssetFilledAmount);
            expect(expectedFilledTakerAssetAmount).to.be.bignumber.equal(logArgs.takerAssetFilledAmount);
            expect(expectedFeeMPaid).to.be.bignumber.equal(logArgs.makerFeePaid);
            expect(expectedFeeTPaid).to.be.bignumber.equal(logArgs.takerFeePaid);
            expect(orderHashUtils.getOrderHashHex(signedOrder)).to.be.equal(logArgs.orderHash);
        });

        it('should throw when taker is specified and order is claimed by other', async () => {
            signedOrder = orderFactory.newSignedOrder({
                takerAddress: feeRecipientAddress,
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(200), 18),
            });
            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress),
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
            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress),
            );
        });

        it('should throw if makerAssetAmount is 0', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(0),
            });

            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress),
            );
        });

        it('should throw if takerAssetAmount is 0', async () => {
            signedOrder = orderFactory.newSignedOrder({
                takerAssetAmount: new BigNumber(0),
            });

            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress),
            );
        });

        it('should throw if takerAssetFillAmount is 0', async () => {
            signedOrder = orderFactory.newSignedOrder();

            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                    takerAssetFillAmount: new BigNumber(0),
                }),
            );
        });

        it('should throw if maker erc20Balances are too low to fill order', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress),
            );
        });

        it('should throw if taker erc20Balances are too low to fill order', async () => {
            signedOrder = orderFactory.newSignedOrder({
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100000), 18),
            });
            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress),
            );
        });

        it('should throw if maker allowances are too low to fill order', async () => {
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20TokenA.approve.sendTransactionAsync(erc20Proxy.address, new BigNumber(0), {
                    from: makerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress),
            );
        });

        it('should throw if taker allowances are too low to fill order', async () => {
            await web3Wrapper.awaitTransactionSuccessAsync(
                await erc20TokenB.approve.sendTransactionAsync(erc20Proxy.address, new BigNumber(0), {
                    from: takerAddress,
                }),
                constants.AWAIT_TRANSACTION_MINED_MS,
            );
            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress),
            );
        });

        it('should throw if an order is expired', async () => {
            signedOrder = orderFactory.newSignedOrder({
                expirationTimeSeconds: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });
            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress),
            );
        });

        it('should throw if no value is filled', async () => {
            signedOrder = orderFactory.newSignedOrder();
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress);
            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress),
            );
        });
    });

    describe('cancelOrder', () => {
        beforeEach(async () => {
            erc20Balances = await erc20Wrapper.getBalancesAsync();
            signedOrder = orderFactory.newSignedOrder();
        });

        it('should throw if not sent by maker', async () => {
            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.cancelOrderAsync(signedOrder, takerAddress),
            );
        });

        it('should throw if makerAssetAmount is 0', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(0),
            });

            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress),
            );
        });

        it('should throw if takerAssetAmount is 0', async () => {
            signedOrder = orderFactory.newSignedOrder({
                takerAssetAmount: new BigNumber(0),
            });

            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress),
            );
        });

        it('should be able to cancel a full order', async () => {
            await exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                    takerAssetFillAmount: signedOrder.takerAssetAmount.div(2),
                }),
            );
        });

        it('should log 1 event with correct arguments', async () => {
            const res = await exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            expect(res.logs).to.have.length(1);

            const log = res.logs[0] as LogWithDecodedArgs<CancelContractEventArgs>;
            const logArgs = log.args;

            expect(signedOrder.makerAddress).to.be.equal(logArgs.makerAddress);
            expect(signedOrder.makerAddress).to.be.equal(logArgs.senderAddress);
            expect(signedOrder.feeRecipientAddress).to.be.equal(logArgs.feeRecipientAddress);
            expect(signedOrder.makerAssetData).to.be.equal(logArgs.makerAssetData);
            expect(signedOrder.takerAssetData).to.be.equal(logArgs.takerAssetData);
            expect(orderHashUtils.getOrderHashHex(signedOrder)).to.be.equal(logArgs.orderHash);
        });

        it('should throw if already cancelled', async () => {
            await exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress);
            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress),
            );
        });

        it('should throw if order is expired', async () => {
            signedOrder = orderFactory.newSignedOrder({
                expirationTimeSeconds: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });
            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.cancelOrderAsync(signedOrder, makerAddress),
            );
        });

        it('should throw if rounding error is greater than 0.1%', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1001),
                takerAssetAmount: new BigNumber(3),
            });

            const fillTakerAssetAmount1 = new BigNumber(2);
            await exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount: fillTakerAssetAmount1,
            });

            const fillTakerAssetAmount2 = new BigNumber(1);
            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, {
                    takerAssetFillAmount: fillTakerAssetAmount2,
                }),
            );
        });
    });

    describe('cancelOrdersUpTo', () => {
        it('should fail to set orderEpoch less than current orderEpoch', async () => {
            const orderEpoch = new BigNumber(1);
            await exchangeWrapper.cancelOrdersUpToAsync(orderEpoch, makerAddress);
            const lesserOrderEpoch = new BigNumber(0);
            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.cancelOrdersUpToAsync(lesserOrderEpoch, makerAddress),
            );
        });

        it('should fail to set orderEpoch equal to existing orderEpoch', async () => {
            const orderEpoch = new BigNumber(1);
            await exchangeWrapper.cancelOrdersUpToAsync(orderEpoch, makerAddress);
            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.cancelOrdersUpToAsync(orderEpoch, makerAddress),
            );
        });

        it('should cancel only orders with a orderEpoch less than existing orderEpoch', async () => {
            // Cancel all transactions with a orderEpoch less than 1
            const orderEpoch = new BigNumber(1);
            await exchangeWrapper.cancelOrdersUpToAsync(orderEpoch, makerAddress);

            // Create 3 orders with orderEpoch values: 0,1,2,3
            // Since we cancelled with orderEpoch=1, orders with orderEpoch<=1 will not be processed
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
            await exchangeWrapper.batchFillOrdersNoThrowAsync(signedOrders, takerAddress, {
                // HACK(albrow): We need to hardcode the gas estimate here because
                // the Geth gas estimator doesn't work with the way we use
                // delegatecall and swallow errors.
                gas: 490000,
            });

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
                makerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            // tslint:disable-next-line:no-unused-variable
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
                makerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.not.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount }),
            );
        });

        it('should throw when taker does not own the token with id takerAssetId', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            const takerAssetId = erc721MakerAssetIds[1];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.not.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount }),
            );
        });

        it('should throw when makerAssetAmount is greater than 1', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            const takerAssetId = erc721TakerAssetIds[0];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(2),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount }),
            );
        });

        it('should throw when takerAssetAmount is greater than 1', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            const takerAssetId = erc721TakerAssetIds[0];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(500),
                makerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount }),
            );
        });

        it('should throw on partial fill', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            const takerAssetId = erc721TakerAssetIds[0];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(0),
                makerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerAsset = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerAsset).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerAsset = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerAsset).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            return expectRevertOrAlwaysFailingTransactionAsync(
                exchangeWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount }),
            );
        });

        it('should successfully fill order when makerAsset is ERC721 and takerAsset is ERC20', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerAssetIds[0];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: Web3Wrapper.toBaseUnitAmount(new BigNumber(100), 18),
                makerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, makerAssetId),
                takerAssetData: assetProxyUtils.encodeERC20AssetData(defaultTakerAssetAddress),
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
                takerAssetData: assetProxyUtils.encodeERC721AssetData(erc721Token.address, takerAssetId),
                makerAssetData: assetProxyUtils.encodeERC20AssetData(defaultMakerAssetAddress),
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
});
// tslint:disable:max-file-line-count
// tslint:enable:no-unnecessary-type-assertion
