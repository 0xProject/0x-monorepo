import { ContractAddresses } from '@0x/contract-addresses';
import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { ERC20TokenContract } from '@0x/contracts-erc20';
import { ExchangeContract } from '@0x/contracts-exchange';
import { constants as devConstants, getLatestBlockTimestampAsync, OrderFactory } from '@0x/contracts-test-utils';
import { BlockchainLifecycle, tokenUtils } from '@0x/dev-utils';
import { migrateOnceAsync } from '@0x/migrations';
import { assetDataUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { constants } from '../src/constants';
import { OrderPrunerPermittedFeeTypes } from '../src/types';
import { OrderPruner } from '../src/utils/order_prune_utils';

import { chaiSetup } from './utils/chai_setup';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const ONE_ETH_IN_WEI = new BigNumber(1000000000000000000);
const TESTRPC_CHAIN_ID = devConstants.TESTRPC_CHAIN_ID;
const GAS_PRICE = new BigNumber(devConstants.DEFAULT_GAS_PRICE);
const PROTOCOL_FEE_MULTIPLIER = 150000;
const PROTOCOL_FEE_PER_FILL = GAS_PRICE.times(PROTOCOL_FEE_MULTIPLIER);
const UNLIMITED_ALLOWANCE_IN_BASE_UNITS = new BigNumber(2).pow(256).minus(1); // tslint:disable-line:custom-no-magic-numbers

// tslint:disable: no-unused-expression
// tslint:disable: custom-no-magic-numbers
describe('OrderPruner', () => {
    let erc20MakerTokenContract: ERC20TokenContract;
    let erc20TakerTokenContract: ERC20TokenContract;
    let exchangeContract: ExchangeContract;
    let devUtilsContract: DevUtilsContract;
    let userAddresses: string[];
    let coinbaseAddress: string;
    let makerAddress: string;
    let takerAddress: string;
    let feeRecipient: string;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let makerAssetData: string;
    let takerAssetData: string;
    let orderFactory: OrderFactory;
    let wethAssetData: string;
    let contractAddresses: ContractAddresses;
    let orderPruner: OrderPruner;

    let nonOpenSignedOrder: SignedOrder;
    let expiredOpenSignedOrder: SignedOrder;
    let invalidSignatureOpenSignedOrder: SignedOrder;
    let fullyFillableOpenSignedOrder: SignedOrder;
    let partiallyFilledOpenSignedOrderFeeless: SignedOrder;
    let partiallyFilledOpenSignedOrderFeeInTakerAsset: SignedOrder;
    let partiallyFilledOpenSignedOrderFeeInMakerAsset: SignedOrder;
    let filledOpenSignedOrder: SignedOrder;

    const chainId = TESTRPC_CHAIN_ID;
    const fillableAmount = new BigNumber(10).multipliedBy(ONE_ETH_IN_WEI);
    const partialFillAmount = new BigNumber(2).multipliedBy(ONE_ETH_IN_WEI);
    const takerFeeAmount = new BigNumber(2).multipliedBy(ONE_ETH_IN_WEI);

    before(async () => {
        contractAddresses = await migrateOnceAsync(provider);
        await blockchainLifecycle.startAsync();
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        [coinbaseAddress, takerAddress, makerAddress, feeRecipient] = userAddresses;
        [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        erc20MakerTokenContract = new ERC20TokenContract(makerTokenAddress, provider);
        erc20TakerTokenContract = new ERC20TokenContract(takerTokenAddress, provider);
        [makerAssetData, takerAssetData, wethAssetData] = [
            assetDataUtils.encodeERC20AssetData(makerTokenAddress),
            assetDataUtils.encodeERC20AssetData(takerTokenAddress),
            assetDataUtils.encodeERC20AssetData(contractAddresses.etherToken),
        ];
        exchangeContract = new ExchangeContract(contractAddresses.exchange, provider);
        devUtilsContract = new DevUtilsContract(contractAddresses.devUtils, provider);
        // Configure order defaults
        const defaultOrderParams = {
            ...devConstants.STATIC_ORDER_PARAMS,
            makerAddress,
            takerAddress: constants.NULL_ADDRESS,
            makerAssetData,
            takerAssetData,
            makerFeeAssetData: constants.NULL_ERC20_ASSET_DATA,
            takerFeeAssetData: constants.NULL_ERC20_ASSET_DATA,
            makerFee: constants.ZERO_AMOUNT,
            takerFee: constants.ZERO_AMOUNT,
            feeRecipientAddress: feeRecipient,
            exchangeAddress: contractAddresses.exchange,
            chainId,
        };
        const privateKey = devConstants.TESTRPC_PRIVATE_KEYS[userAddresses.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();

        nonOpenSignedOrder = await orderFactory.newSignedOrderAsync({
            takerAddress,
        });

        expiredOpenSignedOrder = await orderFactory.newSignedOrderAsync({
            expirationTimeSeconds: new BigNumber(await getLatestBlockTimestampAsync()).minus(10),
        });

        invalidSignatureOpenSignedOrder = await orderFactory.newSignedOrderAsync({
            takerAddress,
        });
        invalidSignatureOpenSignedOrder.signature = constants.NULL_BYTES;

        fullyFillableOpenSignedOrder = await orderFactory.newSignedOrderAsync({
            takerAssetAmount: fillableAmount,
            makerAssetAmount: fillableAmount,
        });

        // give double fillableAmount to maker and taker as buffer
        await erc20MakerTokenContract
            .transfer(makerAddress, fillableAmount.multipliedBy(4))
            .sendTransactionAsync({ from: coinbaseAddress });
        await erc20TakerTokenContract
            .transfer(takerAddress, fillableAmount.multipliedBy(4))
            .sendTransactionAsync({ from: coinbaseAddress });
        await erc20MakerTokenContract
            .approve(contractAddresses.erc20Proxy, UNLIMITED_ALLOWANCE_IN_BASE_UNITS)
            .sendTransactionAsync({ from: makerAddress });
        await erc20MakerTokenContract
            .approve(contractAddresses.erc20Proxy, UNLIMITED_ALLOWANCE_IN_BASE_UNITS)
            .sendTransactionAsync({ from: takerAddress });
        await erc20TakerTokenContract
            .approve(contractAddresses.erc20Proxy, UNLIMITED_ALLOWANCE_IN_BASE_UNITS)
            .sendTransactionAsync({ from: takerAddress });

        partiallyFilledOpenSignedOrderFeeless = await orderFactory.newSignedOrderAsync({
            takerAssetAmount: fillableAmount,
            makerAssetAmount: fillableAmount,
        });

        await exchangeContract
            .fillOrKillOrder(
                partiallyFilledOpenSignedOrderFeeless,
                partialFillAmount,
                partiallyFilledOpenSignedOrderFeeless.signature,
            )
            .sendTransactionAsync({
                from: takerAddress,
                gasPrice: GAS_PRICE,
                gas: 4000000,
                value: PROTOCOL_FEE_PER_FILL,
            });

        partiallyFilledOpenSignedOrderFeeInTakerAsset = await orderFactory.newSignedOrderAsync({
            takerAssetAmount: fillableAmount,
            makerAssetAmount: fillableAmount,
            takerFee: takerFeeAmount,
            takerFeeAssetData: takerAssetData,
        });

        await exchangeContract
            .fillOrKillOrder(
                partiallyFilledOpenSignedOrderFeeInTakerAsset,
                partialFillAmount,
                partiallyFilledOpenSignedOrderFeeInTakerAsset.signature,
            )
            .sendTransactionAsync({
                from: takerAddress,
                gasPrice: GAS_PRICE,
                gas: 4000000,
                value: PROTOCOL_FEE_PER_FILL,
            });

        partiallyFilledOpenSignedOrderFeeInMakerAsset = await orderFactory.newSignedOrderAsync({
            takerAssetAmount: fillableAmount,
            makerAssetAmount: fillableAmount,
            takerFee: takerFeeAmount,
            takerFeeAssetData: makerAssetData,
        });

        await exchangeContract
            .fillOrKillOrder(
                partiallyFilledOpenSignedOrderFeeInMakerAsset,
                partialFillAmount,
                partiallyFilledOpenSignedOrderFeeInMakerAsset.signature,
            )
            .sendTransactionAsync({
                from: takerAddress,
                gasPrice: GAS_PRICE,
                gas: 4000000,
                value: PROTOCOL_FEE_PER_FILL,
            });

        filledOpenSignedOrder = await orderFactory.newSignedOrderAsync({
            takerAssetAmount: fillableAmount,
            makerAssetAmount: fillableAmount,
        });

        await exchangeContract
            .fillOrKillOrder(filledOpenSignedOrder, fillableAmount, filledOpenSignedOrder.signature)
            .sendTransactionAsync({
                from: takerAddress,
                gasPrice: GAS_PRICE,
                gas: 4000000,
                value: PROTOCOL_FEE_PER_FILL,
            });

        orderPruner = new OrderPruner(devUtilsContract, {
            permittedOrderFeeTypes: new Set<OrderPrunerPermittedFeeTypes>([
                OrderPrunerPermittedFeeTypes.NoFees,
                OrderPrunerPermittedFeeTypes.MakerDenominatedTakerFee,
                OrderPrunerPermittedFeeTypes.TakerDenominatedTakerFee,
            ]),
        });
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('constructor options', () => {
        it('should filter for only feeless orders if options permit only feeless orders', async () => {
            orderPruner = new OrderPruner(devUtilsContract, {
                permittedOrderFeeTypes: new Set<OrderPrunerPermittedFeeTypes>([OrderPrunerPermittedFeeTypes.NoFees]),
            });
            const orders = [
                partiallyFilledOpenSignedOrderFeeInMakerAsset,
                partiallyFilledOpenSignedOrderFeeInTakerAsset,
                partiallyFilledOpenSignedOrderFeeless,
            ];
            const resultPrunedOrders = await orderPruner.pruneSignedOrdersAsync(orders);
            // checks for one order in results and check for signature of orders
            expect(resultPrunedOrders.length).to.be.equal(1);
            expect(resultPrunedOrders[0].signature).to.be.deep.equal(partiallyFilledOpenSignedOrderFeeless.signature);
        });
        it('should filter for only takerFee in takerAsset orders if options permit only takerFee in takerAsset orders', async () => {
            orderPruner = new OrderPruner(devUtilsContract, {
                permittedOrderFeeTypes: new Set<OrderPrunerPermittedFeeTypes>([
                    OrderPrunerPermittedFeeTypes.TakerDenominatedTakerFee,
                ]),
            });
            const orders = [
                partiallyFilledOpenSignedOrderFeeInMakerAsset,
                partiallyFilledOpenSignedOrderFeeInTakerAsset,
                partiallyFilledOpenSignedOrderFeeless,
            ];
            const resultPrunedOrders = await orderPruner.pruneSignedOrdersAsync(orders);
            // checks for one order in results and check for signature of orders
            expect(resultPrunedOrders.length).to.be.equal(1);
            expect(resultPrunedOrders[0].signature).to.be.deep.equal(
                partiallyFilledOpenSignedOrderFeeInTakerAsset.signature,
            );
        });
        it('should filter for only makerFee in takerAsset orders if options permit only makerFee orders', async () => {
            orderPruner = new OrderPruner(devUtilsContract, {
                permittedOrderFeeTypes: new Set<OrderPrunerPermittedFeeTypes>([
                    OrderPrunerPermittedFeeTypes.MakerDenominatedTakerFee,
                ]),
            });
            const orders = [
                partiallyFilledOpenSignedOrderFeeInMakerAsset,
                partiallyFilledOpenSignedOrderFeeInTakerAsset,
                partiallyFilledOpenSignedOrderFeeless,
            ];
            const resultPrunedOrders = await orderPruner.pruneSignedOrdersAsync(orders);
            // checks for one order in results and check for signature of orders
            expect(resultPrunedOrders.length).to.be.equal(1);
            expect(resultPrunedOrders[0].signature).to.be.deep.equal(
                partiallyFilledOpenSignedOrderFeeInMakerAsset.signature,
            );
        });
    });
    describe('#pruneSignedOrdersAsync', () => {
        it('should filter out non open orders', async () => {
            const orders = [nonOpenSignedOrder];
            const resultPrunedOrders = await orderPruner.pruneSignedOrdersAsync(orders);
            expect(resultPrunedOrders).to.be.empty;
        });
        it('should filter out expired orders', async () => {
            const orders = [expiredOpenSignedOrder];
            const resultPrunedOrders = await orderPruner.pruneSignedOrdersAsync(orders);
            expect(resultPrunedOrders).to.be.empty;
        });
        it('should filter out invalid signature orders', async () => {
            const orders = [invalidSignatureOpenSignedOrder];
            const resultPrunedOrders = await orderPruner.pruneSignedOrdersAsync(orders);
            expect(resultPrunedOrders).to.be.empty;
        });
        it('should filter out fully filled orders', async () => {
            const orders = [filledOpenSignedOrder];
            const resultPrunedOrders = await orderPruner.pruneSignedOrdersAsync(orders);
            expect(resultPrunedOrders).to.be.empty;
        });
        it('should provide correct pruned signed orders for fully fillable orders', async () => {
            const orders = [fullyFillableOpenSignedOrder];
            const resultPrunedOrders = await orderPruner.pruneSignedOrdersAsync(orders);
            const prunedOrder = resultPrunedOrders[0];
            expect(prunedOrder.fillableMakerAssetAmount).to.bignumber.equal(fillableAmount);
            expect(prunedOrder.fillableTakerAssetAmount).to.bignumber.equal(fillableAmount);
        });
        it('should provide correct pruned signed orders for partially fillable orders', async () => {
            const orders = [
                partiallyFilledOpenSignedOrderFeeless,
                partiallyFilledOpenSignedOrderFeeInTakerAsset,
                partiallyFilledOpenSignedOrderFeeInMakerAsset,
            ];
            const resultPrunedOrders = await orderPruner.pruneSignedOrdersAsync(orders);
            expect(resultPrunedOrders[0].fillableMakerAssetAmount).to.bignumber.equal(
                fillableAmount.minus(partialFillAmount),
            );
            expect(resultPrunedOrders[0].fillableTakerAssetAmount).to.bignumber.equal(
                fillableAmount.minus(partialFillAmount),
            );
            expect(resultPrunedOrders[1].fillableMakerAssetAmount).to.bignumber.equal(
                fillableAmount.minus(partialFillAmount),
            );
            expect(resultPrunedOrders[1].fillableTakerAssetAmount).to.bignumber.equal(
                fillableAmount.minus(partialFillAmount),
            );
            expect(resultPrunedOrders[1].fillableTakerFeeAmount).to.bignumber.equal(
                new BigNumber(1.6).multipliedBy(ONE_ETH_IN_WEI),
            );
            expect(resultPrunedOrders[2].fillableMakerAssetAmount).to.bignumber.equal(
                fillableAmount.minus(partialFillAmount),
            );
            expect(resultPrunedOrders[2].fillableTakerAssetAmount).to.bignumber.equal(
                fillableAmount.minus(partialFillAmount),
            );
            expect(resultPrunedOrders[2].fillableTakerFeeAmount).to.bignumber.equal(
                new BigNumber(1.6).multipliedBy(ONE_ETH_IN_WEI),
            );
        });
    });
});
