import {
    artifacts as proxyArtifacts,
    ERC20ProxyContract,
    ERC20Wrapper,
    ERC721ProxyContract,
    ERC721Wrapper,
    MultiAssetProxyContract,
} from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { DummyERC721TokenContract } from '@0x/contracts-erc721';
import { artifacts as exchangeArtifacts, ExchangeContract } from '@0x/contracts-exchange';
import {
    chaiSetup,
    constants,
    orderHashUtils,
    OrderFactory,
    OrderStatus,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { OrderTransferResults, SignedOrder } from '@0x/types';
import { BigNumber, providerUtils } from '@0x/utils';
import * as chai from 'chai';

import { artifacts, DevUtilsContract } from '@0x/contracts-dev-utils';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('OrderValidationUtils/OrderTransferSimulatorUtils', () => {
    let makerAddress: string;
    let takerAddress: string;
    let owner: string;
    let erc20AssetData: string;
    let erc20AssetData2: string;
    let erc721AssetData: string;
    let feeAssetData: string;

    let erc20Token: DummyERC20TokenContract;
    let erc20Token2: DummyERC20TokenContract;
    let feeErc20Token: DummyERC20TokenContract;
    let erc721Token: DummyERC721TokenContract;
    let exchange: ExchangeContract;
    let devUtils: DevUtilsContract;
    let erc20Proxy: ERC20ProxyContract;
    let erc721Proxy: ERC721ProxyContract;
    let multiAssetProxy: MultiAssetProxyContract;

    let signedOrder: SignedOrder;
    let orderFactory: OrderFactory;

    const tokenId = new BigNumber(123456789);

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });

    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        const usedAddresses = ([owner, makerAddress, takerAddress] = accounts.slice(0, 3));
        const chainId = await providerUtils.getChainIdAsync(provider);

        const erc20Wrapper = new ERC20Wrapper(provider, usedAddresses, owner);
        const erc721Wrapper = new ERC721Wrapper(provider, usedAddresses, owner);

        const numDummyErc20ToDeploy = 3;
        [erc20Token, erc20Token2, feeErc20Token] = await erc20Wrapper.deployDummyTokensAsync(
            numDummyErc20ToDeploy,
            constants.DUMMY_TOKEN_DECIMALS,
        );
        erc20Proxy = await erc20Wrapper.deployProxyAsync();

        [erc721Token] = await erc721Wrapper.deployDummyTokensAsync();
        erc721Proxy = await erc721Wrapper.deployProxyAsync();

        exchange = await ExchangeContract.deployFrom0xArtifactAsync(
            exchangeArtifacts.Exchange,
            provider,
            txDefaults,
            {},
            new BigNumber(chainId),
        );

        multiAssetProxy = await MultiAssetProxyContract.deployFrom0xArtifactAsync(
            proxyArtifacts.MultiAssetProxy,
            provider,
            txDefaults,
            artifacts,
        );

        await exchange.registerAssetProxy(erc20Proxy.address).awaitTransactionSuccessAsync({ from: owner });
        await exchange.registerAssetProxy(erc721Proxy.address).awaitTransactionSuccessAsync({ from: owner });
        await exchange.registerAssetProxy(multiAssetProxy.address).awaitTransactionSuccessAsync({ from: owner });
        await erc20Proxy.addAuthorizedAddress(exchange.address).awaitTransactionSuccessAsync({ from: owner });
        await erc721Proxy.addAuthorizedAddress(exchange.address).awaitTransactionSuccessAsync({ from: owner });

        devUtils = await DevUtilsContract.deployFrom0xArtifactAsync(
            artifacts.DevUtils,
            provider,
            txDefaults,
            artifacts,
            exchange.address,
        );

        feeAssetData = await devUtils.encodeERC20AssetData(feeErc20Token.address).callAsync();
        erc20AssetData = await devUtils.encodeERC20AssetData(erc20Token.address).callAsync();
        erc20AssetData2 = await devUtils.encodeERC20AssetData(erc20Token2.address).callAsync();
        erc721AssetData = await devUtils.encodeERC721AssetData(erc721Token.address, tokenId).callAsync();
        const defaultOrderParams = {
            ...constants.STATIC_ORDER_PARAMS,
            makerAddress,
            feeRecipientAddress: constants.NULL_ADDRESS,
            makerAssetData: erc20AssetData,
            takerAssetData: erc20AssetData2,
            makerFeeAssetData: feeAssetData,
            takerFeeAssetData: feeAssetData,
            exchangeAddress: exchange.address,
            chainId,
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

    describe('getTransferableAssetAmount', () => {
        it('should return the balance when balance < allowance', async () => {
            const balance = new BigNumber(123);
            const allowance = new BigNumber(456);
            await erc20Token.setBalance(makerAddress, balance).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, allowance).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            const transferableAmount = await devUtils
                .getTransferableAssetAmount(makerAddress, erc20AssetData)
                .callAsync();
            expect(transferableAmount).to.bignumber.equal(balance);
        });
        it('should return the allowance when allowance < balance', async () => {
            const balance = new BigNumber(456);
            const allowance = new BigNumber(123);
            await erc20Token.setBalance(makerAddress, balance).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, allowance).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            const transferableAmount = await devUtils
                .getTransferableAssetAmount(makerAddress, erc20AssetData)
                .callAsync();
            expect(transferableAmount).to.bignumber.equal(allowance);
        });
        it('should return the correct transferable amount for multiAssetData', async () => {
            const multiAssetData = await devUtils
                .encodeMultiAssetData([new BigNumber(1), new BigNumber(1)], [erc20AssetData, erc20AssetData2])
                .callAsync();
            const transferableAmount1 = new BigNumber(10);
            const transferableAmount2 = new BigNumber(5);
            await erc20Token.setBalance(makerAddress, transferableAmount1).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, transferableAmount1).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            await erc20Token2.setBalance(makerAddress, transferableAmount2).awaitTransactionSuccessAsync();
            await erc20Token2.approve(erc20Proxy.address, transferableAmount2).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            const transferableAmount = await devUtils
                .getTransferableAssetAmount(makerAddress, multiAssetData)
                .callAsync();
            expect(transferableAmount).to.bignumber.equal(transferableAmount2);
        });
    });
    describe('getOrderRelevantState', () => {
        beforeEach(async () => {
            signedOrder = await orderFactory.newSignedOrderAsync();
        });
        it('should return the correct orderInfo when the order is valid', async () => {
            const [orderInfo] = await devUtils.getOrderRelevantState(signedOrder, signedOrder.signature).callAsync();
            expect(orderInfo.orderHash).to.equal(orderHashUtils.getOrderHashHex(signedOrder));
            expect(orderInfo.orderStatus).to.equal(OrderStatus.Fillable);
            expect(orderInfo.orderTakerAssetFilledAmount).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should return isValidSignature=true when the signature is valid', async () => {
            const [, , isValidSignature] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(isValidSignature).to.equal(true);
        });
        it('should return isValidSignature=false when the signature is invalid', async () => {
            const invalidSignature = '0x01';
            const [, , isValidSignature] = await devUtils
                .getOrderRelevantState(signedOrder, invalidSignature)
                .callAsync();
            expect(isValidSignature).to.equal(false);
        });
        it('should return a fillableTakerAssetAmount of 0 when balances or allowances are insufficient', async () => {
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should return a fillableTakerAssetAmount of 0 when fee balances/allowances are insufficient', async () => {
            await erc20Token.setBalance(makerAddress, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should return a fillableTakerAssetAmount of 0 when balances/allowances of one asset within a multiAssetData are insufficient', async () => {
            const multiAssetData = await devUtils
                .encodeMultiAssetData([new BigNumber(1), new BigNumber(1)], [erc20AssetData, erc20AssetData2])
                .callAsync();
            signedOrder = await orderFactory.newSignedOrderAsync({ makerAssetData: multiAssetData });
            await erc20Token.setBalance(makerAddress, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should return the correct fillableTakerAssetAmount when fee balances/allowances are partially sufficient', async () => {
            await erc20Token.setBalance(makerAddress, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            const divisor = 4;
            await feeErc20Token
                .setBalance(makerAddress, signedOrder.makerFee.dividedToIntegerBy(divisor))
                .awaitTransactionSuccessAsync();
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(
                signedOrder.takerAssetAmount.dividedToIntegerBy(divisor),
            );
        });
        it('should return the correct fillableTakerAssetAmount when non-fee balances/allowances are partially sufficient', async () => {
            const divisor = 4;
            await erc20Token
                .setBalance(makerAddress, signedOrder.makerAssetAmount.dividedToIntegerBy(divisor))
                .awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            await feeErc20Token.setBalance(makerAddress, signedOrder.makerFee).awaitTransactionSuccessAsync();
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(
                signedOrder.takerAssetAmount.dividedToIntegerBy(divisor),
            );
        });
        it('should return the correct fillableTakerAssetAmount when balances/allowances of one asset within a multiAssetData are partially sufficient', async () => {
            const multiAssetData = await devUtils
                .encodeMultiAssetData([new BigNumber(1), new BigNumber(1)], [erc20AssetData, erc20AssetData2])
                .callAsync();
            signedOrder = await orderFactory.newSignedOrderAsync({ makerAssetData: multiAssetData });
            await erc20Token.setBalance(makerAddress, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            await feeErc20Token.setBalance(makerAddress, signedOrder.makerFee).awaitTransactionSuccessAsync();
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            const divisor = 4;
            await erc20Token2
                .setBalance(makerAddress, signedOrder.makerAssetAmount.dividedToIntegerBy(divisor))
                .awaitTransactionSuccessAsync();
            await erc20Token2
                .approve(erc20Proxy.address, signedOrder.makerAssetAmount.dividedToIntegerBy(divisor))
                .awaitTransactionSuccessAsync({
                    from: makerAddress,
                });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(
                signedOrder.takerAssetAmount.dividedToIntegerBy(divisor),
            );
        });
        it('should return a fillableTakerAssetAmount of 0 when non-fee balances/allowances are insufficient', async () => {
            await feeErc20Token.setBalance(makerAddress, signedOrder.makerFee).awaitTransactionSuccessAsync();
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should return a fillableTakerAssetAmount equal to the takerAssetAmount when the order is unfilled and balances/allowances are sufficient', async () => {
            await erc20Token.setBalance(makerAddress, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            await feeErc20Token.setBalance(makerAddress, signedOrder.makerFee).awaitTransactionSuccessAsync();
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(signedOrder.takerAssetAmount);
        });
        it('should return the correct fillableTakerAssetAmount when balances/allowances are partially sufficient and makerAsset=makerFeeAsset', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerAssetData: feeAssetData,
                makerAssetAmount: new BigNumber(10),
                takerAssetAmount: new BigNumber(20),
                makerFee: new BigNumber(40),
            });
            const transferableMakerAssetAmount = new BigNumber(10);
            await feeErc20Token.setBalance(makerAddress, transferableMakerAssetAmount).awaitTransactionSuccessAsync();
            await feeErc20Token.approve(erc20Proxy.address, transferableMakerAssetAmount).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            const expectedFillableTakerAssetAmount = transferableMakerAssetAmount
                .times(signedOrder.takerAssetAmount)
                .dividedToIntegerBy(signedOrder.makerAssetAmount.plus(signedOrder.makerFee));
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(expectedFillableTakerAssetAmount);
        });
        it('should return the correct fillabeTakerassetAmount when makerAsset balances/allowances are sufficient and there are no maker fees', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({ makerFee: constants.ZERO_AMOUNT });
            await erc20Token.setBalance(makerAddress, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(signedOrder.takerAssetAmount);
        });
        it('should return a fillableTakerAssetAmount when the remaining takerAssetAmount is less than the transferable amount', async () => {
            await erc20Token.setBalance(makerAddress, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            await feeErc20Token.setBalance(makerAddress, signedOrder.makerFee).awaitTransactionSuccessAsync();
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            await erc20Token2.setBalance(takerAddress, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token2.approve(erc20Proxy.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: takerAddress,
            });
            await feeErc20Token.setBalance(takerAddress, signedOrder.takerFee).awaitTransactionSuccessAsync();

            await feeErc20Token.approve(erc20Proxy.address, signedOrder.takerFee).awaitTransactionSuccessAsync({
                from: takerAddress,
            });
            const takerAssetFillAmount = signedOrder.takerAssetAmount.dividedToIntegerBy(4);
            await exchange
                .fillOrder(signedOrder, takerAssetFillAmount, signedOrder.signature)
                .awaitTransactionSuccessAsync({ from: takerAddress });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(
                signedOrder.takerAssetAmount.minus(takerAssetFillAmount),
            );
        });
        it('should return correct info even when there are no fees specified', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync({
                makerFee: new BigNumber(0),
                takerFee: new BigNumber(0),
                makerFeeAssetData: '0x',
                takerFeeAssetData: '0x',
            });
            await erc20Token.setBalance(makerAddress, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            const [orderInfo, fillableTakerAssetAmount, isValidSignature] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(orderInfo.orderHash).to.equal(orderHashUtils.getOrderHashHex(signedOrder));
            expect(orderInfo.orderStatus).to.equal(OrderStatus.Fillable);
            expect(orderInfo.orderTakerAssetFilledAmount).to.bignumber.equal(constants.ZERO_AMOUNT);
            expect(fillableTakerAssetAmount).to.bignumber.equal(signedOrder.takerAssetAmount);
            expect(isValidSignature).to.equal(true);
        });
    });
    describe('getOrderRelevantStates', async () => {
        it('should return the correct information for multiple orders', async () => {
            signedOrder = await orderFactory.newSignedOrderAsync();
            await erc20Token.setBalance(makerAddress, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            await feeErc20Token.setBalance(makerAddress, signedOrder.makerFee).awaitTransactionSuccessAsync();
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            const signedOrder2 = await orderFactory.newSignedOrderAsync({ makerAssetData: erc721AssetData });
            const invalidSignature = '0x01';
            await exchange.cancelOrder(signedOrder2).awaitTransactionSuccessAsync({ from: makerAddress });
            const [ordersInfo, fillableTakerAssetAmounts, isValidSignature] = await devUtils
                .getOrderRelevantStates([signedOrder, signedOrder2], [signedOrder.signature, invalidSignature])
                .callAsync();
            expect(ordersInfo[0].orderHash).to.equal(orderHashUtils.getOrderHashHex(signedOrder));
            expect(ordersInfo[1].orderHash).to.equal(orderHashUtils.getOrderHashHex(signedOrder2));
            expect(ordersInfo[0].orderStatus).to.equal(OrderStatus.Fillable);
            expect(ordersInfo[1].orderStatus).to.equal(OrderStatus.Cancelled);
            expect(ordersInfo[0].orderTakerAssetFilledAmount).to.bignumber.equal(constants.ZERO_AMOUNT);
            expect(ordersInfo[1].orderTakerAssetFilledAmount).to.bignumber.equal(constants.ZERO_AMOUNT);
            expect(fillableTakerAssetAmounts[0]).to.bignumber.equal(signedOrder.takerAssetAmount);
            expect(fillableTakerAssetAmounts[1]).to.bignumber.equal(constants.ZERO_AMOUNT);
            expect(isValidSignature[0]).to.equal(true);
            expect(isValidSignature[1]).to.equal(false);
        });
    });
    describe('getSimulatedOrderTransferResults', () => {
        beforeEach(async () => {
            signedOrder = await orderFactory.newSignedOrderAsync();
        });
        it('should return TakerAssetDataFailed if the takerAsset transfer fails', async () => {
            const orderTransferResults = await devUtils
                .getSimulatedOrderTransferResults(signedOrder, takerAddress, signedOrder.takerAssetAmount)
                .callAsync();
            expect(orderTransferResults).to.equal(OrderTransferResults.TakerAssetDataFailed);
        });
        it('should return MakerAssetDataFailed if the makerAsset transfer fails', async () => {
            await erc20Token2.setBalance(takerAddress, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: owner,
            });
            await erc20Token2.approve(erc20Proxy.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: takerAddress,
            });
            const orderTransferResults = await devUtils
                .getSimulatedOrderTransferResults(signedOrder, takerAddress, signedOrder.takerAssetAmount)
                .callAsync();
            expect(orderTransferResults).to.equal(OrderTransferResults.MakerAssetDataFailed);
        });
        it('should return TakerFeeAssetDataFailed if the takerFeeAsset transfer fails', async () => {
            await erc20Token2.setBalance(takerAddress, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: owner,
            });
            await erc20Token2.approve(erc20Proxy.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: takerAddress,
            });
            await erc20Token.setBalance(makerAddress, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: owner,
            });
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            const orderTransferResults = await devUtils
                .getSimulatedOrderTransferResults(signedOrder, takerAddress, signedOrder.takerAssetAmount)
                .callAsync();
            expect(orderTransferResults).to.equal(OrderTransferResults.TakerFeeAssetDataFailed);
        });
        it('should return MakerFeeAssetDataFailed if the makerFeeAsset transfer fails', async () => {
            await erc20Token2.setBalance(takerAddress, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: owner,
            });
            await erc20Token2.approve(erc20Proxy.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: takerAddress,
            });
            await erc20Token.setBalance(makerAddress, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: owner,
            });
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            await feeErc20Token.setBalance(takerAddress, signedOrder.takerFee).awaitTransactionSuccessAsync({
                from: owner,
            });
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.takerFee).awaitTransactionSuccessAsync({
                from: takerAddress,
            });
            const orderTransferResults = await devUtils
                .getSimulatedOrderTransferResults(signedOrder, takerAddress, signedOrder.takerAssetAmount)
                .callAsync();
            expect(orderTransferResults).to.equal(OrderTransferResults.MakerFeeAssetDataFailed);
        });
        it('should return TransfersSuccessful if all transfers succeed', async () => {
            await erc20Token2.setBalance(takerAddress, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: owner,
            });
            await erc20Token2.approve(erc20Proxy.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: takerAddress,
            });
            await erc20Token.setBalance(makerAddress, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: owner,
            });
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            await feeErc20Token.setBalance(takerAddress, signedOrder.takerFee).awaitTransactionSuccessAsync({
                from: owner,
            });
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.takerFee).awaitTransactionSuccessAsync({
                from: takerAddress,
            });
            await feeErc20Token.setBalance(makerAddress, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: owner,
            });
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            const orderTransferResults = await devUtils
                .getSimulatedOrderTransferResults(signedOrder, takerAddress, signedOrder.takerAssetAmount)
                .callAsync();
            expect(orderTransferResults).to.equal(OrderTransferResults.TransfersSuccessful);
        });
        it('should return TransfersSuccessful for a partial fill when taker has ample assets for the fill but not for the whole order', async () => {
            await erc20Token2
                .setBalance(takerAddress, signedOrder.takerAssetAmount.dividedBy(2))
                .awaitTransactionSuccessAsync({
                    from: owner,
                });
            await erc20Token2.approve(erc20Proxy.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: takerAddress,
            });
            await erc20Token.setBalance(makerAddress, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: owner,
            });
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            await feeErc20Token.setBalance(takerAddress, signedOrder.takerFee).awaitTransactionSuccessAsync({
                from: owner,
            });
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.takerFee).awaitTransactionSuccessAsync({
                from: takerAddress,
            });
            await feeErc20Token.setBalance(makerAddress, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: owner,
            });
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            const orderTransferResults = await devUtils
                .getSimulatedOrderTransferResults(signedOrder, takerAddress, signedOrder.takerAssetAmount.dividedBy(2))
                .callAsync();
            expect(orderTransferResults).to.equal(OrderTransferResults.TransfersSuccessful);
        });
    });
    describe('getSimulatedOrdersTransferResults', async () => {
        it('should simulate the transfers of each order independently from one another', async () => {
            // Set balances and allowances to exactly enough to fill a single order
            await erc20Token2.setBalance(takerAddress, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: owner,
            });
            await erc20Token2.approve(erc20Proxy.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: takerAddress,
            });
            await erc20Token.setBalance(makerAddress, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: owner,
            });
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            await feeErc20Token.setBalance(takerAddress, signedOrder.takerFee).awaitTransactionSuccessAsync({
                from: owner,
            });
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.takerFee).awaitTransactionSuccessAsync({
                from: takerAddress,
            });
            await feeErc20Token.setBalance(makerAddress, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: owner,
            });
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: makerAddress,
            });
            const [orderTransferResults1, orderTransferResults2] = await devUtils
                .getSimulatedOrdersTransferResults(
                    [signedOrder, signedOrder],
                    [takerAddress, takerAddress],
                    [signedOrder.takerAssetAmount, signedOrder.takerAssetAmount],
                )
                .callAsync();
            expect(orderTransferResults1).to.equal(OrderTransferResults.TransfersSuccessful);
            expect(orderTransferResults2).to.equal(OrderTransferResults.TransfersSuccessful);
        });
    });
});
// tslint:disable:max-file-line-count
