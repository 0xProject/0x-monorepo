import { ERC20ProxyContract } from '@0x/contracts-asset-proxy';
import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { ExchangeContract } from '@0x/contracts-exchange';
import { blockchainTests, constants, expect, orderHashUtils, OrderStatus } from '@0x/contracts-test-utils';
import { assetDataUtils } from '@0x/order-utils';
import { OrderTransferResults, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { Maker } from '../framework/actors/maker';
import { Taker } from '../framework/actors/taker';
import { DeploymentManager } from '../framework/deployment_manager';

// TODO(jalextowle): This can be cleaned up by using the actors more.
blockchainTests.resets('OrderValidationUtils/OrderTransferSimulatorUtils', env => {
    let owner: string;

    let maker: Maker;
    let taker: Taker;
    let devUtils: DevUtilsContract;
    let erc20Token: DummyERC20TokenContract;
    let erc20Token2: DummyERC20TokenContract;
    let feeErc20Token: DummyERC20TokenContract;
    let erc20Proxy: ERC20ProxyContract;
    let exchange: ExchangeContract;
    let deployment: DeploymentManager;

    let erc20AssetData: string;
    let erc20AssetData2: string;
    let feeAssetData: string;
    let erc721AssetData: string;

    let signedOrder: SignedOrder;

    before(async () => {
        [owner] = await env.getAccountAddressesAsync();

        deployment = await DeploymentManager.deployAsync(env, {
            numErc20TokensToDeploy: 3,
            numErc721TokensToDeploy: 1,
            owner,
        });
        erc20Token = deployment.tokens.erc20[0];
        erc20Token2 = deployment.tokens.erc20[1];
        feeErc20Token = deployment.tokens.erc20[2];
        erc20Proxy = deployment.assetProxies.erc20Proxy;
        devUtils = deployment.devUtils;
        exchange = deployment.exchange;

        erc20AssetData = assetDataUtils.encodeERC20AssetData(erc20Token.address);
        erc20AssetData2 = assetDataUtils.encodeERC20AssetData(erc20Token2.address);
        feeAssetData = assetDataUtils.encodeERC20AssetData(feeErc20Token.address);

        maker = new Maker({
            name: 'Maker',
            deployment,
            orderConfig: {
                makerAssetData: erc20AssetData,
                takerAssetData: erc20AssetData2,
                makerFeeAssetData: feeAssetData,
                takerFeeAssetData: feeAssetData,
                feeRecipientAddress: constants.NULL_ADDRESS,
            },
        });
        taker = new Taker({
            name: 'Taker',
            deployment,
        });

        const [tokenID] = await maker.configureERC721TokenAsync(deployment.tokens.erc721[0]);
        erc721AssetData = assetDataUtils.encodeERC721AssetData(deployment.tokens.erc721[0].address, tokenID);
    });

    describe('getTransferableAssetAmount', () => {
        it('should return the balance when balance < allowance', async () => {
            const balance = new BigNumber(123);
            const allowance = new BigNumber(456);
            await erc20Token.setBalance(maker.address, balance).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, allowance).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            const transferableAmount = await devUtils
                .getTransferableAssetAmount(maker.address, erc20AssetData)
                .callAsync();
            expect(transferableAmount).to.bignumber.equal(balance);
        });
        it('should return the allowance when allowance < balance', async () => {
            const balance = new BigNumber(456);
            const allowance = new BigNumber(123);
            await erc20Token.setBalance(maker.address, balance).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, allowance).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            const transferableAmount = await devUtils
                .getTransferableAssetAmount(maker.address, erc20AssetData)
                .callAsync();
            expect(transferableAmount).to.bignumber.equal(allowance);
        });
        it('should return the correct transferable amount for multiAssetData', async () => {
            const multiAssetData = await devUtils
                .encodeMultiAssetData([new BigNumber(1), new BigNumber(1)], [erc20AssetData, erc20AssetData2])
                .callAsync();
            const transferableAmount1 = new BigNumber(10);
            const transferableAmount2 = new BigNumber(5);
            await erc20Token.setBalance(maker.address, transferableAmount1).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, transferableAmount1).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            await erc20Token2.setBalance(maker.address, transferableAmount2).awaitTransactionSuccessAsync();
            await erc20Token2.approve(erc20Proxy.address, transferableAmount2).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            const transferableAmount = await devUtils
                .getTransferableAssetAmount(maker.address, multiAssetData)
                .callAsync();
            expect(transferableAmount).to.bignumber.equal(transferableAmount2);
        });
    });
    describe('getOrderRelevantState', () => {
        beforeEach(async () => {
            signedOrder = await maker.signOrderAsync({});
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
            await erc20Token.setBalance(maker.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should correctly validate fillable order', async () => {
            signedOrder = await maker.signOrderAsync({
                makerAssetData: erc721AssetData,
                makerAssetAmount: new BigNumber(1),
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
            await taker.configureERC20TokenAsync(erc20Token2);
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.greaterThan(constants.ZERO_AMOUNT);
        });
        it('should return a fillableTakerAssetAmount of 0 when balances/allowances of one asset within a multiAssetData are insufficient (ERC20)', async () => {
            const multiAssetData = await devUtils
                .encodeMultiAssetData([new BigNumber(1), new BigNumber(1)], [erc20AssetData, erc20AssetData2])
                .callAsync();
            signedOrder = await maker.signOrderAsync({ makerAssetData: multiAssetData });
            await erc20Token.setBalance(maker.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should return a fillableTakerAssetAmount of 0 when balances/allowances of one asset within a multiAssetData are insufficient (ERC721)', async () => {
            const [tokenID] = await taker.configureERC721TokenAsync(deployment.tokens.erc721[0]);
            const takerOwnedErc721AssetData = assetDataUtils.encodeERC721AssetData(
                deployment.tokens.erc721[0].address,
                tokenID,
            );

            const multiAssetData = await devUtils
                .encodeMultiAssetData(
                    [new BigNumber(1), new BigNumber(1)],
                    [takerOwnedErc721AssetData, erc721AssetData],
                )
                .callAsync();
            signedOrder = await maker.signOrderAsync({ makerAssetData: multiAssetData });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should return a fillableTakerAssetAmount of 0 when an erc721 asset is duplicated in the maker side of a multi-asset proxy order', async () => {
            const multiAssetData = await devUtils
                .encodeMultiAssetData([new BigNumber(1), new BigNumber(1)], [erc721AssetData, erc721AssetData])
                .callAsync();
            signedOrder = await maker.signOrderAsync({
                makerAssetData: multiAssetData,
                makerAssetAmount: new BigNumber(1),
                takerAssetData: erc721AssetData,
                takerAssetAmount: new BigNumber(1),
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should return a fillableTakerAssetAmount of 0 when an erc721 asset is duplicated in the taker side of a multi-asset proxy order', async () => {
            const multiAssetData = await devUtils
                .encodeMultiAssetData([new BigNumber(1), new BigNumber(1)], [erc721AssetData, erc721AssetData])
                .callAsync();
            signedOrder = await maker.signOrderAsync({
                makerAssetData: erc721AssetData,
                makerAssetAmount: new BigNumber(1),
                takerAssetData: multiAssetData,
                takerAssetAmount: new BigNumber(1),
                makerFee: constants.ZERO_AMOUNT,
                takerFee: constants.ZERO_AMOUNT,
            });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should return a fillableTakerAssetAmount of 0 when an erc721 asset is duplicated in the maker fee side of a multi-asset proxy order', async () => {
            const multiAssetData = await devUtils
                .encodeMultiAssetData([new BigNumber(1), new BigNumber(1)], [erc721AssetData, erc721AssetData])
                .callAsync();
            signedOrder = await maker.signOrderAsync({
                makerFeeAssetData: multiAssetData,
                makerFee: new BigNumber(1),
                takerFee: constants.ZERO_AMOUNT,
            });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should return a fillableTakerAssetAmount of 0 when an erc721 asset is duplicated in the taker fee side of a multi-asset proxy order', async () => {
            const multiAssetData = await devUtils
                .encodeMultiAssetData([new BigNumber(1), new BigNumber(1)], [erc721AssetData, erc721AssetData])
                .callAsync();
            signedOrder = await maker.signOrderAsync({
                makerFee: constants.ZERO_AMOUNT,
                takerFeeAssetData: multiAssetData,
                takerFee: new BigNumber(1),
            });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should return the correct fillableTakerAssetAmount when fee balances/allowances are partially sufficient', async () => {
            await erc20Token.setBalance(maker.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            const divisor = 4;
            await feeErc20Token
                .setBalance(maker.address, signedOrder.makerFee.dividedToIntegerBy(divisor))
                .awaitTransactionSuccessAsync();
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: maker.address,
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
                .setBalance(maker.address, signedOrder.makerAssetAmount.dividedToIntegerBy(divisor))
                .awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            await feeErc20Token.setBalance(maker.address, signedOrder.makerFee).awaitTransactionSuccessAsync();
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: maker.address,
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
            signedOrder = await maker.signOrderAsync({ makerAssetData: multiAssetData });
            await erc20Token.setBalance(maker.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            await feeErc20Token.setBalance(maker.address, signedOrder.makerFee).awaitTransactionSuccessAsync();
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            const divisor = 4;
            await erc20Token2
                .setBalance(maker.address, signedOrder.makerAssetAmount.dividedToIntegerBy(divisor))
                .awaitTransactionSuccessAsync();
            await erc20Token2
                .approve(erc20Proxy.address, signedOrder.makerAssetAmount.dividedToIntegerBy(divisor))
                .awaitTransactionSuccessAsync({
                    from: maker.address,
                });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(
                signedOrder.takerAssetAmount.dividedToIntegerBy(divisor),
            );
        });
        it('should return a fillableTakerAssetAmount of 0 when non-fee balances/allowances are insufficient', async () => {
            await feeErc20Token.setBalance(maker.address, signedOrder.makerFee).awaitTransactionSuccessAsync();
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(constants.ZERO_AMOUNT);
        });
        it('should return a fillableTakerAssetAmount equal to the takerAssetAmount when the order is unfilled and balances/allowances are sufficient', async () => {
            await erc20Token.setBalance(maker.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            await feeErc20Token.setBalance(maker.address, signedOrder.makerFee).awaitTransactionSuccessAsync();
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(signedOrder.takerAssetAmount);
        });
        it('should return the correct fillableTakerAssetAmount when balances/allowances are partially sufficient and makerAsset=makerFeeAsset', async () => {
            signedOrder = await maker.signOrderAsync({
                makerAssetData: feeAssetData,
                makerAssetAmount: new BigNumber(10),
                takerAssetAmount: new BigNumber(20),
                makerFee: new BigNumber(40),
            });
            const transferableMakerAssetAmount = new BigNumber(10);
            await feeErc20Token.setBalance(maker.address, transferableMakerAssetAmount).awaitTransactionSuccessAsync();
            await feeErc20Token.approve(erc20Proxy.address, transferableMakerAssetAmount).awaitTransactionSuccessAsync({
                from: maker.address,
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
            signedOrder = await maker.signOrderAsync({ makerFee: constants.ZERO_AMOUNT });
            await erc20Token.setBalance(maker.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(signedOrder.takerAssetAmount);
        });
        it('should return a fillableTakerAssetAmount when the remaining takerAssetAmount is less than the transferable amount', async () => {
            await erc20Token.setBalance(maker.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            await feeErc20Token.setBalance(maker.address, signedOrder.makerFee).awaitTransactionSuccessAsync();
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            await erc20Token2.setBalance(taker.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token2.approve(erc20Proxy.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: taker.address,
            });
            await feeErc20Token.setBalance(taker.address, signedOrder.takerFee).awaitTransactionSuccessAsync();

            await feeErc20Token.approve(erc20Proxy.address, signedOrder.takerFee).awaitTransactionSuccessAsync({
                from: taker.address,
            });
            const takerAssetFillAmount = signedOrder.takerAssetAmount.dividedToIntegerBy(4);
            await exchange
                .fillOrder(signedOrder, takerAssetFillAmount, signedOrder.signature)
                .awaitTransactionSuccessAsync({ from: taker.address, value: DeploymentManager.protocolFee });
            const [, fillableTakerAssetAmount] = await devUtils
                .getOrderRelevantState(signedOrder, signedOrder.signature)
                .callAsync();
            expect(fillableTakerAssetAmount).to.bignumber.equal(
                signedOrder.takerAssetAmount.minus(takerAssetFillAmount),
            );
        });
        it('should return correct info even when there are no fees specified', async () => {
            signedOrder = await maker.signOrderAsync({
                makerFee: new BigNumber(0),
                takerFee: new BigNumber(0),
                makerFeeAssetData: '0x',
                takerFeeAssetData: '0x',
            });
            await erc20Token.setBalance(maker.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: maker.address,
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
        it('should not revert when rounding errors occur', async () => {
            signedOrder = await maker.signOrderAsync({
                makerAssetAmount: new BigNumber('2040250070'),
                takerAssetAmount: new BigNumber('2040250070000000000000'),
                makerFee: new BigNumber(0),
                takerFee: new BigNumber(0),
            });
            await erc20Token.setBalance(maker.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            await erc20Token2.setBalance(taker.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token2.approve(erc20Proxy.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: taker.address,
            });
            await taker.configureERC20TokenAsync(deployment.tokens.weth, deployment.staking.stakingProxy.address);
            await taker.fillOrderAsync(signedOrder, new BigNumber('2040250069999999999990'));
            await devUtils.getOrderRelevantState(signedOrder, signedOrder.signature).callAsync();
        });
    });
    describe('getOrderRelevantStates', async () => {
        it('should return the correct information for multiple orders', async () => {
            signedOrder = await maker.signOrderAsync();
            await erc20Token.setBalance(maker.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync();
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            await feeErc20Token.setBalance(maker.address, signedOrder.makerFee).awaitTransactionSuccessAsync();
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            const signedOrder2 = await maker.signOrderAsync({
                makerAssetData: erc721AssetData,
                makerAssetAmount: new BigNumber(1),
            });
            const invalidSignature = '0x01';
            await exchange.cancelOrder(signedOrder2).awaitTransactionSuccessAsync({ from: maker.address });
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
            signedOrder = await maker.signOrderAsync();
        });
        it('should return TakerAssetDataFailed if the takerAsset transfer fails', async () => {
            const orderTransferResults = await devUtils
                .getSimulatedOrderTransferResults(signedOrder, taker.address, signedOrder.takerAssetAmount)
                .callAsync();
            expect(orderTransferResults).to.equal(OrderTransferResults.TakerAssetDataFailed);
        });
        it('should return MakerAssetDataFailed if the makerAsset transfer fails', async () => {
            await erc20Token2.setBalance(taker.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: owner,
            });
            await erc20Token2.approve(erc20Proxy.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: taker.address,
            });
            const orderTransferResults = await devUtils
                .getSimulatedOrderTransferResults(signedOrder, taker.address, signedOrder.takerAssetAmount)
                .callAsync();
            expect(orderTransferResults).to.equal(OrderTransferResults.MakerAssetDataFailed);
        });
        it('should return TakerFeeAssetDataFailed if the takerFeeAsset transfer fails', async () => {
            await erc20Token2.setBalance(taker.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: owner,
            });
            await erc20Token2.approve(erc20Proxy.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: taker.address,
            });
            await erc20Token.setBalance(maker.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: owner,
            });
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            const orderTransferResults = await devUtils
                .getSimulatedOrderTransferResults(signedOrder, taker.address, signedOrder.takerAssetAmount)
                .callAsync();
            expect(orderTransferResults).to.equal(OrderTransferResults.TakerFeeAssetDataFailed);
        });
        it('should return MakerFeeAssetDataFailed if the makerFeeAsset transfer fails', async () => {
            await erc20Token2.setBalance(taker.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: owner,
            });
            await erc20Token2.approve(erc20Proxy.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: taker.address,
            });
            await erc20Token.setBalance(maker.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: owner,
            });
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            await feeErc20Token.setBalance(taker.address, signedOrder.takerFee).awaitTransactionSuccessAsync({
                from: owner,
            });
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.takerFee).awaitTransactionSuccessAsync({
                from: taker.address,
            });
            const orderTransferResults = await devUtils
                .getSimulatedOrderTransferResults(signedOrder, taker.address, signedOrder.takerAssetAmount)
                .callAsync();
            expect(orderTransferResults).to.equal(OrderTransferResults.MakerFeeAssetDataFailed);
        });
        it('should return TransfersSuccessful if all transfers succeed', async () => {
            await erc20Token2.setBalance(taker.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: owner,
            });
            await erc20Token2.approve(erc20Proxy.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: taker.address,
            });
            await erc20Token.setBalance(maker.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: owner,
            });
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            await feeErc20Token.setBalance(taker.address, signedOrder.takerFee).awaitTransactionSuccessAsync({
                from: owner,
            });
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.takerFee).awaitTransactionSuccessAsync({
                from: taker.address,
            });
            await feeErc20Token.setBalance(maker.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: owner,
            });
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            const orderTransferResults = await devUtils
                .getSimulatedOrderTransferResults(signedOrder, taker.address, signedOrder.takerAssetAmount)
                .callAsync();
            expect(orderTransferResults).to.equal(OrderTransferResults.TransfersSuccessful);
        });
        it('should return TransfersSuccessful for a partial fill when taker has ample assets for the fill but not for the whole order', async () => {
            await erc20Token2
                .setBalance(taker.address, signedOrder.takerAssetAmount.dividedBy(2))
                .awaitTransactionSuccessAsync({
                    from: owner,
                });
            await erc20Token2.approve(erc20Proxy.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: taker.address,
            });
            await erc20Token.setBalance(maker.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: owner,
            });
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            await feeErc20Token.setBalance(taker.address, signedOrder.takerFee).awaitTransactionSuccessAsync({
                from: owner,
            });
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.takerFee).awaitTransactionSuccessAsync({
                from: taker.address,
            });
            await feeErc20Token.setBalance(maker.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: owner,
            });
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            const orderTransferResults = await devUtils
                .getSimulatedOrderTransferResults(signedOrder, taker.address, signedOrder.takerAssetAmount.dividedBy(2))
                .callAsync();
            expect(orderTransferResults).to.equal(OrderTransferResults.TransfersSuccessful);
        });
    });
    describe('getSimulatedOrdersTransferResults', async () => {
        it('should simulate the transfers of each order independently from one another', async () => {
            // Set balances and allowances to exactly enough to fill a single order
            await erc20Token2.setBalance(taker.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: owner,
            });
            await erc20Token2.approve(erc20Proxy.address, signedOrder.takerAssetAmount).awaitTransactionSuccessAsync({
                from: taker.address,
            });
            await erc20Token.setBalance(maker.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: owner,
            });
            await erc20Token.approve(erc20Proxy.address, signedOrder.makerAssetAmount).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            await feeErc20Token.setBalance(taker.address, signedOrder.takerFee).awaitTransactionSuccessAsync({
                from: owner,
            });
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.takerFee).awaitTransactionSuccessAsync({
                from: taker.address,
            });
            await feeErc20Token.setBalance(maker.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: owner,
            });
            await feeErc20Token.approve(erc20Proxy.address, signedOrder.makerFee).awaitTransactionSuccessAsync({
                from: maker.address,
            });
            const [orderTransferResults1, orderTransferResults2] = await devUtils
                .getSimulatedOrdersTransferResults(
                    [signedOrder, signedOrder],
                    [taker.address, taker.address],
                    [signedOrder.takerAssetAmount, signedOrder.takerAssetAmount],
                )
                .callAsync();
            expect(orderTransferResults1).to.equal(OrderTransferResults.TransfersSuccessful);
            expect(orderTransferResults2).to.equal(OrderTransferResults.TransfersSuccessful);
        });
    });
});
// tslint:disable:max-file-line-count
