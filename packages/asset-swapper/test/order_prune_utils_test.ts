import { ContractAddresses, ContractWrappers, ERC20TokenContract } from '@0x/contract-wrappers';
import { constants as devConstants, getLatestBlockTimestampAsync, OrderFactory } from '@0x/contracts-test-utils';
import { BlockchainLifecycle, tokenUtils } from '@0x/dev-utils';
import { assetDataUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { constants } from '../src/constants';
import { OrderPrunerPermittedFeeTypes } from '../src/types';
import { OrderPruner } from '../src/utils/order_prune_utils';

import { chaiSetup } from './utils/chai_setup';
import { migrateOnceAsync } from './utils/migrate';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const ONE_ETH_IN_WEI = new BigNumber(1000000000000000000);
const TESTRPC_CHAIN_ID = 1337;
const UNLIMITED_ALLOWANCE_IN_BASE_UNITS = new BigNumber(2).pow(256).minus(1); // tslint:disable-line:custom-no-magic-numbers

// tslint:disable: no-unused-expression
// tslint:disable: custom-no-magic-numbers
describe('OrderPruner', () => {
    let contractWrappers: ContractWrappers;
    let erc20MakerTokenContract: ERC20TokenContract;
    let erc20TakerTokenContract: ERC20TokenContract;
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
        contractAddresses = await migrateOnceAsync();
        await blockchainLifecycle.startAsync();
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        const config = {
            chainId,
            contractAddresses,
        };
        contractWrappers = new ContractWrappers(provider, config);
        [coinbaseAddress, takerAddress, makerAddress, feeRecipient] = userAddresses;
        [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        erc20MakerTokenContract = new ERC20TokenContract(makerTokenAddress, provider);
        erc20TakerTokenContract = new ERC20TokenContract(takerTokenAddress, provider);
        [makerAssetData, takerAssetData, wethAssetData] = [
            assetDataUtils.encodeERC20AssetData(makerTokenAddress),
            assetDataUtils.encodeERC20AssetData(takerTokenAddress),
            assetDataUtils.encodeERC20AssetData(contractAddresses.etherToken),
        ];
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
        await erc20MakerTokenContract.transfer.sendTransactionAsync(makerAddress, fillableAmount.multipliedBy(4), {
            from: coinbaseAddress,
        });
        await erc20TakerTokenContract.transfer.sendTransactionAsync(takerAddress, fillableAmount.multipliedBy(4), {
            from: coinbaseAddress,
        });
        await erc20MakerTokenContract.approve.sendTransactionAsync(
            contractAddresses.erc20Proxy,
            UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
            {
                from: makerAddress,
            },
        );
        await erc20MakerTokenContract.approve.sendTransactionAsync(
            contractAddresses.erc20Proxy,
            UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
            {
                from: takerAddress,
            },
        );
        await erc20TakerTokenContract.approve.sendTransactionAsync(
            contractAddresses.erc20Proxy,
            UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
            {
                from: takerAddress,
            },
        );

        partiallyFilledOpenSignedOrderFeeless = await orderFactory.newSignedOrderAsync({
            takerAssetAmount: fillableAmount,
            makerAssetAmount: fillableAmount,
        });

        await contractWrappers.exchange.fillOrKillOrder.sendTransactionAsync(
            partiallyFilledOpenSignedOrderFeeless,
            partialFillAmount,
            partiallyFilledOpenSignedOrderFeeless.signature,
            {
                from: takerAddress,
                gas: 4000000,
            },
        );

        partiallyFilledOpenSignedOrderFeeInTakerAsset = await orderFactory.newSignedOrderAsync({
            takerAssetAmount: fillableAmount,
            makerAssetAmount: fillableAmount,
            takerFee: takerFeeAmount,
            takerFeeAssetData: takerAssetData,
        });

        await contractWrappers.exchange.fillOrKillOrder.sendTransactionAsync(
            partiallyFilledOpenSignedOrderFeeInTakerAsset,
            partialFillAmount,
            partiallyFilledOpenSignedOrderFeeInTakerAsset.signature,
            {
                from: takerAddress,
                gas: 4000000,
            },
        );

        partiallyFilledOpenSignedOrderFeeInMakerAsset = await orderFactory.newSignedOrderAsync({
            takerAssetAmount: fillableAmount,
            makerAssetAmount: fillableAmount,
            takerFee: takerFeeAmount,
            takerFeeAssetData: makerAssetData,
        });

        await contractWrappers.exchange.fillOrKillOrder.sendTransactionAsync(
            partiallyFilledOpenSignedOrderFeeInMakerAsset,
            partialFillAmount,
            partiallyFilledOpenSignedOrderFeeInMakerAsset.signature,
            {
                from: takerAddress,
                gas: 4000000,
            },
        );

        filledOpenSignedOrder = await orderFactory.newSignedOrderAsync({
            takerAssetAmount: fillableAmount,
            makerAssetAmount: fillableAmount,
        });

        await contractWrappers.exchange.fillOrKillOrder.sendTransactionAsync(
            filledOpenSignedOrder,
            fillableAmount,
            filledOpenSignedOrder.signature,
            {
                from: takerAddress,
                gas: 4000000,
            },
        );

        orderPruner = new OrderPruner(contractWrappers.devUtils, {
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
            orderPruner = new OrderPruner(contractWrappers.devUtils, {
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
            orderPruner = new OrderPruner(contractWrappers.devUtils, {
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
            orderPruner = new OrderPruner(contractWrappers.devUtils, {
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
