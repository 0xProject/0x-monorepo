import { ContractAddresses } from '@0x/contract-addresses';
import { ERC20TokenContract, ExchangeContract } from '@0x/contract-wrappers';
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
import { orderPrunerUtils } from '../src/utils/order_prune_utils';

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
const EXPIRY_BUFFER_MS = 120000;

// tslint:disable: no-unused-expression
// tslint:disable: custom-no-magic-numbers
describe('orderPrunerUtils', () => {
    let erc20MakerTokenContract: ERC20TokenContract;
    let erc20TakerTokenContract: ERC20TokenContract;
    let exchangeContract: ExchangeContract;
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

    let nonOpenSignedOrder: SignedOrder;
    let expiredOpenSignedOrder: SignedOrder;
    let partiallyFilledOpenSignedOrderFeeless: SignedOrder;
    let partiallyFilledOpenSignedOrderFeeInTakerAsset: SignedOrder;
    let partiallyFilledOpenSignedOrderFeeInMakerAsset: SignedOrder;

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
        exchangeContract = new ExchangeContract(contractAddresses.exchange, provider);

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
            expirationTimeSeconds: new BigNumber(await getLatestBlockTimestampAsync()).plus(60000),
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
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('prunedForUsableSignedOrders', () => {
        it('should filter for only feeless orders if options permit only feeless orders', async () => {
            const permittedOrderFeeTypes = new Set<OrderPrunerPermittedFeeTypes>([OrderPrunerPermittedFeeTypes.NoFees]);
            const orders = [
                partiallyFilledOpenSignedOrderFeeInMakerAsset,
                partiallyFilledOpenSignedOrderFeeInTakerAsset,
                partiallyFilledOpenSignedOrderFeeless,
            ];
            const resultPrunedOrders = orderPrunerUtils.pruneForUsableSignedOrders(
                orders,
                permittedOrderFeeTypes,
                EXPIRY_BUFFER_MS,
            );
            // checks for one order in results and check for signature of orders
            expect(resultPrunedOrders.length).to.be.equal(1);
            expect(resultPrunedOrders[0].signature).to.be.deep.equal(partiallyFilledOpenSignedOrderFeeless.signature);
        });
        it('should filter for only takerFee in takerAsset orders if options permit only takerFee in takerAsset orders', async () => {
            const permittedOrderFeeTypes = new Set<OrderPrunerPermittedFeeTypes>([
                OrderPrunerPermittedFeeTypes.TakerDenominatedTakerFee,
            ]);
            const orders = [
                partiallyFilledOpenSignedOrderFeeInMakerAsset,
                partiallyFilledOpenSignedOrderFeeInTakerAsset,
                partiallyFilledOpenSignedOrderFeeless,
            ];
            const resultPrunedOrders = orderPrunerUtils.pruneForUsableSignedOrders(
                orders,
                permittedOrderFeeTypes,
                EXPIRY_BUFFER_MS,
            );
            // checks for one order in results and check for signature of orders
            expect(resultPrunedOrders.length).to.be.equal(1);
            expect(resultPrunedOrders[0].signature).to.be.deep.equal(
                partiallyFilledOpenSignedOrderFeeInTakerAsset.signature,
            );
        });
        it('should filter for only makerFee in takerAsset orders if options permit only makerFee orders', async () => {
            const permittedOrderFeeTypes = new Set<OrderPrunerPermittedFeeTypes>([
                OrderPrunerPermittedFeeTypes.MakerDenominatedTakerFee,
            ]);
            const orders = [
                partiallyFilledOpenSignedOrderFeeInMakerAsset,
                partiallyFilledOpenSignedOrderFeeInTakerAsset,
                partiallyFilledOpenSignedOrderFeeless,
            ];
            const resultPrunedOrders = orderPrunerUtils.pruneForUsableSignedOrders(
                orders,
                permittedOrderFeeTypes,
                EXPIRY_BUFFER_MS,
            );
            // checks for one order in results and check for signature of orders
            expect(resultPrunedOrders.length).to.be.equal(1);
            expect(resultPrunedOrders[0].signature).to.be.deep.equal(
                partiallyFilledOpenSignedOrderFeeInMakerAsset.signature,
            );
        });
        it('should filter out non open orders', async () => {
            const permittedOrderFeeTypes = new Set<OrderPrunerPermittedFeeTypes>([
                OrderPrunerPermittedFeeTypes.MakerDenominatedTakerFee,
                OrderPrunerPermittedFeeTypes.NoFees,
                OrderPrunerPermittedFeeTypes.TakerDenominatedTakerFee,
            ]);
            const orders = [nonOpenSignedOrder];
            const resultPrunedOrders = orderPrunerUtils.pruneForUsableSignedOrders(
                orders,
                permittedOrderFeeTypes,
                EXPIRY_BUFFER_MS,
            );
            expect(resultPrunedOrders).to.be.empty;
        });
        it('should filter out expired orders', async () => {
            const permittedOrderFeeTypes = new Set<OrderPrunerPermittedFeeTypes>([
                OrderPrunerPermittedFeeTypes.MakerDenominatedTakerFee,
                OrderPrunerPermittedFeeTypes.NoFees,
                OrderPrunerPermittedFeeTypes.TakerDenominatedTakerFee,
            ]);
            const orders = [expiredOpenSignedOrder];
            const resultPrunedOrders = orderPrunerUtils.pruneForUsableSignedOrders(
                orders,
                permittedOrderFeeTypes,
                EXPIRY_BUFFER_MS,
            );
            expect(resultPrunedOrders).to.be.empty;
        });
    });
});
