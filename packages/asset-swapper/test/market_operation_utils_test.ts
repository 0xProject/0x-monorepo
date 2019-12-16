import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import {
    assertRoughlyEquals,
    constants,
    expect,
    getRandomFloat,
    getRandomInteger,
    Numberish,
    randomAddress,
} from '@0x/contracts-test-utils';

import { assetDataUtils, generatePseudoRandomSalt } from '@0x/order-utils';
import { Order, SignedOrder } from '@0x/types';
import { BigNumber, hexUtils } from '@0x/utils';
import * as _ from 'lodash';

import { MarketOperationUtils } from '../src/utils/market_operation_utils/';
import { constants as marketOperationUtilConstants } from '../src/utils/market_operation_utils/constants';
import { createBridgeAssetData } from '../src/utils/market_operation_utils/create_order';
import { DexOrderSampler } from '../src/utils/market_operation_utils/sampler';
import { ERC20BridgeSource } from '../src/utils/market_operation_utils/types';

import { MockSamplerContract, QueryAndSampleResult } from './utils/mock_sampler_contract';

const { SOURCE_TO_ADDRESS, BUY_SOURCES, SELL_SOURCES } = marketOperationUtilConstants;

// Because the bridges and the DEX sources are only deployed on mainnet, tests will resort to using mainnet addresses
const CHAIN_ID = 1;
// tslint:disable: custom-no-magic-numbers
describe('MarketOperationUtils tests', () => {
    const contractAddresses = getContractAddressesForChainOrThrow(CHAIN_ID);
    const ETH2DAI_BRIDGE_ADDRESS = contractAddresses.eth2DaiBridge;
    const KYBER_BRIDGE_ADDRESS = contractAddresses.kyberBridge;
    const UNISWAP_BRIDGE_ADDRESS = contractAddresses.uniswapBridge;

    const MAKER_TOKEN = randomAddress();
    const TAKER_TOKEN = randomAddress();
    const MAKER_ASSET_DATA = assetDataUtils.encodeERC20AssetData(MAKER_TOKEN);
    const TAKER_ASSET_DATA = assetDataUtils.encodeERC20AssetData(TAKER_TOKEN);

    interface RatesBySource {
        [source: string]: Numberish[];
    }

    function createOrder(overrides?: Partial<SignedOrder>): SignedOrder {
        return {
            chainId: CHAIN_ID,
            exchangeAddress: contractAddresses.exchange,
            makerAddress: constants.NULL_ADDRESS,
            takerAddress: constants.NULL_ADDRESS,
            senderAddress: constants.NULL_ADDRESS,
            feeRecipientAddress: randomAddress(),
            salt: generatePseudoRandomSalt(),
            expirationTimeSeconds: getRandomInteger(0, 2 ** 64),
            makerAssetData: MAKER_ASSET_DATA,
            takerAssetData: TAKER_ASSET_DATA,
            makerFeeAssetData: assetDataUtils.encodeERC20AssetData(randomAddress()),
            takerFeeAssetData: assetDataUtils.encodeERC20AssetData(randomAddress()),
            makerAssetAmount: getRandomInteger(1, 1e18),
            takerAssetAmount: getRandomInteger(1, 1e18),
            makerFee: getRandomInteger(1, 1e17),
            takerFee: getRandomInteger(1, 1e17),
            signature: hexUtils.random(),
            ...overrides,
        };
    }

    function getSourceFromAssetData(assetData: string): ERC20BridgeSource {
        if (assetData.length === 74) {
            return ERC20BridgeSource.Native;
        }
        const bridgeAddress = hexUtils.slice(assetData, 48, 68).toLowerCase();
        switch (bridgeAddress) {
            case KYBER_BRIDGE_ADDRESS.toLowerCase():
                return ERC20BridgeSource.Kyber;
            case ETH2DAI_BRIDGE_ADDRESS.toLowerCase():
                return ERC20BridgeSource.Eth2Dai;
            case UNISWAP_BRIDGE_ADDRESS.toLowerCase():
                return ERC20BridgeSource.Uniswap;
            default:
                break;
        }
        throw new Error(`Unknown bridge address: ${bridgeAddress}`);
    }

    function getSourceFromAddress(sourceAddress: string): ERC20BridgeSource {
        for (const k of Object.keys(SOURCE_TO_ADDRESS)) {
            if (SOURCE_TO_ADDRESS[k].toLowerCase() === sourceAddress.toLowerCase()) {
                return k as ERC20BridgeSource;
            }
        }
        throw new Error(`Unknown source address: ${sourceAddress}`);
    }

    function assertSamePrefix(actual: string, expected: string): void {
        expect(actual.substr(0, expected.length)).to.eq(expected);
    }

    function createOrdersFromSellRates(takerAssetAmount: BigNumber, rates: Numberish[]): SignedOrder[] {
        const singleTakerAssetAmount = takerAssetAmount.div(rates.length).integerValue(BigNumber.ROUND_UP);
        return rates.map(r =>
            createOrder({
                makerAssetAmount: singleTakerAssetAmount.times(r),
                takerAssetAmount: singleTakerAssetAmount,
            }),
        );
    }

    function createOrdersFromBuyRates(makerAssetAmount: BigNumber, rates: Numberish[]): SignedOrder[] {
        const singleMakerAssetAmount = makerAssetAmount.div(rates.length).integerValue(BigNumber.ROUND_UP);
        return (rates as any).map((r: Numberish) =>
            createOrder({
                makerAssetAmount: singleMakerAssetAmount,
                takerAssetAmount: singleMakerAssetAmount.div(r),
            }),
        );
    }

    function createSamplerFromSellRates(rates: RatesBySource): MockSamplerContract {
        return new MockSamplerContract({
            queryOrdersAndSampleSells: (orders, signatures, sources, fillAmounts) => {
                const fillableTakerAssetAmounts = orders.map(o => o.takerAssetAmount);
                const samplesBySourceIndex = sources.map(s =>
                    fillAmounts.map((fillAmount, idx) =>
                        fillAmount.times(rates[getSourceFromAddress(s)][idx]).integerValue(BigNumber.ROUND_UP),
                    ),
                );
                return [fillableTakerAssetAmounts, samplesBySourceIndex];
            },
        });
    }

    function createSamplerFromBuyRates(rates: RatesBySource): MockSamplerContract {
        return new MockSamplerContract({
            queryOrdersAndSampleBuys: (orders, signatures, sources, fillAmounts) => {
                const fillableMakerAssetAmounts = orders.map(o => o.makerAssetAmount);
                const samplesBySourceIndex = sources.map(s =>
                    fillAmounts.map((fillAmount, idx) =>
                        fillAmount.div(rates[getSourceFromAddress(s)][idx]).integerValue(BigNumber.ROUND_UP),
                    ),
                );
                return [fillableMakerAssetAmounts, samplesBySourceIndex];
            },
        });
    }

    const DUMMY_QUERY_AND_SAMPLE_HANDLER_SELL = (
        orders: Order[],
        signatures: string[],
        sources: string[],
        fillAmounts: BigNumber[],
    ): QueryAndSampleResult => [
        orders.map((order: Order) => order.takerAssetAmount),
        sources.map(() => fillAmounts.map(() => getRandomInteger(1, 1e18))),
    ];

    const DUMMY_QUERY_AND_SAMPLE_HANDLER_BUY = (
        orders: Order[],
        signatures: string[],
        sources: string[],
        fillAmounts: BigNumber[],
    ): QueryAndSampleResult => [
        orders.map((order: Order) => order.makerAssetAmount),
        sources.map(() => fillAmounts.map(() => getRandomInteger(1, 1e18))),
    ];

    const ORDER_DOMAIN = {
        exchangeAddress: contractAddresses.exchange,
        chainId: CHAIN_ID,
    };

    describe('DexOrderSampler', () => {
        describe('getSampleAmounts()', () => {
            const FILL_AMOUNT = getRandomInteger(1, 1e18);
            const NUM_SAMPLES = 16;

            it('generates the correct number of amounts', () => {
                const amounts = DexOrderSampler.getSampleAmounts(FILL_AMOUNT, NUM_SAMPLES);
                expect(amounts).to.be.length(NUM_SAMPLES);
            });

            it('first amount is nonzero', () => {
                const amounts = DexOrderSampler.getSampleAmounts(FILL_AMOUNT, NUM_SAMPLES);
                expect(amounts[0]).to.not.bignumber.eq(0);
            });

            it('last amount is the fill amount', () => {
                const amounts = DexOrderSampler.getSampleAmounts(FILL_AMOUNT, NUM_SAMPLES);
                expect(amounts[NUM_SAMPLES - 1]).to.bignumber.eq(FILL_AMOUNT);
            });

            it('can generate a single amount', () => {
                const amounts = DexOrderSampler.getSampleAmounts(FILL_AMOUNT, 1);
                expect(amounts).to.be.length(1);
                expect(amounts[0]).to.bignumber.eq(FILL_AMOUNT);
            });

            it('generates ascending amounts', () => {
                const amounts = DexOrderSampler.getSampleAmounts(FILL_AMOUNT, NUM_SAMPLES);
                for (const i of _.times(NUM_SAMPLES).slice(1)) {
                    const prev = amounts[i - 1];
                    const amount = amounts[i];
                    expect(prev).to.bignumber.lt(amount);
                }
            });
        });

        describe('getFillableAmountsAndSampleMarketOperationAsync()', () => {
            const SAMPLE_AMOUNTS = [100, 500, 1000].map(v => new BigNumber(v));
            const ORDERS = _.times(4, () => createOrder());

            it('makes an eth_call with the correct arguments for a sell', async () => {
                const sampler = new MockSamplerContract({
                    queryOrdersAndSampleSells: (orders, signatures, sources, fillAmounts) => {
                        expect(orders).to.deep.eq(ORDERS);
                        expect(signatures).to.deep.eq(ORDERS.map(o => o.signature));
                        expect(sources).to.deep.eq(SELL_SOURCES.map(s => SOURCE_TO_ADDRESS[s]));
                        expect(fillAmounts).to.deep.eq(SAMPLE_AMOUNTS);
                        return [
                            orders.map(() => getRandomInteger(1, 1e18)),
                            sources.map(() => fillAmounts.map(() => getRandomInteger(1, 1e18))),
                        ];
                    },
                });
                const dexOrderSampler = new DexOrderSampler(sampler);
                await dexOrderSampler.getFillableAmountsAndSampleMarketSellAsync(ORDERS, SAMPLE_AMOUNTS, SELL_SOURCES);
            });

            it('makes an eth_call with the correct arguments for a buy', async () => {
                const sampler = new MockSamplerContract({
                    queryOrdersAndSampleBuys: (orders, signatures, sources, fillAmounts) => {
                        expect(orders).to.deep.eq(ORDERS);
                        expect(signatures).to.deep.eq(ORDERS.map(o => o.signature));
                        expect(sources).to.deep.eq(BUY_SOURCES.map(s => SOURCE_TO_ADDRESS[s]));
                        expect(fillAmounts).to.deep.eq(SAMPLE_AMOUNTS);
                        return [
                            orders.map(() => getRandomInteger(1, 1e18)),
                            sources.map(() => fillAmounts.map(() => getRandomInteger(1, 1e18))),
                        ];
                    },
                });
                const dexOrderSampler = new DexOrderSampler(sampler);
                await dexOrderSampler.getFillableAmountsAndSampleMarketBuyAsync(ORDERS, SAMPLE_AMOUNTS, BUY_SOURCES);
            });

            it('returns correct fillable amounts', async () => {
                const fillableAmounts = _.times(SAMPLE_AMOUNTS.length, () => getRandomInteger(1, 1e18));
                const sampler = new MockSamplerContract({
                    queryOrdersAndSampleSells: (orders, signatures, sources, fillAmounts) => [
                        fillableAmounts,
                        sources.map(() => fillAmounts.map(() => getRandomInteger(1, 1e18))),
                    ],
                });
                const dexOrderSampler = new DexOrderSampler(sampler);
                const [actualFillableAmounts] = await dexOrderSampler.getFillableAmountsAndSampleMarketSellAsync(
                    ORDERS,
                    SAMPLE_AMOUNTS,
                    SELL_SOURCES,
                );
                expect(actualFillableAmounts).to.deep.eq(fillableAmounts);
            });

            it('converts samples to DEX quotes', async () => {
                const quotes = SELL_SOURCES.map(source =>
                    SAMPLE_AMOUNTS.map(s => ({
                        source,
                        input: s,
                        output: getRandomInteger(1, 1e18),
                    })),
                );
                const sampler = new MockSamplerContract({
                    queryOrdersAndSampleSells: (orders, signatures, sources, fillAmounts) => [
                        orders.map(() => getRandomInteger(1, 1e18)),
                        quotes.map(q => q.map(s => s.output)),
                    ],
                });
                const dexOrderSampler = new DexOrderSampler(sampler);
                const [, actualQuotes] = await dexOrderSampler.getFillableAmountsAndSampleMarketSellAsync(
                    ORDERS,
                    SAMPLE_AMOUNTS,
                    SELL_SOURCES,
                );
                expect(actualQuotes).to.deep.eq(quotes);
            });
        });
    });

    function createRandomRates(numSamples: number = 32): RatesBySource {
        const ALL_SOURCES = [
            ERC20BridgeSource.Native,
            ERC20BridgeSource.Eth2Dai,
            ERC20BridgeSource.Kyber,
            ERC20BridgeSource.Uniswap,
        ];
        return _.zipObject(
            ALL_SOURCES,
            _.times(ALL_SOURCES.length, () => _.fill(new Array(numSamples), getRandomFloat(1e-3, 2))),
        );
    }

    describe('MarketOperationUtils', () => {
        describe('getMarketSellOrdersAsync()', () => {
            const FILL_AMOUNT = getRandomInteger(1, 1e18);
            const SOURCE_RATES = createRandomRates();
            const ORDERS = createOrdersFromSellRates(
                FILL_AMOUNT,
                _.times(3, () => SOURCE_RATES[ERC20BridgeSource.Native][0]),
            );
            const DEFAULT_SAMPLER = createSamplerFromSellRates(SOURCE_RATES);
            const DEFAULT_OPTS = { numSamples: 3, runLimit: 0 };
            const defaultMarketOperationUtils = new MarketOperationUtils(
                DEFAULT_SAMPLER,
                contractAddresses,
                ORDER_DOMAIN,
            );

            it('calls `getFillableAmountsAndSampleMarketSellAsync()`', async () => {
                let wasCalled = false;
                const sampler = new MockSamplerContract({
                    queryOrdersAndSampleSells: (...args) => {
                        wasCalled = true;
                        return DUMMY_QUERY_AND_SAMPLE_HANDLER_SELL(...args);
                    },
                });
                const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, ORDER_DOMAIN);
                await marketOperationUtils.getMarketSellOrdersAsync(ORDERS, FILL_AMOUNT, DEFAULT_OPTS);
                expect(wasCalled).to.be.true();
            });

            it('queries `numSamples` samples', async () => {
                const numSamples = _.random(1, 16);
                let fillAmountsLength = 0;
                const sampler = new MockSamplerContract({
                    queryOrdersAndSampleSells: (orders, signatures, sources, fillAmounts) => {
                        fillAmountsLength = fillAmounts.length;
                        return DUMMY_QUERY_AND_SAMPLE_HANDLER_SELL(orders, signatures, sources, fillAmounts);
                    },
                });
                const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, ORDER_DOMAIN);
                await marketOperationUtils.getMarketSellOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    numSamples,
                });
                expect(fillAmountsLength).eq(numSamples);
            });

            it('polls all DEXes if `excludedSources` is empty', async () => {
                let sourcesPolled: ERC20BridgeSource[] = [];
                const sampler = new MockSamplerContract({
                    queryOrdersAndSampleSells: (orders, signatures, sources, fillAmounts) => {
                        sourcesPolled = sources.map(a => getSourceFromAddress(a));
                        return DUMMY_QUERY_AND_SAMPLE_HANDLER_SELL(orders, signatures, sources, fillAmounts);
                    },
                });
                const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, ORDER_DOMAIN);
                await marketOperationUtils.getMarketSellOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    excludedSources: [],
                });
                expect(sourcesPolled).to.deep.eq(SELL_SOURCES);
            });

            it('does not poll DEXes in `excludedSources`', async () => {
                const excludedSources = _.sampleSize(SELL_SOURCES, _.random(1, SELL_SOURCES.length));
                let sourcesPolled: ERC20BridgeSource[] = [];
                const sampler = new MockSamplerContract({
                    queryOrdersAndSampleSells: (orders, signatures, sources, fillAmounts) => {
                        sourcesPolled = sources.map(a => getSourceFromAddress(a));
                        return DUMMY_QUERY_AND_SAMPLE_HANDLER_SELL(orders, signatures, sources, fillAmounts);
                    },
                });
                const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, ORDER_DOMAIN);
                await marketOperationUtils.getMarketSellOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    excludedSources,
                });
                expect(sourcesPolled).to.deep.eq(_.without(SELL_SOURCES, ...excludedSources));
            });

            it('returns the most cost-effective single source if `runLimit == 0`', async () => {
                const bestRate = BigNumber.max(..._.flatten(Object.values(SOURCE_RATES)));
                const bestSource = _.findKey(SOURCE_RATES, ([r]) => new BigNumber(r).eq(bestRate));
                expect(bestSource).to.exist('');
                const improvedOrders = await defaultMarketOperationUtils.getMarketSellOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    runLimit: 0,
                });
                const uniqueAssetDatas = _.uniq(improvedOrders.map(o => o.makerAssetData));
                expect(uniqueAssetDatas).to.be.length(1);
                expect(getSourceFromAssetData(uniqueAssetDatas[0])).to.be.eq(bestSource);
            });

            it('generates bridge orders with correct asset data', async () => {
                const improvedOrders = await defaultMarketOperationUtils.getMarketSellOrdersAsync(
                    // Pass in empty orders to prevent native orders from being used.
                    ORDERS.map(o => ({ ...o, makerAssetAmount: constants.ZERO_AMOUNT })),
                    FILL_AMOUNT,
                    DEFAULT_OPTS,
                );
                expect(improvedOrders).to.not.be.length(0);
                for (const order of improvedOrders) {
                    expect(getSourceFromAssetData(order.makerAssetData)).to.exist('');
                    const makerAssetDataPrefix = hexUtils.slice(
                        createBridgeAssetData(MAKER_TOKEN, constants.NULL_ADDRESS, constants.NULL_BYTES),
                        0,
                        36,
                    );
                    assertSamePrefix(order.makerAssetData, makerAssetDataPrefix);
                    expect(order.takerAssetData).to.eq(TAKER_ASSET_DATA);
                }
            });

            it('generates bridge orders with correct taker amount', async () => {
                const improvedOrders = await defaultMarketOperationUtils.getMarketSellOrdersAsync(
                    // Pass in empty orders to prevent native orders from being used.
                    ORDERS.map(o => ({ ...o, makerAssetAmount: constants.ZERO_AMOUNT })),
                    FILL_AMOUNT,
                    DEFAULT_OPTS,
                );
                const totalTakerAssetAmount = BigNumber.sum(...improvedOrders.map(o => o.takerAssetAmount));
                expect(totalTakerAssetAmount).to.bignumber.gte(FILL_AMOUNT);
            });

            it('generates bridge orders with max slippage of `bridgeSlippage`', async () => {
                const bridgeSlippage = _.random(0.1, true);
                const improvedOrders = await defaultMarketOperationUtils.getMarketSellOrdersAsync(
                    // Pass in empty orders to prevent native orders from being used.
                    ORDERS.map(o => ({ ...o, makerAssetAmount: constants.ZERO_AMOUNT })),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, bridgeSlippage },
                );
                expect(improvedOrders).to.not.be.length(0);
                for (const order of improvedOrders) {
                    const source = getSourceFromAssetData(order.makerAssetData);
                    const expectedMakerAmount = FILL_AMOUNT.times(SOURCE_RATES[source][0]);
                    const slippage = 1 - order.makerAssetAmount.div(expectedMakerAmount.plus(1)).toNumber();
                    assertRoughlyEquals(slippage, bridgeSlippage, 8);
                }
            });

            it('ignores native orders below `dustFractionThreshold`', async () => {
                const dustFractionThreshold = 0.01;
                const dustAmount = FILL_AMOUNT.times(dustFractionThreshold).integerValue(BigNumber.ROUND_DOWN);
                const maxRate = BigNumber.max(...ORDERS.map(o => o.makerAssetAmount.div(o.takerAssetAmount)));
                // Pass in an order with the globally best rate but with a dust input amount.
                const dustOrder = createOrder({
                    makerAssetAmount: dustAmount.times(maxRate.plus(0.01)),
                    takerAssetAmount: dustAmount,
                });
                const improvedOrders = await defaultMarketOperationUtils.getMarketSellOrdersAsync(
                    _.shuffle([dustOrder, ...ORDERS]),
                    FILL_AMOUNT,
                    // Ignore all DEX sources so only native orders are returned.
                    { ...DEFAULT_OPTS, dustFractionThreshold, excludedSources: SELL_SOURCES },
                );
                expect(improvedOrders).to.not.be.length(0);
                for (const order of improvedOrders) {
                    expect(order.takerAssetAmount).to.bignumber.gt(dustAmount);
                }
            });

            it('can mix convex sources', async () => {
                const rates: RatesBySource = {};
                rates[ERC20BridgeSource.Native] = [0.4, 0.3, 0.2, 0.1];
                rates[ERC20BridgeSource.Uniswap] = [0.5, 0.05, 0.05, 0.05];
                rates[ERC20BridgeSource.Eth2Dai] = [0.6, 0.05, 0.05, 0.05];
                rates[ERC20BridgeSource.Kyber] = [0.7, 0.05, 0.05, 0.05];
                const marketOperationUtils = new MarketOperationUtils(
                    createSamplerFromSellRates(rates),
                    contractAddresses,
                    ORDER_DOMAIN,
                );
                const improvedOrders = await marketOperationUtils.getMarketSellOrdersAsync(
                    createOrdersFromSellRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, numSamples: 4, runLimit: 512, noConflicts: false },
                );
                expect(improvedOrders).to.be.length(4);
                const orderSources = improvedOrders.map(o => getSourceFromAssetData(o.makerAssetData)).sort();
                const expectedSources = [
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Uniswap,
                    ERC20BridgeSource.Eth2Dai,
                    ERC20BridgeSource.Kyber,
                ].sort();
                expect(orderSources).to.deep.eq(expectedSources);
            });

            it('excludes Kyber when `noConflicts` enabled and Uniswap or Eth2Dai are used first', async () => {
                const rates: RatesBySource = {};
                rates[ERC20BridgeSource.Native] = [0.4, 0.3, 0.2, 0.1];
                rates[ERC20BridgeSource.Uniswap] = [0.5, 0.05, 0.05, 0.05];
                rates[ERC20BridgeSource.Eth2Dai] = [0.6, 0.05, 0.05, 0.05];
                rates[ERC20BridgeSource.Kyber] = [0.7, 0.05, 0.05, 0.05];
                const marketOperationUtils = new MarketOperationUtils(
                    createSamplerFromSellRates(rates),
                    contractAddresses,
                    ORDER_DOMAIN,
                );
                const improvedOrders = await marketOperationUtils.getMarketSellOrdersAsync(
                    createOrdersFromSellRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, numSamples: 4, runLimit: 512, noConflicts: true },
                );
                expect(improvedOrders).to.be.length(4);
                const orderSources = improvedOrders.map(o => getSourceFromAssetData(o.makerAssetData)).sort();
                const expectedSources = [
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Uniswap,
                    ERC20BridgeSource.Eth2Dai,
                ].sort();
                expect(orderSources).to.deep.eq(expectedSources);
            });

            it('excludes Uniswap and Eth2Dai when `noConflicts` enabled and Kyber is used first', async () => {
                const rates: RatesBySource = {};
                rates[ERC20BridgeSource.Native] = [0.4, 0.3, 0.2, 0.1];
                rates[ERC20BridgeSource.Uniswap] = [0.15, 0.05, 0.05, 0.05];
                rates[ERC20BridgeSource.Eth2Dai] = [0.15, 0.05, 0.05, 0.05];
                rates[ERC20BridgeSource.Kyber] = [0.7, 0.05, 0.05, 0.05];
                const marketOperationUtils = new MarketOperationUtils(
                    createSamplerFromSellRates(rates),
                    contractAddresses,
                    ORDER_DOMAIN,
                );
                const improvedOrders = await marketOperationUtils.getMarketSellOrdersAsync(
                    createOrdersFromSellRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, numSamples: 4, runLimit: 512, noConflicts: true },
                );
                expect(improvedOrders).to.be.length(4);
                const orderSources = improvedOrders.map(o => getSourceFromAssetData(o.makerAssetData)).sort();
                const expectedSources = [
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Kyber,
                ].sort();
                expect(orderSources).to.deep.eq(expectedSources);
            });
        });

        describe('getMarketBuyOrdersAsync()', () => {
            const FILL_AMOUNT = getRandomInteger(1, 1e18);
            const SOURCE_RATES = _.omit(createRandomRates(), [ERC20BridgeSource.Kyber]);
            const ORDERS = createOrdersFromBuyRates(
                FILL_AMOUNT,
                _.times(3, () => SOURCE_RATES[ERC20BridgeSource.Native][0]),
            );
            const DEFAULT_SAMPLER = createSamplerFromBuyRates(SOURCE_RATES);
            const DEFAULT_OPTS = { numSamples: 3, runLimit: 0 };
            const defaultMarketOperationUtils = new MarketOperationUtils(
                DEFAULT_SAMPLER,
                contractAddresses,
                ORDER_DOMAIN,
            );

            it('calls `getFillableAmountsAndSampleMarketSellAsync()`', async () => {
                let wasCalled = false;
                const sampler = new MockSamplerContract({
                    queryOrdersAndSampleBuys: (...args) => {
                        wasCalled = true;
                        return DUMMY_QUERY_AND_SAMPLE_HANDLER_BUY(...args);
                    },
                });
                const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, ORDER_DOMAIN);

                await marketOperationUtils.getMarketBuyOrdersAsync(ORDERS, FILL_AMOUNT, DEFAULT_OPTS);
                expect(wasCalled).to.be.true();
            });

            it('queries `numSamples` samples', async () => {
                const numSamples = _.random(1, 16);
                let fillAmountsLength = 0;
                const sampler = new MockSamplerContract({
                    queryOrdersAndSampleBuys: (orders, signatures, sources, fillAmounts) => {
                        fillAmountsLength = fillAmounts.length;
                        return DUMMY_QUERY_AND_SAMPLE_HANDLER_BUY(orders, signatures, sources, fillAmounts);
                    },
                });
                const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, ORDER_DOMAIN);

                await marketOperationUtils.getMarketBuyOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    numSamples,
                });
                expect(fillAmountsLength).eq(numSamples);
            });

            it('polls all DEXes if `excludedSources` is empty', async () => {
                let sourcesPolled: ERC20BridgeSource[] = [];
                const sampler = new MockSamplerContract({
                    queryOrdersAndSampleBuys: (orders, signatures, sources, fillAmounts) => {
                        sourcesPolled = sources.map(a => getSourceFromAddress(a));
                        return DUMMY_QUERY_AND_SAMPLE_HANDLER_BUY(orders, signatures, sources, fillAmounts);
                    },
                });
                const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, ORDER_DOMAIN);

                await marketOperationUtils.getMarketBuyOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    excludedSources: [],
                });
                expect(sourcesPolled).to.deep.eq(BUY_SOURCES);
            });

            it('does not poll DEXes in `excludedSources`', async () => {
                const excludedSources = _.sampleSize(BUY_SOURCES, _.random(1, BUY_SOURCES.length));
                let sourcesPolled: ERC20BridgeSource[] = [];
                const sampler = new MockSamplerContract({
                    queryOrdersAndSampleBuys: (orders, signatures, sources, fillAmounts) => {
                        sourcesPolled = sources.map(a => getSourceFromAddress(a));
                        return DUMMY_QUERY_AND_SAMPLE_HANDLER_BUY(orders, signatures, sources, fillAmounts);
                    },
                });
                const marketOperationUtils = new MarketOperationUtils(sampler, contractAddresses, ORDER_DOMAIN);

                await marketOperationUtils.getMarketBuyOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    excludedSources,
                });
                expect(sourcesPolled).to.deep.eq(_.without(BUY_SOURCES, ...excludedSources));
            });

            it('returns the most cost-effective single source if `runLimit == 0`', async () => {
                const bestRate = BigNumber.max(..._.flatten(Object.values(SOURCE_RATES)));
                const bestSource = _.findKey(SOURCE_RATES, ([r]) => new BigNumber(r).eq(bestRate));
                expect(bestSource).to.exist('');
                const improvedOrders = await defaultMarketOperationUtils.getMarketBuyOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    runLimit: 0,
                });
                const uniqueAssetDatas = _.uniq(improvedOrders.map(o => o.makerAssetData));
                expect(uniqueAssetDatas).to.be.length(1);
                expect(getSourceFromAssetData(uniqueAssetDatas[0])).to.be.eq(bestSource);
            });
            it('generates bridge orders with correct asset data', async () => {
                const improvedOrders = await defaultMarketOperationUtils.getMarketBuyOrdersAsync(
                    // Pass in empty orders to prevent native orders from being used.
                    ORDERS.map(o => ({ ...o, makerAssetAmount: constants.ZERO_AMOUNT })),
                    FILL_AMOUNT,
                    DEFAULT_OPTS,
                );
                expect(improvedOrders).to.not.be.length(0);
                for (const order of improvedOrders) {
                    expect(getSourceFromAssetData(order.makerAssetData)).to.exist('');
                    const makerAssetDataPrefix = hexUtils.slice(
                        createBridgeAssetData(MAKER_TOKEN, constants.NULL_ADDRESS, constants.NULL_BYTES),
                        0,
                        36,
                    );
                    assertSamePrefix(order.makerAssetData, makerAssetDataPrefix);
                    expect(order.takerAssetData).to.eq(TAKER_ASSET_DATA);
                }
            });

            it('generates bridge orders with correct taker amount', async () => {
                const improvedOrders = await defaultMarketOperationUtils.getMarketBuyOrdersAsync(
                    // Pass in empty orders to prevent native orders from being used.
                    ORDERS.map(o => ({ ...o, makerAssetAmount: constants.ZERO_AMOUNT })),
                    FILL_AMOUNT,
                    DEFAULT_OPTS,
                );
                const totalMakerAssetAmount = BigNumber.sum(...improvedOrders.map(o => o.makerAssetAmount));
                expect(totalMakerAssetAmount).to.bignumber.gte(FILL_AMOUNT);
            });

            it('generates bridge orders with max slippage of `bridgeSlippage`', async () => {
                const bridgeSlippage = _.random(0.1, true);
                const improvedOrders = await defaultMarketOperationUtils.getMarketBuyOrdersAsync(
                    // Pass in empty orders to prevent native orders from being used.
                    ORDERS.map(o => ({ ...o, makerAssetAmount: constants.ZERO_AMOUNT })),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, bridgeSlippage },
                );
                expect(improvedOrders).to.not.be.length(0);
                for (const order of improvedOrders) {
                    const source = getSourceFromAssetData(order.makerAssetData);
                    const expectedTakerAmount = FILL_AMOUNT.div(SOURCE_RATES[source][0]).integerValue(
                        BigNumber.ROUND_UP,
                    );
                    const slippage = order.takerAssetAmount.div(expectedTakerAmount.plus(1)).toNumber() - 1;
                    assertRoughlyEquals(slippage, bridgeSlippage, 8);
                }
            });

            it('Ignores native orders below `dustFractionThreshold`', async () => {
                const dustFractionThreshold = 0.01;
                const dustAmount = FILL_AMOUNT.times(dustFractionThreshold).integerValue(BigNumber.ROUND_DOWN);
                const maxRate = BigNumber.max(...ORDERS.map(o => o.makerAssetAmount.div(o.takerAssetAmount)));
                // Pass in an order with the globally best rate but with a dust input amount.
                const dustOrder = createOrder({
                    makerAssetAmount: dustAmount,
                    takerAssetAmount: dustAmount.div(maxRate.plus(0.01)).integerValue(BigNumber.ROUND_DOWN),
                });
                const improvedOrders = await defaultMarketOperationUtils.getMarketBuyOrdersAsync(
                    _.shuffle([dustOrder, ...ORDERS]),
                    FILL_AMOUNT,
                    // Ignore all DEX sources so only native orders are returned.
                    { ...DEFAULT_OPTS, dustFractionThreshold, excludedSources: BUY_SOURCES },
                );
                expect(improvedOrders).to.not.be.length(0);
                for (const order of improvedOrders) {
                    expect(order.makerAssetAmount).to.bignumber.gt(dustAmount);
                }
            });

            it('can mix convex sources', async () => {
                const rates: RatesBySource = {};
                rates[ERC20BridgeSource.Native] = [0.4, 0.3, 0.2, 0.1];
                rates[ERC20BridgeSource.Uniswap] = [0.5, 0.05, 0.05, 0.05];
                rates[ERC20BridgeSource.Eth2Dai] = [0.6, 0.05, 0.05, 0.05];
                const marketOperationUtils = new MarketOperationUtils(
                    createSamplerFromBuyRates(rates),
                    contractAddresses,
                    ORDER_DOMAIN,
                );
                const improvedOrders = await marketOperationUtils.getMarketBuyOrdersAsync(
                    createOrdersFromBuyRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, numSamples: 4, runLimit: 512 },
                );
                expect(improvedOrders).to.be.length(4);
                const orderSources = improvedOrders.map(o => getSourceFromAssetData(o.makerAssetData)).sort();
                const expectedSources = [
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Uniswap,
                    ERC20BridgeSource.Eth2Dai,
                ].sort();
                expect(orderSources).to.deep.eq(expectedSources);
            });
        });
    });
});
// tslint:disable-next-line: max-file-line-count
