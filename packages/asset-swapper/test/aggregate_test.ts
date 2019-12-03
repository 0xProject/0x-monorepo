import {
    assertRoughlyEquals,
    constants,
    expect,
    getRandomFloat,
    getRandomInteger,
    hexRandom,
    hexSlice,
    Numberish,
    randomAddress,
    shortZip,
} from '@0x/contracts-test-utils';
import { generatePseudoRandomSalt } from '@0x/order-utils';
import { OrderWithoutDomain, SignedOrderWithoutDomain } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import {
    BUY_SOURCES,
    createBridgeAssetData,
    createERC20AssetData,
    ERC20BridgeSource,
    ETH2DAI_BRIDGE_ADDRESS,
    getSampleAmounts,
    improveMarketBuyAsync,
    improveMarketSellAsync,
    KYBER_BRIDGE_ADDRESS,
    queryNetworkAsync,
    SELL_SOURCES,
    SOURCE_TO_ADDRESS,
    UNISWAP_BRIDGE_ADDRESS,
} from '../src/utils/aggregate';

import { MockSamplerContract, QueryAndSampleResult } from './utils/mock_sampler_contract';

// tslint:disable: custom-no-magic-numbers
describe('aggregation utils tests', () => {
    const MAKER_TOKEN = randomAddress();
    const TAKER_TOKEN = randomAddress();
    const MAKER_ASSET_DATA = createERC20AssetData(MAKER_TOKEN);
    const TAKER_ASSET_DATA = createERC20AssetData(TAKER_TOKEN);

    function createOrder(overrides?: Partial<SignedOrderWithoutDomain>): SignedOrderWithoutDomain {
        return {
            makerAddress: constants.NULL_ADDRESS,
            takerAddress: constants.NULL_ADDRESS,
            senderAddress: constants.NULL_ADDRESS,
            feeRecipientAddress: randomAddress(),
            salt: generatePseudoRandomSalt(),
            expirationTimeSeconds: getRandomInteger(0, 2 ** 64),
            makerAssetData: MAKER_ASSET_DATA,
            takerAssetData: TAKER_ASSET_DATA,
            makerFeeAssetData: createERC20AssetData(randomAddress()),
            takerFeeAssetData: createERC20AssetData(randomAddress()),
            makerAssetAmount: getRandomInteger(1, 1e18),
            takerAssetAmount: getRandomInteger(1, 1e18),
            makerFee: getRandomInteger(1, 1e17),
            takerFee: getRandomInteger(1, 1e17),
            signature: hexRandom(),
            ...overrides,
        };
    }

    function getSourceFromAssetData(assetData: string): ERC20BridgeSource {
        if (assetData.length === 74) {
            return ERC20BridgeSource.Native;
        }
        const bridgeAddress = hexSlice(assetData, 48, 68).toLowerCase();
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
                return parseInt(k, 10) as ERC20BridgeSource;
            }
        }
        throw new Error(`Unknown source address: ${sourceAddress}`);
    }

    function assertSamePrefix(actual: string, expected: string): void {
        expect(actual.substr(0, expected.length)).to.eq(expected);
    }

    function createOrdersFromSellRates(takerAssetAmount: BigNumber, rates: Numberish[]): SignedOrderWithoutDomain[] {
        const singleTakerAssetAmount = takerAssetAmount.div(rates.length).integerValue(BigNumber.ROUND_UP);
        return rates.map(r =>
            createOrder({
                makerAssetAmount: singleTakerAssetAmount.times(r),
                takerAssetAmount: singleTakerAssetAmount,
            }),
        );
    }

    function createOrdersFromBuyRates(makerAssetAmount: BigNumber, rates: Numberish[]): SignedOrderWithoutDomain[] {
        const singleMakerAssetAmount = makerAssetAmount.div(rates.length).integerValue(BigNumber.ROUND_UP);
        return (rates as any).map((r: Numberish) =>
            createOrder({
                makerAssetAmount: singleMakerAssetAmount,
                takerAssetAmount: singleMakerAssetAmount.div(r),
            }),
        );
    }

    function createSamplerFromSellRates(rates: Numberish[][]): MockSamplerContract {
        return new MockSamplerContract({
            queryOrdersAndSampleSells: (orders, signatures, sources, fillAmounts) => [
                orders.map(o => o.takerAssetAmount),
                sources.map(s =>
                    shortZip(fillAmounts, rates[getSourceFromAddress(s)]).map(([f, r]) =>
                        f.times(r).integerValue(BigNumber.ROUND_UP),
                    ),
                ),
            ],
        });
    }

    function createSamplerFromBuyRates(rates: Numberish[][]): MockSamplerContract {
        return new MockSamplerContract({
            queryOrdersAndSampleBuys: (orders, signatures, sources, fillAmounts) => [
                orders.map(o => o.makerAssetAmount),
                sources.map(s =>
                    shortZip(fillAmounts, rates[getSourceFromAddress(s)]).map(([f, r]) =>
                        f.div(r).integerValue(BigNumber.ROUND_UP),
                    ),
                ),
            ],
        });
    }

    describe('getSampleAmounts()', () => {
        const FILL_AMOUNT = getRandomInteger(1, 1e18);
        const NUM_SAMPLES = 16;

        it('generates the correct number of amounts', () => {
            const amounts = getSampleAmounts(FILL_AMOUNT, NUM_SAMPLES);
            expect(amounts).to.be.length(NUM_SAMPLES);
        });

        it('first amount is nonzero', () => {
            const amounts = getSampleAmounts(FILL_AMOUNT, NUM_SAMPLES);
            expect(amounts[0]).to.not.bignumber.eq(0);
        });

        it('last amount is the fill amount', () => {
            const amounts = getSampleAmounts(FILL_AMOUNT, NUM_SAMPLES);
            expect(amounts[NUM_SAMPLES - 1]).to.bignumber.eq(FILL_AMOUNT);
        });

        it('can generate a single amount', () => {
            const amounts = getSampleAmounts(FILL_AMOUNT, 1);
            expect(amounts).to.be.length(1);
            expect(amounts[0]).to.bignumber.eq(FILL_AMOUNT);
        });

        it('generates ascending amounts', () => {
            const amounts = getSampleAmounts(FILL_AMOUNT, NUM_SAMPLES);
            for (const i of _.times(NUM_SAMPLES).slice(1)) {
                const prev = amounts[i - 1];
                const amount = amounts[i];
                expect(prev).to.bignumber.lt(amount);
            }
        });
    });

    const DUMMY_QUERY_AND_SAMPLE_HANDLER = (
        orders: OrderWithoutDomain[],
        signatures: string[],
        sources: string[],
        fillAmounts: BigNumber[],
    ): QueryAndSampleResult => [
        orders.map(() => getRandomInteger(1, 1e18)),
        sources.map(() => fillAmounts.map(() => getRandomInteger(1, 1e18))),
    ];

    describe('queryNetworkAsync()', () => {
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
            await queryNetworkAsync(sampler, ORDERS, SAMPLE_AMOUNTS, SELL_SOURCES);
        });

        it('makes an eth_call with the correct arguments for a buy', async () => {
            const sampler = new MockSamplerContract({
                queryOrdersAndSampleBuys: (orders, signatures, sources, fillAmounts) => {
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
            await queryNetworkAsync(sampler, ORDERS, SAMPLE_AMOUNTS, SELL_SOURCES, true);
        });

        it('returns correct fillable amounts', async () => {
            const fillableAmounts = _.times(SAMPLE_AMOUNTS.length, () => getRandomInteger(1, 1e18));
            const sampler = new MockSamplerContract({
                queryOrdersAndSampleSells: (orders, signatures, sources, fillAmounts) => [
                    fillableAmounts,
                    sources.map(() => fillAmounts.map(() => getRandomInteger(1, 1e18))),
                ],
            });
            const [actualFillableAmounts] = await queryNetworkAsync(sampler, ORDERS, SAMPLE_AMOUNTS, SELL_SOURCES);
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
            const [, actualQuotes] = await queryNetworkAsync(sampler, ORDERS, SAMPLE_AMOUNTS, SELL_SOURCES);
            expect(actualQuotes).to.deep.eq(quotes);
        });
    });

    describe('improveMarketSellAsync()', () => {
        const FILL_AMOUNT = getRandomInteger(1, 1e18);
        const SOURCE_RATES = _.times(ERC20BridgeSource.NumSources, () => getRandomFloat(1e-3, 2));
        const ORDERS = createOrdersFromSellRates(FILL_AMOUNT, _.times(3, () => SOURCE_RATES[ERC20BridgeSource.Native]));
        const DEFAULT_SAMPLER = createSamplerFromSellRates(SOURCE_RATES.map(r => _.times(32, () => r)));
        const DEFAULT_OPTS = { numSamples: 3, runLimit: 0 };

        it('calls `queryOrdersAndSampleSells()`', async () => {
            let wasCalled = false;
            const sampler = new MockSamplerContract({
                queryOrdersAndSampleSells: (...args) => {
                    wasCalled = true;
                    return DUMMY_QUERY_AND_SAMPLE_HANDLER(...args);
                },
            });
            await improveMarketSellAsync(sampler, ORDERS, FILL_AMOUNT, DEFAULT_OPTS);
            expect(wasCalled).to.be.true();
        });

        it('queries `numSamples` samples', async () => {
            const numSamples = _.random(1, 16);
            let fillAmountsLength = 0;
            const sampler = new MockSamplerContract({
                queryOrdersAndSampleSells: (orders, signatures, sources, fillAmounts) => {
                    fillAmountsLength = fillAmounts.length;
                    return DUMMY_QUERY_AND_SAMPLE_HANDLER(orders, signatures, sources, fillAmounts);
                },
            });
            await improveMarketSellAsync(sampler, ORDERS, FILL_AMOUNT, { ...DEFAULT_OPTS, numSamples });
            expect(fillAmountsLength).eq(numSamples);
        });

        it('polls all DEXes if `excludedSources` is empty', async () => {
            let sourcesPolled: ERC20BridgeSource[] = [];
            const sampler = new MockSamplerContract({
                queryOrdersAndSampleSells: (orders, signatures, sources, fillAmounts) => {
                    sourcesPolled = sources.map(a => getSourceFromAddress(a));
                    return DUMMY_QUERY_AND_SAMPLE_HANDLER(orders, signatures, sources, fillAmounts);
                },
            });
            await improveMarketSellAsync(sampler, ORDERS, FILL_AMOUNT, { ...DEFAULT_OPTS, excludedSources: [] });
            expect(sourcesPolled).to.deep.eq(SELL_SOURCES);
        });

        it('does not poll DEXes in `excludedSources`', async () => {
            const excludedSources = _.sampleSize(SELL_SOURCES, _.random(1, SELL_SOURCES.length));
            let sourcesPolled: ERC20BridgeSource[] = [];
            const sampler = new MockSamplerContract({
                queryOrdersAndSampleSells: (orders, signatures, sources, fillAmounts) => {
                    sourcesPolled = sources.map(a => getSourceFromAddress(a));
                    return DUMMY_QUERY_AND_SAMPLE_HANDLER(orders, signatures, sources, fillAmounts);
                },
            });
            await improveMarketSellAsync(sampler, ORDERS, FILL_AMOUNT, { ...DEFAULT_OPTS, excludedSources });
            expect(sourcesPolled).to.deep.eq(_.without(SELL_SOURCES, ...excludedSources));
        });

        it('returns the most cost-effective single source if `runLimit == 0`', async () => {
            const bestRate = BigNumber.max(...SOURCE_RATES);
            const bestSource = _.findIndex(SOURCE_RATES, n => n.eq(bestRate)) as ERC20BridgeSource;
            expect(bestSource).to.exist('');
            const improvedOrders = await improveMarketSellAsync(DEFAULT_SAMPLER, ORDERS, FILL_AMOUNT, {
                ...DEFAULT_OPTS,
                runLimit: 0,
            });
            const uniqueAssetDatas = _.uniq(improvedOrders.map(o => o.makerAssetData));
            expect(uniqueAssetDatas).to.be.length(1);
            expect(getSourceFromAssetData(uniqueAssetDatas[0])).to.be.eq(bestSource);
        });

        it('generates bridge orders with correct asset data', async () => {
            const improvedOrders = await improveMarketSellAsync(
                DEFAULT_SAMPLER,
                // Pass in empty orders to prevent native orders from being used.
                ORDERS.map(o => ({ ...o, makerAssetAmount: constants.ZERO_AMOUNT })),
                FILL_AMOUNT,
                DEFAULT_OPTS,
            );
            expect(improvedOrders).to.not.be.length(0);
            for (const order of improvedOrders) {
                expect(getSourceFromAssetData(order.makerAssetData)).to.exist('');
                const makerAssetDataPrefix = hexSlice(
                    createBridgeAssetData(MAKER_TOKEN, constants.NULL_ADDRESS, constants.NULL_BYTES),
                    0,
                    36,
                );
                assertSamePrefix(order.makerAssetData, makerAssetDataPrefix);
                expect(order.takerAssetData).to.eq(TAKER_ASSET_DATA);
            }
        });

        it('generates bridge orders with correct taker amount', async () => {
            const improvedOrders = await improveMarketSellAsync(
                DEFAULT_SAMPLER,
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
            const improvedOrders = await improveMarketSellAsync(
                DEFAULT_SAMPLER,
                // Pass in empty orders to prevent native orders from being used.
                ORDERS.map(o => ({ ...o, makerAssetAmount: constants.ZERO_AMOUNT })),
                FILL_AMOUNT,
                { ...DEFAULT_OPTS, bridgeSlippage },
            );
            expect(improvedOrders).to.not.be.length(0);
            for (const order of improvedOrders) {
                const source = getSourceFromAssetData(order.makerAssetData);
                const expectedMakerAmount = FILL_AMOUNT.times(SOURCE_RATES[source]);
                const slippage = 1 - order.makerAssetAmount.div(expectedMakerAmount.plus(1)).toNumber();
                assertRoughlyEquals(slippage, bridgeSlippage, 8);
            }
        });

        it('Ignores native orders below `dustFractionThreshold`', async () => {
            const dustFractionThreshold = 0.01;
            const dustAmount = FILL_AMOUNT.times(dustFractionThreshold).integerValue(BigNumber.ROUND_DOWN);
            const maxRate = BigNumber.max(...ORDERS.map(o => o.makerAssetAmount.div(o.takerAssetAmount)));
            // Pass in an order with the globally best rate but with a dust input amount.
            const dustOrder = createOrder({
                makerAssetAmount: dustAmount.times(maxRate.plus(0.01)),
                takerAssetAmount: dustAmount,
            });
            const improvedOrders = await improveMarketSellAsync(
                DEFAULT_SAMPLER,
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
            const rates: number[][] = [];
            rates[ERC20BridgeSource.Native] = [0.4, 0.3, 0.2, 0.1];
            rates[ERC20BridgeSource.Uniswap] = [0.5, 0.05, 0.05, 0.05];
            rates[ERC20BridgeSource.Eth2Dai] = [0.6, 0.05, 0.05, 0.05];
            rates[ERC20BridgeSource.Kyber] = [0.7, 0.05, 0.05, 0.05];
            const improvedOrders = await improveMarketSellAsync(
                createSamplerFromSellRates(rates),
                createOrdersFromSellRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                FILL_AMOUNT,
                { ...DEFAULT_OPTS, numSamples: 4, runLimit: 512 },
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
            const rates: number[][] = [];
            rates[ERC20BridgeSource.Native] = [0.4, 0.3, 0.2, 0.1];
            rates[ERC20BridgeSource.Uniswap] = [0.5, 0.05, 0.05, 0.05];
            rates[ERC20BridgeSource.Eth2Dai] = [0.6, 0.05, 0.05, 0.05];
            rates[ERC20BridgeSource.Kyber] = [0.7, 0.05, 0.05, 0.05];
            const improvedOrders = await improveMarketSellAsync(
                createSamplerFromSellRates(rates),
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
            const rates: number[][] = [];
            rates[ERC20BridgeSource.Native] = [0.4, 0.3, 0.2, 0.1];
            rates[ERC20BridgeSource.Uniswap] = [0.15, 0.05, 0.05, 0.05];
            rates[ERC20BridgeSource.Eth2Dai] = [0.15, 0.05, 0.05, 0.05];
            rates[ERC20BridgeSource.Kyber] = [0.7, 0.05, 0.05, 0.05];
            const improvedOrders = await improveMarketSellAsync(
                createSamplerFromSellRates(rates),
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

    describe('improveMarketBuyAsync()', () => {
        const FILL_AMOUNT = getRandomInteger(1, 1e18);
        const SOURCE_RATES = _.times(ERC20BridgeSource.NumSources, () => getRandomFloat(1e-3, 2));
        const ORDERS = createOrdersFromBuyRates(FILL_AMOUNT, _.times(3, () => SOURCE_RATES[ERC20BridgeSource.Native]));
        const DEFAULT_SAMPLER = createSamplerFromBuyRates(SOURCE_RATES.map(r => _.times(32, () => r)));
        const DEFAULT_OPTS = { numSamples: 3, runLimit: 0 };

        it('calls `queryOrdersAndSampleBuys()`', async () => {
            let wasCalled = false;
            const sampler = new MockSamplerContract({
                queryOrdersAndSampleBuys: (...args) => {
                    wasCalled = true;
                    return DUMMY_QUERY_AND_SAMPLE_HANDLER(...args);
                },
            });
            await improveMarketBuyAsync(sampler, ORDERS, FILL_AMOUNT, DEFAULT_OPTS);
            expect(wasCalled).to.be.true();
        });

        it('queries `numSamples` samples', async () => {
            const numSamples = _.random(1, 16);
            let fillAmountsLength = 0;
            const sampler = new MockSamplerContract({
                queryOrdersAndSampleBuys: (orders, signatures, sources, fillAmounts) => {
                    fillAmountsLength = fillAmounts.length;
                    return DUMMY_QUERY_AND_SAMPLE_HANDLER(orders, signatures, sources, fillAmounts);
                },
            });
            await improveMarketBuyAsync(sampler, ORDERS, FILL_AMOUNT, { ...DEFAULT_OPTS, numSamples });
            expect(fillAmountsLength).eq(numSamples);
        });

        it('polls all DEXes if `excludedSources` is empty', async () => {
            let sourcesPolled: ERC20BridgeSource[] = [];
            const sampler = new MockSamplerContract({
                queryOrdersAndSampleBuys: (orders, signatures, sources, fillAmounts) => {
                    sourcesPolled = sources.map(a => getSourceFromAddress(a));
                    return DUMMY_QUERY_AND_SAMPLE_HANDLER(orders, signatures, sources, fillAmounts);
                },
            });
            await improveMarketBuyAsync(sampler, ORDERS, FILL_AMOUNT, { ...DEFAULT_OPTS, excludedSources: [] });
            expect(sourcesPolled).to.deep.eq(BUY_SOURCES);
        });

        it('does not poll DEXes in `excludedSources`', async () => {
            const excludedSources = _.sampleSize(BUY_SOURCES, _.random(1, BUY_SOURCES.length));
            let sourcesPolled: ERC20BridgeSource[] = [];
            const sampler = new MockSamplerContract({
                queryOrdersAndSampleBuys: (orders, signatures, sources, fillAmounts) => {
                    sourcesPolled = sources.map(a => getSourceFromAddress(a));
                    return DUMMY_QUERY_AND_SAMPLE_HANDLER(orders, signatures, sources, fillAmounts);
                },
            });
            await improveMarketBuyAsync(sampler, ORDERS, FILL_AMOUNT, { ...DEFAULT_OPTS, excludedSources });
            expect(sourcesPolled).to.deep.eq(_.without(BUY_SOURCES, ...excludedSources));
        });

        it('returns the most cost-effective single source if `runLimit == 0`', async () => {
            const validSources = [ERC20BridgeSource.Native, ...BUY_SOURCES];
            const bestRate = BigNumber.max(...SOURCE_RATES.filter((r, i) => validSources.includes(i)));
            const bestSource = _.findIndex(SOURCE_RATES, n => n.eq(bestRate)) as ERC20BridgeSource;
            expect(bestSource).to.exist('');
            const improvedOrders = await improveMarketBuyAsync(DEFAULT_SAMPLER, ORDERS, FILL_AMOUNT, {
                ...DEFAULT_OPTS,
                runLimit: 0,
            });
            const uniqueAssetDatas = _.uniq(improvedOrders.map(o => o.makerAssetData));
            expect(uniqueAssetDatas).to.be.length(1);
            expect(getSourceFromAssetData(uniqueAssetDatas[0])).to.be.eq(bestSource);
        });

        it('generates bridge orders with correct asset data', async () => {
            const improvedOrders = await improveMarketBuyAsync(
                DEFAULT_SAMPLER,
                // Pass in empty orders to prevent native orders from being used.
                ORDERS.map(o => ({ ...o, makerAssetAmount: constants.ZERO_AMOUNT })),
                FILL_AMOUNT,
                DEFAULT_OPTS,
            );
            expect(improvedOrders).to.not.be.length(0);
            for (const order of improvedOrders) {
                expect(getSourceFromAssetData(order.makerAssetData)).to.exist('');
                const makerAssetDataPrefix = hexSlice(
                    createBridgeAssetData(MAKER_TOKEN, constants.NULL_ADDRESS, constants.NULL_BYTES),
                    0,
                    36,
                );
                assertSamePrefix(order.makerAssetData, makerAssetDataPrefix);
                expect(order.takerAssetData).to.eq(TAKER_ASSET_DATA);
            }
        });

        it('generates bridge orders with correct taker amount', async () => {
            const improvedOrders = await improveMarketBuyAsync(
                DEFAULT_SAMPLER,
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
            const improvedOrders = await improveMarketBuyAsync(
                DEFAULT_SAMPLER,
                // Pass in empty orders to prevent native orders from being used.
                ORDERS.map(o => ({ ...o, makerAssetAmount: constants.ZERO_AMOUNT })),
                FILL_AMOUNT,
                { ...DEFAULT_OPTS, bridgeSlippage },
            );
            expect(improvedOrders).to.not.be.length(0);
            for (const order of improvedOrders) {
                const source = getSourceFromAssetData(order.makerAssetData);
                const expectedTakerAmount = FILL_AMOUNT.div(SOURCE_RATES[source]).integerValue(BigNumber.ROUND_UP);
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
            const improvedOrders = await improveMarketBuyAsync(
                DEFAULT_SAMPLER,
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
            const rates: number[][] = [];
            rates[ERC20BridgeSource.Native] = [0.4, 0.3, 0.2, 0.1];
            rates[ERC20BridgeSource.Uniswap] = [0.5, 0.05, 0.05, 0.05];
            rates[ERC20BridgeSource.Eth2Dai] = [0.6, 0.05, 0.05, 0.05];
            const improvedOrders = await improveMarketBuyAsync(
                createSamplerFromBuyRates(rates),
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
// tslint:disable-next-line: max-file-line-count
