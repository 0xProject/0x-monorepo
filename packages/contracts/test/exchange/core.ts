import { LogWithDecodedArgs, TransactionReceiptWithDecodedLogs, ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { AssetProxyDispatcherContract } from '../../src/contract_wrappers/generated/asset_proxy_dispatcher';
import { DummyERC20TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c20_token';
import { DummyERC721TokenContract } from '../../src/contract_wrappers/generated/dummy_e_r_c721_token';
import { ERC20ProxyContract } from '../../src/contract_wrappers/generated/e_r_c20_proxy';
import { ERC721ProxyContract } from '../../src/contract_wrappers/generated/e_r_c721_proxy';
import {
    CancelContractEventArgs,
    ExchangeContract,
    ExchangeErrorContractEventArgs,
    FillContractEventArgs,
} from '../../src/contract_wrappers/generated/exchange';
import { proxyUtils } from '../../src/utils/asset_proxy_utils';
import { Balances } from '../../src/utils/balances';
import { constants } from '../../src/utils/constants';
import { crypto } from '../../src/utils/crypto';
import { ExchangeWrapper } from '../../src/utils/exchange_wrapper';
import { OrderFactory } from '../../src/utils/order_factory';
import { orderUtils } from '../../src/utils/order_utils';
import {
    AssetProxyId,
    BalancesByOwner,
    ContractName,
    ExchangeContractErrs,
    SignatureType,
    SignedOrder,
} from '../../src/utils/types';
import { chaiSetup } from '../utils/chai_setup';
import { deployer } from '../utils/deployer';
import { provider, web3Wrapper } from '../utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Exchange', () => {
    let makerAddress: string;
    let tokenOwner: string;
    let takerAddress: string;
    let feeRecipientAddress: string;
    const INITIAL_BALANCE = ZeroEx.toBaseUnitAmount(new BigNumber(10000), 18);
    const INITIAL_ALLOWANCE = ZeroEx.toBaseUnitAmount(new BigNumber(10000), 18);

    let rep: DummyERC20TokenContract;
    let dgd: DummyERC20TokenContract;
    let zrx: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let exchange: ExchangeContract;
    let assetProxyDispatcher: AssetProxyDispatcherContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;

    let signedOrder: SignedOrder;
    let balances: BalancesByOwner;
    let exWrapper: ExchangeWrapper;
    let dmyBalances: Balances;
    let orderFactory: OrderFactory;

    const erc721MakerTokenIds = [
        new BigNumber('0x1010101010101010101010101010101010101010101010101010101010101010'),
        new BigNumber('0x2020202020202020202020202020202020202020202020202020202020202020'),
    ];

    const erc721TakerTokenIds = [
        new BigNumber('0x3030303030303030303030303030303030303030303030303030303030303030'),
        new BigNumber('0x4040404040404040404040404040404040404040404040404040404040404040'),
    ];

    let defaultMakerTokenAddress: string;
    let defaultTakerTokenAddress: string;

    let zeroEx: ZeroEx;

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        makerAddress = accounts[0];
        [tokenOwner, takerAddress, feeRecipientAddress] = accounts;
        const owner = tokenOwner;
        const [repInstance, dgdInstance, zrxInstance, erc721TokenInstance] = await Promise.all([
            deployer.deployAsync(ContractName.DummyERC20Token, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyERC20Token, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyERC20Token, constants.DUMMY_TOKEN_ARGS),
            deployer.deployAsync(ContractName.DummyERC721Token, constants.DUMMY_ERC721TOKEN_ARGS),
        ]);
        rep = new DummyERC20TokenContract(repInstance.abi, repInstance.address, provider);
        dgd = new DummyERC20TokenContract(dgdInstance.abi, dgdInstance.address, provider);
        zrx = new DummyERC20TokenContract(zrxInstance.abi, zrxInstance.address, provider);
        erc721Token = new DummyERC721TokenContract(erc721TokenInstance.abi, erc721TokenInstance.address, provider);
        // Deploy Asset Proxy Dispatcher
        const assetProxyDispatcherInstance = await deployer.deployAsync(ContractName.AssetProxyDispatcher);
        assetProxyDispatcher = new AssetProxyDispatcherContract(
            assetProxyDispatcherInstance.abi,
            assetProxyDispatcherInstance.address,
            provider,
        );
        // Deploy ERC20 Proxy
        const erc20ProxyInstance = await deployer.deployAsync(ContractName.ERC20Proxy);
        erc20Proxy = new ERC20ProxyContract(erc20ProxyInstance.abi, erc20ProxyInstance.address, provider);
        await erc20Proxy.addAuthorizedAddress.sendTransactionAsync(assetProxyDispatcher.address, {
            from: owner,
        });
        const prevERC20ProxyAddress = ZeroEx.NULL_ADDRESS;
        await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(
            AssetProxyId.ERC20,
            erc20Proxy.address,
            prevERC20ProxyAddress,
            { from: owner },
        );
        // Deploy ERC721 Proxy
        const erc721ProxyInstance = await deployer.deployAsync(ContractName.ERC721Proxy);
        erc721Proxy = new ERC721ProxyContract(erc721ProxyInstance.abi, erc721ProxyInstance.address, provider);
        await erc721Proxy.addAuthorizedAddress.sendTransactionAsync(assetProxyDispatcher.address, {
            from: owner,
        });
        const prevERC721ProxyAddress = ZeroEx.NULL_ADDRESS;
        await assetProxyDispatcher.registerAssetProxy.sendTransactionAsync(
            AssetProxyId.ERC721,
            erc721Proxy.address,
            prevERC721ProxyAddress,
            { from: owner },
        );
        // Deploy and configure Exchange
        const exchangeInstance = await deployer.deployAsync(ContractName.Exchange, [
            assetProxyDispatcher.address,
            proxyUtils.encodeERC20ProxyData(zrx.address),
        ]);
        exchange = new ExchangeContract(exchangeInstance.abi, exchangeInstance.address, provider);
        await assetProxyDispatcher.addAuthorizedAddress.sendTransactionAsync(exchange.address, { from: owner });
        zeroEx = new ZeroEx(provider, {
            exchangeContractAddress: exchange.address,
            networkId: constants.TESTRPC_NETWORK_ID,
        });
        exWrapper = new ExchangeWrapper(exchange, zeroEx);

        defaultMakerTokenAddress = rep.address;
        defaultTakerTokenAddress = dgd.address;

        const defaultOrderParams = {
            exchangeAddress: exchange.address,
            makerAddress,
            feeRecipientAddress,
            makerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
            takerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            makerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
            takerFee: ZeroEx.toBaseUnitAmount(new BigNumber(1), 18),
            makerAssetData: proxyUtils.encodeERC20ProxyData(defaultMakerTokenAddress),
            takerAssetData: proxyUtils.encodeERC20ProxyData(defaultTakerTokenAddress),
        };
        const privateKey = constants.TESTRPC_PRIVATE_KEYS[0];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
        dmyBalances = new Balances([rep, dgd, zrx], [makerAddress, takerAddress, feeRecipientAddress]);
        await Promise.all([
            rep.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, {
                from: makerAddress,
            }),
            rep.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, {
                from: takerAddress,
            }),
            rep.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            rep.setBalance.sendTransactionAsync(takerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            dgd.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, {
                from: makerAddress,
            }),
            dgd.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, {
                from: takerAddress,
            }),
            dgd.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            dgd.setBalance.sendTransactionAsync(takerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            zrx.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, {
                from: makerAddress,
            }),
            zrx.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, {
                from: takerAddress,
            }),
            zrx.setBalance.sendTransactionAsync(makerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            zrx.setBalance.sendTransactionAsync(takerAddress, INITIAL_BALANCE, { from: tokenOwner }),
            erc721Token.setApprovalForAll.sendTransactionAsync(erc721Proxy.address, true, {
                from: makerAddress,
            }),
            erc721Token.setApprovalForAll.sendTransactionAsync(erc721Proxy.address, true, {
                from: takerAddress,
            }),
            erc721Token.mint.sendTransactionAsync(makerAddress, erc721MakerTokenIds[0], { from: tokenOwner }),
            erc721Token.mint.sendTransactionAsync(makerAddress, erc721MakerTokenIds[1], { from: tokenOwner }),
            erc721Token.mint.sendTransactionAsync(takerAddress, erc721TakerTokenIds[0], { from: tokenOwner }),
            erc721Token.mint.sendTransactionAsync(takerAddress, erc721TakerTokenIds[1], { from: tokenOwner }),
        ]);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('internal functions', () => {
        it('should include transferViaTokenTransferProxy', () => {
            expect((exchange as any).transferViaTokenTransferProxy).to.be.undefined();
        });
    });

    describe('fillOrder', () => {
        beforeEach(async () => {
            balances = await dmyBalances.getAsync();
            signedOrder = orderFactory.newSignedOrder();
        });

        it('should create an unfillable order', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1001),
                takerAssetAmount: new BigNumber(3),
            });

            const takerAssetFilledAmountBefore = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerAssetFilledAmountBefore).to.be.bignumber.equal(0);

            const fillTakerTokenAmount1 = new BigNumber(2);
            await exWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount: fillTakerTokenAmount1,
            });

            const takerAssetFilledAmountAfter1 = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerAssetFilledAmountAfter1).to.be.bignumber.equal(fillTakerTokenAmount1);

            const fillTakerTokenAmount2 = new BigNumber(1);
            await exWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount: fillTakerTokenAmount2,
            });

            const takerAssetFilledAmountAfter2 = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerAssetFilledAmountAfter2).to.be.bignumber.equal(takerAssetFilledAmountAfter1);
        });

        it('should transfer the correct amounts when makerAssetAmount === takerAssetAmount', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
            });

            const takerAssetFilledAmountBefore = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerAssetFilledAmountBefore).to.be.bignumber.equal(0);

            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });

            const makerAmountBoughtAfter = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(makerAmountBoughtAfter).to.be.bignumber.equal(takerAssetFillAmount);

            const newBalances = await dmyBalances.getAsync();

            const makerAssetFilledAmount = takerAssetFillAmount
                .times(signedOrder.makerAssetAmount)
                .dividedToIntegerBy(signedOrder.takerAssetAmount);
            const makerFeePaid = signedOrder.makerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            const takerFeePaid = signedOrder.takerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            expect(newBalances[makerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultMakerTokenAddress].minus(makerAssetFilledAmount),
            );
            expect(newBalances[makerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultTakerTokenAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                balances[makerAddress][zrx.address].minus(makerFeePaid),
            );
            expect(newBalances[takerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultTakerTokenAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultMakerTokenAddress].add(makerAssetFilledAmount),
            );
            expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                balances[takerAddress][zrx.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipientAddress][zrx.address].add(makerFeePaid.add(takerFeePaid)),
            );
        });

        it('should transfer the correct amounts when makerAssetAmount > takerAssetAmount', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
                takerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
            });

            const takerAssetFilledAmountBefore = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerAssetFilledAmountBefore).to.be.bignumber.equal(0);

            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });

            const makerAmountBoughtAfter = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(makerAmountBoughtAfter).to.be.bignumber.equal(takerAssetFillAmount);

            const newBalances = await dmyBalances.getAsync();

            const makerAssetFilledAmount = takerAssetFillAmount
                .times(signedOrder.makerAssetAmount)
                .dividedToIntegerBy(signedOrder.takerAssetAmount);
            const makerFeePaid = signedOrder.makerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            const takerFeePaid = signedOrder.takerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            expect(newBalances[makerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultMakerTokenAddress].minus(makerAssetFilledAmount),
            );
            expect(newBalances[makerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultTakerTokenAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                balances[makerAddress][zrx.address].minus(makerFeePaid),
            );
            expect(newBalances[takerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultTakerTokenAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultMakerTokenAddress].add(makerAssetFilledAmount),
            );
            expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                balances[takerAddress][zrx.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipientAddress][zrx.address].add(makerFeePaid.add(takerFeePaid)),
            );
        });

        it('should transfer the correct amounts when makerAssetAmount < takerAssetAmount', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            });

            const takerAssetFilledAmountBefore = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerAssetFilledAmountBefore).to.be.bignumber.equal(0);

            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });

            const makerAmountBoughtAfter = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(makerAmountBoughtAfter).to.be.bignumber.equal(takerAssetFillAmount);

            const newBalances = await dmyBalances.getAsync();

            const makerAssetFilledAmount = takerAssetFillAmount
                .times(signedOrder.makerAssetAmount)
                .dividedToIntegerBy(signedOrder.takerAssetAmount);
            const makerFeePaid = signedOrder.makerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            const takerFeePaid = signedOrder.takerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            expect(newBalances[makerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultMakerTokenAddress].minus(makerAssetFilledAmount),
            );
            expect(newBalances[makerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultTakerTokenAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                balances[makerAddress][zrx.address].minus(makerFeePaid),
            );
            expect(newBalances[takerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultTakerTokenAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultMakerTokenAddress].add(makerAssetFilledAmount),
            );
            expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                balances[takerAddress][zrx.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipientAddress][zrx.address].add(makerFeePaid.add(takerFeePaid)),
            );
        });

        it('should transfer the correct amounts when taker is specified and order is claimed by taker', async () => {
            signedOrder = orderFactory.newSignedOrder({
                takerAddress,
                makerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            });

            const takerAssetFilledAmountBefore = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            expect(takerAssetFilledAmountBefore).to.be.bignumber.equal(0);

            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });

            const makerAmountBoughtAfter = await exWrapper.getTakerTokenFilledAmount(
                orderUtils.getOrderHashHex(signedOrder),
            );
            const expectedMakerAmountBoughtAfter = takerAssetFillAmount.add(takerAssetFilledAmountBefore);
            expect(makerAmountBoughtAfter).to.be.bignumber.equal(expectedMakerAmountBoughtAfter);

            const newBalances = await dmyBalances.getAsync();

            const makerAssetFilledAmount = takerAssetFillAmount
                .times(signedOrder.makerAssetAmount)
                .dividedToIntegerBy(signedOrder.takerAssetAmount);
            const makerFeePaid = signedOrder.makerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            const takerFeePaid = signedOrder.takerFee
                .times(makerAssetFilledAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount);
            expect(newBalances[makerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultMakerTokenAddress].minus(makerAssetFilledAmount),
            );
            expect(newBalances[makerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultTakerTokenAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                balances[makerAddress][zrx.address].minus(makerFeePaid),
            );
            expect(newBalances[takerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultTakerTokenAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultMakerTokenAddress].add(makerAssetFilledAmount),
            );
            expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                balances[takerAddress][zrx.address].minus(takerFeePaid),
            );
            expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipientAddress][zrx.address].add(makerFeePaid.add(takerFeePaid)),
            );
        });

        it('should fill remaining value if takerAssetFillAmount > remaining takerAssetAmount', async () => {
            const takerAssetFillAmount = signedOrder.takerAssetAmount.div(2);
            await exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });

            const res = await exWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount: signedOrder.takerAssetAmount,
            });
            const log = res.logs[0] as LogWithDecodedArgs<FillContractEventArgs>;
            expect(log.args.takerAssetFilledAmount).to.be.bignumber.equal(
                signedOrder.takerAssetAmount.minus(takerAssetFillAmount),
            );
            const newBalances = await dmyBalances.getAsync();

            expect(newBalances[makerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultMakerTokenAddress].minus(signedOrder.makerAssetAmount),
            );
            expect(newBalances[makerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultTakerTokenAddress].add(signedOrder.takerAssetAmount),
            );
            expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                balances[makerAddress][zrx.address].minus(signedOrder.makerFee),
            );
            expect(newBalances[takerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultTakerTokenAddress].minus(signedOrder.takerAssetAmount),
            );
            expect(newBalances[takerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultMakerTokenAddress].add(signedOrder.makerAssetAmount),
            );
            expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                balances[takerAddress][zrx.address].minus(signedOrder.takerFee),
            );
            expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipientAddress][zrx.address].add(signedOrder.makerFee.add(signedOrder.takerFee)),
            );
        });

        it('should log 1 event with the correct arguments when order has a feeRecipient', async () => {
            const divisor = 2;
            const res = await exWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount: signedOrder.takerAssetAmount.div(divisor),
            });
            expect(res.logs).to.have.length(1);

            const log = res.logs[0] as LogWithDecodedArgs<FillContractEventArgs>;
            const logArgs = log.args;
            const expectedFilledMakerTokenAmount = signedOrder.makerAssetAmount.div(divisor);
            const expectedFilledTakerTokenAmount = signedOrder.takerAssetAmount.div(divisor);
            const expectedFeeMPaid = signedOrder.makerFee.div(divisor);
            const expectedFeeTPaid = signedOrder.takerFee.div(divisor);

            expect(signedOrder.makerAddress).to.be.equal(logArgs.makerAddress);
            expect(takerAddress).to.be.equal(logArgs.takerAddress);
            expect(signedOrder.feeRecipientAddress).to.be.equal(logArgs.feeRecipientAddress);
            expect(signedOrder.makerAssetData).to.be.equal(logArgs.makerAssetData);
            expect(signedOrder.takerAssetData).to.be.equal(logArgs.takerAssetData);
            expect(expectedFilledMakerTokenAmount).to.be.bignumber.equal(logArgs.makerAssetFilledAmount);
            expect(expectedFilledTakerTokenAmount).to.be.bignumber.equal(logArgs.takerAssetFilledAmount);
            expect(expectedFeeMPaid).to.be.bignumber.equal(logArgs.makerFeePaid);
            expect(expectedFeeTPaid).to.be.bignumber.equal(logArgs.takerFeePaid);
            expect(orderUtils.getOrderHashHex(signedOrder)).to.be.equal(logArgs.orderHash);
        });

        it('should log 1 event with the correct arguments when order has no feeRecipient', async () => {
            signedOrder = orderFactory.newSignedOrder({
                feeRecipientAddress: ZeroEx.NULL_ADDRESS,
            });
            const divisor = 2;
            const res = await exWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount: signedOrder.takerAssetAmount.div(divisor),
            });
            expect(res.logs).to.have.length(1);

            const log = res.logs[0] as LogWithDecodedArgs<FillContractEventArgs>;
            const logArgs = log.args;
            const expectedFilledMakerTokenAmount = signedOrder.makerAssetAmount.div(divisor);
            const expectedFilledTakerTokenAmount = signedOrder.takerAssetAmount.div(divisor);
            const expectedFeeMPaid = new BigNumber(0);
            const expectedFeeTPaid = new BigNumber(0);

            expect(signedOrder.makerAddress).to.be.equal(logArgs.makerAddress);
            expect(takerAddress).to.be.equal(logArgs.takerAddress);
            expect(signedOrder.feeRecipientAddress).to.be.equal(logArgs.feeRecipientAddress);
            expect(signedOrder.makerAssetData).to.be.equal(logArgs.makerAssetData);
            expect(signedOrder.takerAssetData).to.be.equal(logArgs.takerAssetData);
            expect(expectedFilledMakerTokenAmount).to.be.bignumber.equal(logArgs.makerAssetFilledAmount);
            expect(expectedFilledTakerTokenAmount).to.be.bignumber.equal(logArgs.takerAssetFilledAmount);
            expect(expectedFeeMPaid).to.be.bignumber.equal(logArgs.makerFeePaid);
            expect(expectedFeeTPaid).to.be.bignumber.equal(logArgs.takerFeePaid);
            expect(orderUtils.getOrderHashHex(signedOrder)).to.be.equal(logArgs.orderHash);
        });

        it('should throw when taker is specified and order is claimed by other', async () => {
            signedOrder = orderFactory.newSignedOrder({
                takerAddress: feeRecipientAddress,
                makerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(200), 18),
            });
            return expect(exWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if signature is invalid', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(10), 18),
            });

            const invalidR = ethUtil.sha3('invalidR');
            const invalidS = ethUtil.sha3('invalidS');
            const signatureTypeAndV = signedOrder.signature.slice(0, 6);
            const invalidSigBuff = Buffer.concat([ethUtil.toBuffer(signatureTypeAndV), invalidR, invalidS]);
            const invalidSigHex = `0x${invalidSigBuff.toString('hex')}`;
            signedOrder.signature = invalidSigHex;
            return expect(exWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if makerAssetAmount is 0', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(0),
            });

            return expect(exWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if takerAssetAmount is 0', async () => {
            signedOrder = orderFactory.newSignedOrder({
                takerAssetAmount: new BigNumber(0),
            });

            return expect(exWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if takerAssetFillAmount is 0', async () => {
            signedOrder = orderFactory.newSignedOrder();

            return expect(
                exWrapper.fillOrderAsync(signedOrder, takerAddress, {
                    takerAssetFillAmount: new BigNumber(0),
                }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if maker balances are too low to fill order', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            return expect(exWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if taker balances are too low to fill order', async () => {
            signedOrder = orderFactory.newSignedOrder({
                takerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100000), 18),
            });

            return expect(exWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if maker allowances are too low to fill order', async () => {
            await rep.approve.sendTransactionAsync(erc20Proxy.address, new BigNumber(0), {
                from: makerAddress,
            });
            expect(exWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(constants.REVERT);
            await rep.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, {
                from: makerAddress,
            });
        });

        it('should throw if taker allowances are too low to fill order', async () => {
            await dgd.approve.sendTransactionAsync(erc20Proxy.address, new BigNumber(0), {
                from: takerAddress,
            });
            expect(exWrapper.fillOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(constants.REVERT);
            await dgd.approve.sendTransactionAsync(erc20Proxy.address, INITIAL_ALLOWANCE, {
                from: takerAddress,
            });
        });

        it('should not change balances if an order is expired', async () => {
            signedOrder = orderFactory.newSignedOrder({
                expirationTimeSeconds: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });
            await exWrapper.fillOrderAsync(signedOrder, takerAddress);

            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should log an error event if an order is expired', async () => {
            signedOrder = orderFactory.newSignedOrder({
                expirationTimeSeconds: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });

            const res = await exWrapper.fillOrderAsync(signedOrder, takerAddress);
            expect(res.logs).to.have.length(1);
            const log = res.logs[0] as LogWithDecodedArgs<ExchangeErrorContractEventArgs>;
            const errCode = log.args.errorId;
            expect(errCode).to.be.equal(ExchangeContractErrs.ERROR_ORDER_EXPIRED);
        });

        it('should log an error event if no value is filled', async () => {
            signedOrder = orderFactory.newSignedOrder({});
            await exWrapper.fillOrderAsync(signedOrder, takerAddress);

            const res = await exWrapper.fillOrderAsync(signedOrder, takerAddress);
            expect(res.logs).to.have.length(1);
            const log = res.logs[0] as LogWithDecodedArgs<ExchangeErrorContractEventArgs>;
            const errCode = log.args.errorId;
            expect(errCode).to.be.equal(ExchangeContractErrs.ERROR_ORDER_FULLY_FILLED);
        });
    });

    describe('cancelOrder', () => {
        beforeEach(async () => {
            balances = await dmyBalances.getAsync();
            signedOrder = orderFactory.newSignedOrder();
        });

        it('should throw if not sent by maker', async () => {
            return expect(exWrapper.cancelOrderAsync(signedOrder, takerAddress)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if makerAssetAmount is 0', async () => {
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(0),
            });

            return expect(exWrapper.cancelOrderAsync(signedOrder, makerAddress)).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw if takerAssetAmount is 0', async () => {
            signedOrder = orderFactory.newSignedOrder({
                takerAssetAmount: new BigNumber(0),
            });

            return expect(exWrapper.cancelOrderAsync(signedOrder, makerAddress)).to.be.rejectedWith(constants.REVERT);
        });

        it('should be able to cancel a full order', async () => {
            await exWrapper.cancelOrderAsync(signedOrder, makerAddress);
            await exWrapper.fillOrderAsync(signedOrder, takerAddress, {
                takerAssetFillAmount: signedOrder.takerAssetAmount.div(2),
            });

            const newBalances = await dmyBalances.getAsync();
            expect(newBalances).to.be.deep.equal(balances);
        });

        it('should log 1 event with correct arguments', async () => {
            const divisor = 2;
            const res = await exWrapper.cancelOrderAsync(signedOrder, makerAddress);
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
            await exWrapper.cancelOrderAsync(signedOrder, makerAddress);

            const res = await exWrapper.cancelOrderAsync(signedOrder, makerAddress);
            expect(res.logs).to.have.length(1);
            const log = res.logs[0] as LogWithDecodedArgs<ExchangeErrorContractEventArgs>;
            const errCode = log.args.errorId;
            expect(errCode).to.be.equal(ExchangeContractErrs.ERROR_ORDER_CANCELLED);
        });

        it('should log error if order is expired', async () => {
            signedOrder = orderFactory.newSignedOrder({
                expirationTimeSeconds: new BigNumber(Math.floor((Date.now() - 10000) / 1000)),
            });

            const res = await exWrapper.cancelOrderAsync(signedOrder, makerAddress);
            expect(res.logs).to.have.length(1);
            const log = res.logs[0] as LogWithDecodedArgs<ExchangeErrorContractEventArgs>;
            const errCode = log.args.errorId;
            expect(errCode).to.be.equal(ExchangeContractErrs.ERROR_ORDER_EXPIRED);
        });
    });

    describe('cancelOrdersUpTo', () => {
        it('should fail to set makerEpoch less than current makerEpoch', async () => {
            const makerEpoch = new BigNumber(1);
            await exWrapper.cancelOrdersUpToAsync(makerEpoch, makerAddress);
            const lesserMakerEpoch = new BigNumber(0);
            return expect(exWrapper.cancelOrdersUpToAsync(lesserMakerEpoch, makerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should fail to set makerEpoch equal to existing makerEpoch', async () => {
            const makerEpoch = new BigNumber(1);
            await exWrapper.cancelOrdersUpToAsync(makerEpoch, makerAddress);
            return expect(exWrapper.cancelOrdersUpToAsync(makerEpoch, makerAddress)).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should cancel only orders with a makerEpoch less than existing makerEpoch', async () => {
            // Cancel all transactions with a makerEpoch less than 1
            const makerEpoch = new BigNumber(1);
            await exWrapper.cancelOrdersUpToAsync(makerEpoch, makerAddress);

            // Create 3 orders with makerEpoch values: 0,1,2,3
            // Since we cancelled with makerEpoch=1, orders with makerEpoch<=1 will not be processed
            balances = await dmyBalances.getAsync();
            const signedOrders = await Promise.all([
                orderFactory.newSignedOrder({
                    makerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(9), 18),
                    takerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(9), 18),
                    salt: new BigNumber(0),
                }),
                orderFactory.newSignedOrder({
                    makerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(79), 18),
                    takerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(79), 18),
                    salt: new BigNumber(1),
                }),
                orderFactory.newSignedOrder({
                    makerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(979), 18),
                    takerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(979), 18),
                    salt: new BigNumber(2),
                }),
                orderFactory.newSignedOrder({
                    makerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(7979), 18),
                    takerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(7979), 18),
                    salt: new BigNumber(3),
                }),
            ]);
            await exWrapper.batchFillOrdersNoThrowAsync(signedOrders, takerAddress);

            const newBalances = await dmyBalances.getAsync();
            const fillMakerTokenAmount = signedOrders[2].makerAssetAmount.add(signedOrders[3].makerAssetAmount);
            const fillTakerTokenAmount = signedOrders[2].takerAssetAmount.add(signedOrders[3].takerAssetAmount);
            const makerFee = signedOrders[2].makerFee.add(signedOrders[3].makerFee);
            const takerFee = signedOrders[2].takerFee.add(signedOrders[3].takerFee);
            expect(newBalances[makerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultMakerTokenAddress].minus(fillMakerTokenAmount),
            );
            expect(newBalances[makerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultTakerTokenAddress].add(fillTakerTokenAmount),
            );
            expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                balances[makerAddress][zrx.address].minus(makerFee),
            );
            expect(newBalances[takerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultTakerTokenAddress].minus(fillTakerTokenAmount),
            );
            expect(newBalances[takerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultMakerTokenAddress].add(fillMakerTokenAmount),
            );
            expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                balances[takerAddress][zrx.address].minus(takerFee),
            );
            expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipientAddress][zrx.address].add(makerFee.add(takerFee)),
            );
        });
    });

    describe('Testing Exchange of ERC721 Tokens', () => {
        it('should successfully exchange a single token between the maker and taker (via fillOrder)', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerTokenIds[0];
            const takerAssetId = erc721TakerTokenIds[1];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: proxyUtils.encodeERC721ProxyData(erc721Token.address, makerAssetId),
                takerAssetData: proxyUtils.encodeERC721ProxyData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerToken = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerToken).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerToken = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerToken).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            const res = await exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            // Verify post-conditions
            const newOwnerMakerToken = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(newOwnerMakerToken).to.be.bignumber.equal(takerAddress);
            const newOwnerTakerToken = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(newOwnerTakerToken).to.be.bignumber.equal(makerAddress);
        });

        it('should throw when maker does not own the token with id makerAssetId', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721TakerTokenIds[0];
            const takerAssetId = erc721TakerTokenIds[1];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: proxyUtils.encodeERC721ProxyData(erc721Token.address, makerAssetId),
                takerAssetData: proxyUtils.encodeERC721ProxyData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerToken = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerToken).to.be.bignumber.not.equal(makerAddress);
            const initialOwnerTakerToken = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerToken).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            return expect(
                exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw when taker does not own the token with id takerAssetId', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerTokenIds[0];
            const takerAssetId = erc721MakerTokenIds[1];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: proxyUtils.encodeERC721ProxyData(erc721Token.address, makerAssetId),
                takerAssetData: proxyUtils.encodeERC721ProxyData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerToken = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerToken).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerToken = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerToken).to.be.bignumber.not.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            return expect(
                exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw when makerAssetAmount is greater than 1', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerTokenIds[0];
            const takerAssetId = erc721TakerTokenIds[0];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(2),
                takerAssetAmount: new BigNumber(1),
                makerAssetData: proxyUtils.encodeERC721ProxyData(erc721Token.address, makerAssetId),
                takerAssetData: proxyUtils.encodeERC721ProxyData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerToken = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerToken).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerToken = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerToken).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            return expect(
                exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw when takerAssetAmount is greater than 1', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerTokenIds[0];
            const takerAssetId = erc721TakerTokenIds[0];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(500),
                makerAssetData: proxyUtils.encodeERC721ProxyData(erc721Token.address, makerAssetId),
                takerAssetData: proxyUtils.encodeERC721ProxyData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerToken = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerToken).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerToken = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerToken).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            return expect(
                exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should throw on partial fill', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerTokenIds[0];
            const takerAssetId = erc721TakerTokenIds[0];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: new BigNumber(0),
                makerAssetData: proxyUtils.encodeERC721ProxyData(erc721Token.address, makerAssetId),
                takerAssetData: proxyUtils.encodeERC721ProxyData(erc721Token.address, takerAssetId),
            });
            // Verify pre-conditions
            const initialOwnerMakerToken = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerToken).to.be.bignumber.equal(makerAddress);
            const initialOwnerTakerToken = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerToken).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            return expect(
                exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount }),
            ).to.be.rejectedWith(constants.REVERT);
        });

        it('should successfully fill order when makerAsset is ERC721 and takerAsset is ERC20', async () => {
            // Construct Exchange parameters
            const makerAssetId = erc721MakerTokenIds[0];
            signedOrder = orderFactory.newSignedOrder({
                makerAssetAmount: new BigNumber(1),
                takerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                makerAssetData: proxyUtils.encodeERC721ProxyData(erc721Token.address, makerAssetId),
                takerAssetData: proxyUtils.encodeERC20ProxyData(defaultTakerTokenAddress),
            });
            // Verify pre-conditions
            const initialOwnerMakerToken = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(initialOwnerMakerToken).to.be.bignumber.equal(makerAddress);
            // Call Exchange
            balances = await dmyBalances.getAsync();
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            await exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            // Verify ERC721 token was transferred from Maker to Taker
            const newOwnerMakerToken = await erc721Token.ownerOf.callAsync(makerAssetId);
            expect(newOwnerMakerToken).to.be.bignumber.equal(takerAddress);
            // Verify ERC20 tokens were transferred from Taker to Maker & fees were paid correctly
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances[makerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultTakerTokenAddress].add(takerAssetFillAmount),
            );
            expect(newBalances[takerAddress][defaultTakerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultTakerTokenAddress].minus(takerAssetFillAmount),
            );
            expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                balances[makerAddress][zrx.address].minus(signedOrder.makerFee),
            );
            expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                balances[takerAddress][zrx.address].minus(signedOrder.takerFee),
            );
            expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipientAddress][zrx.address].add(signedOrder.makerFee.add(signedOrder.takerFee)),
            );
        });

        it('should successfully fill order when makerAsset is ERC20 and takerAsset is ERC721', async () => {
            // Construct Exchange parameters
            const takerAssetId = erc721TakerTokenIds[0];
            signedOrder = orderFactory.newSignedOrder({
                takerAssetAmount: new BigNumber(1),
                makerAssetAmount: ZeroEx.toBaseUnitAmount(new BigNumber(100), 18),
                takerAssetData: proxyUtils.encodeERC721ProxyData(erc721Token.address, takerAssetId),
                makerAssetData: proxyUtils.encodeERC20ProxyData(defaultMakerTokenAddress),
            });
            // Verify pre-conditions
            const initialOwnerTakerToken = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(initialOwnerTakerToken).to.be.bignumber.equal(takerAddress);
            // Call Exchange
            balances = await dmyBalances.getAsync();
            const takerAssetFillAmount = signedOrder.takerAssetAmount;
            await exWrapper.fillOrderAsync(signedOrder, takerAddress, { takerAssetFillAmount });
            // Verify ERC721 token was transferred from Taker to Maker
            const newOwnerTakerToken = await erc721Token.ownerOf.callAsync(takerAssetId);
            expect(newOwnerTakerToken).to.be.bignumber.equal(makerAddress);
            // Verify ERC20 tokens were transferred from Maker to Taker & fees were paid correctly
            const newBalances = await dmyBalances.getAsync();
            expect(newBalances[takerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                balances[takerAddress][defaultMakerTokenAddress].add(signedOrder.makerAssetAmount),
            );
            expect(newBalances[makerAddress][defaultMakerTokenAddress]).to.be.bignumber.equal(
                balances[makerAddress][defaultMakerTokenAddress].minus(signedOrder.makerAssetAmount),
            );
            expect(newBalances[makerAddress][zrx.address]).to.be.bignumber.equal(
                balances[makerAddress][zrx.address].minus(signedOrder.makerFee),
            );
            expect(newBalances[takerAddress][zrx.address]).to.be.bignumber.equal(
                balances[takerAddress][zrx.address].minus(signedOrder.takerFee),
            );
            expect(newBalances[feeRecipientAddress][zrx.address]).to.be.bignumber.equal(
                balances[feeRecipientAddress][zrx.address].add(signedOrder.makerFee.add(signedOrder.takerFee)),
            );
        });
    });
}); // tslint:disable-line:max-file-line-count
