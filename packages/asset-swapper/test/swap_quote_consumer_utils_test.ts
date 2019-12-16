import { ContractAddresses } from '@0x/contract-addresses';
import { DevUtilsContract, WETH9Contract } from '@0x/contract-wrappers';
import { constants as devConstants, OrderFactory } from '@0x/contracts-test-utils';
import { BlockchainLifecycle, tokenUtils } from '@0x/dev-utils';
import { migrateOnceAsync } from '@0x/migrations';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { SwapQuote, SwapQuoteConsumer } from '../src';
import { constants } from '../src/constants';
import { ExtensionContractType, MarketOperation, SignedOrderWithFillableAmounts } from '../src/types';
import { ProtocolFeeUtils } from '../src/utils/protocol_fee_utils';

import { chaiSetup } from './utils/chai_setup';
import { getFullyFillableSwapQuoteWithNoFeesAsync } from './utils/swap_quote';
import { provider, web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const ONE_ETH_IN_WEI = new BigNumber(1000000000000000000);
const TESTRPC_CHAIN_ID = 1337;
const GAS_PRICE = new BigNumber(devConstants.DEFAULT_GAS_PRICE);

const PARTIAL_PRUNED_SIGNED_ORDERS: Array<Partial<SignedOrderWithFillableAmounts>> = [
    {
        takerAssetAmount: new BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new BigNumber(2).multipliedBy(ONE_ETH_IN_WEI),
    },
    {
        takerAssetAmount: new BigNumber(3).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new BigNumber(3).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new BigNumber(3).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new BigNumber(3).multipliedBy(ONE_ETH_IN_WEI),
    },
    {
        takerAssetAmount: new BigNumber(5).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new BigNumber(5).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new BigNumber(5).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new BigNumber(5).multipliedBy(ONE_ETH_IN_WEI),
    },
];

const PARTIAL_LARGE_PRUNED_SIGNED_ORDERS: Array<Partial<SignedOrderWithFillableAmounts>> = [
    {
        takerAssetAmount: new BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
    },
    {
        takerAssetAmount: new BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
    },
    {
        takerAssetAmount: new BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
        makerAssetAmount: new BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
        fillableTakerAssetAmount: new BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
        fillableMakerAssetAmount: new BigNumber(20).multipliedBy(ONE_ETH_IN_WEI),
    },
];

describe('swapQuoteConsumerUtils', () => {
    let wethContract: WETH9Contract;
    let protocolFeeUtils: ProtocolFeeUtils;
    let userAddresses: string[];
    let makerAddress: string;
    let takerAddress: string;
    let makerTokenAddress: string;
    let takerTokenAddress: string;
    let makerAssetData: string;
    let takerAssetData: string;
    let wethAssetData: string;
    let contractAddresses: ContractAddresses;
    let swapQuoteConsumer: SwapQuoteConsumer;
    let orderFactory: OrderFactory;
    let forwarderOrderFactory: OrderFactory;

    const chainId = TESTRPC_CHAIN_ID;
    before(async () => {
        contractAddresses = await migrateOnceAsync(provider);
        await blockchainLifecycle.startAsync();
        userAddresses = await web3Wrapper.getAvailableAddressesAsync();
        const devUtils = new DevUtilsContract(contractAddresses.devUtils, provider);
        wethContract = new WETH9Contract(contractAddresses.etherToken, provider);
        [takerAddress, makerAddress] = userAddresses;
        [makerTokenAddress, takerTokenAddress] = tokenUtils.getDummyERC20TokenAddresses();
        [makerAssetData, takerAssetData, wethAssetData] = [
            await devUtils.encodeERC20AssetData(makerTokenAddress).callAsync(),
            await devUtils.encodeERC20AssetData(takerTokenAddress).callAsync(),
            await devUtils.encodeERC20AssetData(contractAddresses.etherToken).callAsync(),
        ];

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
            feeRecipientAddress: constants.NULL_ADDRESS,
            exchangeAddress: contractAddresses.exchange,
            chainId,
        };
        const defaultForwarderOrderParams = {
            ...defaultOrderParams,
            ...{
                takerAssetData: wethAssetData,
            },
        };
        const privateKey = devConstants.TESTRPC_PRIVATE_KEYS[userAddresses.indexOf(makerAddress)];
        orderFactory = new OrderFactory(privateKey, defaultOrderParams);
        protocolFeeUtils = new ProtocolFeeUtils(constants.PROTOCOL_FEE_UTILS_POLLING_INTERVAL_IN_MS);
        forwarderOrderFactory = new OrderFactory(privateKey, defaultForwarderOrderParams);

        swapQuoteConsumer = new SwapQuoteConsumer(provider, {
            chainId,
        });
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
        await protocolFeeUtils.destroyAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('getConsumerTypeForSwapQuoteAsync', () => {
        let forwarderOrders: SignedOrderWithFillableAmounts[];
        let exchangeOrders: SignedOrderWithFillableAmounts[];
        let largeForwarderOrders: SignedOrderWithFillableAmounts[];
        let forwarderSwapQuote: SwapQuote;
        let exchangeSwapQuote: SwapQuote;
        let largeForwarderSwapQuote: SwapQuote;

        beforeEach(async () => {
            exchangeOrders = [];
            for (const partialOrder of PARTIAL_PRUNED_SIGNED_ORDERS) {
                const order = await orderFactory.newSignedOrderAsync(partialOrder);
                const prunedOrder = {
                    ...order,
                    ...partialOrder,
                };
                exchangeOrders.push(prunedOrder as SignedOrderWithFillableAmounts);
            }

            forwarderOrders = [];
            for (const partialOrder of PARTIAL_PRUNED_SIGNED_ORDERS) {
                const order = await forwarderOrderFactory.newSignedOrderAsync(partialOrder);
                const prunedOrder = {
                    ...order,
                    ...partialOrder,
                };
                forwarderOrders.push(prunedOrder as SignedOrderWithFillableAmounts);
            }

            largeForwarderOrders = [];
            for (const partialOrder of PARTIAL_LARGE_PRUNED_SIGNED_ORDERS) {
                const order = await forwarderOrderFactory.newSignedOrderAsync(partialOrder);
                const prunedOrder = {
                    ...order,
                    ...partialOrder,
                };
                largeForwarderOrders.push(prunedOrder as SignedOrderWithFillableAmounts);
            }

            forwarderSwapQuote = await getFullyFillableSwapQuoteWithNoFeesAsync(
                makerAssetData,
                wethAssetData,
                forwarderOrders,
                MarketOperation.Sell,
                GAS_PRICE,
                protocolFeeUtils,
            );

            largeForwarderSwapQuote = await getFullyFillableSwapQuoteWithNoFeesAsync(
                makerAssetData,
                wethAssetData,
                largeForwarderOrders,
                MarketOperation.Sell,
                GAS_PRICE,
                protocolFeeUtils,
            );

            exchangeSwapQuote = await getFullyFillableSwapQuoteWithNoFeesAsync(
                makerAssetData,
                takerAssetData,
                exchangeOrders,
                MarketOperation.Sell,
                GAS_PRICE,
                protocolFeeUtils,
            );
        });

        it('should return exchange consumer if takerAsset is not wEth', async () => {
            const extensionContractType = await swapQuoteConsumer.getOptimalExtensionContractTypeAsync(
                exchangeSwapQuote,
                { takerAddress },
            );
            expect(extensionContractType).to.equal(ExtensionContractType.None);
        });
        it('should return forwarder consumer if takerAsset is wEth and have enough eth balance', async () => {
            const extensionContractType = await swapQuoteConsumer.getOptimalExtensionContractTypeAsync(
                forwarderSwapQuote,
                { takerAddress },
            );
            expect(extensionContractType).to.equal(ExtensionContractType.Forwarder);
        });
        it('should return exchange consumer if takerAsset is wEth and taker has enough weth', async () => {
            const etherInWei = new BigNumber(20).multipliedBy(ONE_ETH_IN_WEI);
            await wethContract.deposit().sendTransactionAsync({ value: etherInWei, from: takerAddress });
            const extensionContractType = await swapQuoteConsumer.getOptimalExtensionContractTypeAsync(
                forwarderSwapQuote,
                { takerAddress },
            );
            expect(extensionContractType).to.equal(ExtensionContractType.None);
        });
        it('should return forwarder consumer if takerAsset is wEth and takerAddress has no available balance in either weth or eth (defaulting behavior)', async () => {
            const etherInWei = new BigNumber(50).multipliedBy(ONE_ETH_IN_WEI);
            await wethContract.deposit().sendTransactionAsync({ value: etherInWei, from: takerAddress });
            const extensionContractType = await swapQuoteConsumer.getOptimalExtensionContractTypeAsync(
                largeForwarderSwapQuote,
                { takerAddress },
            );
            expect(extensionContractType).to.equal(ExtensionContractType.Forwarder);
        });
    });
});
