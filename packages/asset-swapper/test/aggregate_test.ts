import {
    assertRoughlyEquals,
    constants,
    expect,
    getRandomFloat,
    getRandomInteger,
    hexRandom,
    hexSlice,
    randomAddress,
    shortZip,
} from '@0x/contracts-test-utils';
import { generatePseudoRandomSalt } from '@0x/order-utils';
import { OrderInfo, OrderStatus, OrderWithoutDomain } from '@0x/types';
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

import { SamplerCallParams, SamplerCallResult, SamplerFunction, SamplerProvider } from './utils/sampler_provider';

// tslint:disable: custom-no-magic-numbers
describe('aggregation utils tests', () => {
    const MAKER_TOKEN = randomAddress();
    const TAKER_TOKEN = randomAddress();
    const MAKER_ASSET_DATA = createERC20AssetData(MAKER_TOKEN);
    const TAKER_ASSET_DATA = createERC20AssetData(TAKER_TOKEN);

    function createOrder(overrides?: Partial<OrderWithoutDomain>): OrderWithoutDomain {
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
            ...overrides,
        };
    }

    function createOrderInfo(overrides?: Partial<OrderInfo>): OrderInfo {
        return {
            orderHash: hexRandom(),
            orderStatus: OrderStatus.Fillable,
            orderTakerAssetFilledAmount: getRandomInteger(1, 1e18),
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

    function createOrdersFromSellRates(takerAssetAmount: BigNumber, rates: BigNumber[]): OrderWithoutDomain[] {
        const singleTakerAssetAmount = takerAssetAmount.div(rates.length).integerValue(BigNumber.ROUND_UP);
        return rates.map(r =>
            createOrder({
                makerAssetAmount: singleTakerAssetAmount.times(r),
                takerAssetAmount: singleTakerAssetAmount,
            }),
        );
    }

    function createOrdersFromBuyRates(makerAssetAmount: BigNumber, rates: BigNumber[]): OrderWithoutDomain[] {
        const singleMakerAssetAmount = makerAssetAmount.div(rates.length).integerValue(BigNumber.ROUND_UP);
        return rates.map(r =>
            createOrder({
                makerAssetAmount: singleMakerAssetAmount,
                takerAssetAmount: singleMakerAssetAmount.div(r),
            }),
        );
    }

    describe('queryNetworkAsync()', () => {
        const SAMPLE_AMOUNTS = [100, 500, 1000].map(v => new BigNumber(v));
        const ORDERS = _.times(4, () => createOrder());
        const DEFAULT_PROVIDER_HANDLER = (params: SamplerCallParams): SamplerCallResult => {
            return {
                orderInfos: params.orders.map(() => createOrderInfo()),
                samples: params.sources.map(() => params.fillAmounts.map(() => getRandomInteger(1, 1e18))),
            };
        };

        it('makes an eth_call with the correct arguments for a sell', async () => {
            const provider = new SamplerProvider(params => {
                expect(params.fn).to.deep.eq(SamplerFunction.QueryOrdersAndSampleSells);
                expect(params.orders).to.deep.eq(ORDERS);
                expect(params.sources).to.deep.eq(SELL_SOURCES.map(s => SOURCE_TO_ADDRESS[s].toLowerCase()));
                expect(params.fillAmounts).to.deep.eq(SAMPLE_AMOUNTS);
                return DEFAULT_PROVIDER_HANDLER(params);
            });
            await queryNetworkAsync(ORDERS, SAMPLE_AMOUNTS, SELL_SOURCES, provider, false);
        });

        it('makes an eth_call with the correct arguments for a buy', async () => {
            const provider = new SamplerProvider(params => {
                expect(params.fn).to.deep.eq(SamplerFunction.QueryOrdersAndSampleBuys);
                expect(params.orders).to.deep.eq(ORDERS);
                expect(params.sources).to.deep.eq(BUY_SOURCES.map(s => SOURCE_TO_ADDRESS[s].toLowerCase()));
                expect(params.fillAmounts).to.deep.eq(SAMPLE_AMOUNTS);
                return DEFAULT_PROVIDER_HANDLER(params);
            });
            await queryNetworkAsync(ORDERS, SAMPLE_AMOUNTS, BUY_SOURCES, provider, true);
        });

        it('returns correct order infos', async () => {
            const orderInfos = _.times(SAMPLE_AMOUNTS.length, () => createOrderInfo());
            const provider = new SamplerProvider(params => {
                return {
                    ...DEFAULT_PROVIDER_HANDLER(params),
                    orderInfos,
                };
            });
            const [actualOrderInfos] = await queryNetworkAsync(ORDERS, SAMPLE_AMOUNTS, SELL_SOURCES, provider);
            expect(actualOrderInfos).to.deep.eq(orderInfos);
        });

        it('converts samples to DEX quotes', async () => {
            const quotes = SELL_SOURCES.map(source =>
                SAMPLE_AMOUNTS.map(s => ({
                    source,
                    input: s,
                    output: getRandomInteger(1, 1e18),
                })),
            );
            const provider = new SamplerProvider(params => {
                return {
                    ...DEFAULT_PROVIDER_HANDLER(params),
                    samples: quotes.map(q => q.map(s => s.output)),
                };
            });
            const [, actualQuotes] = await queryNetworkAsync(ORDERS, SAMPLE_AMOUNTS, SELL_SOURCES, provider);
            expect(actualQuotes).to.deep.eq(quotes);
        });
    });

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

    describe('improveMarketSellAsync()', () => {
        let lastContractCallParams: SamplerCallParams | undefined;
        const NUM_ORDERS = 3;
        const FILL_AMOUNT = getRandomInteger(1, 1e18);
        const SOURCE_RATES = _.times(ERC20BridgeSource.NumSources, () => getRandomFloat(1e-3, 2));
        const ORDERS = _.times(NUM_ORDERS, () =>
            createOrder({
                makerAssetAmount: FILL_AMOUNT.div(NUM_ORDERS)
                    .times(SOURCE_RATES[ERC20BridgeSource.Native])
                    .integerValue(BigNumber.ROUND_UP),
                takerAssetAmount: FILL_AMOUNT.div(NUM_ORDERS).integerValue(BigNumber.ROUND_UP),
            }),
        );
        const DEFAULT_OPTS = {
            provider: new SamplerProvider(params => {
                lastContractCallParams = params;
                return {
                    orderInfos: params.orders.map(() =>
                        createOrderInfo({
                            orderStatus: OrderStatus.Fillable,
                            orderTakerAssetFilledAmount: constants.ZERO_AMOUNT,
                        }),
                    ),
                    samples: params.sources.map(srcAddr =>
                        params.fillAmounts.map(n =>
                            n.times(SOURCE_RATES[getSourceFromAddress(srcAddr)]).integerValue(BigNumber.ROUND_UP),
                        ),
                    ),
                };
            }),
            numSamples: 3,
            runLimit: 0,
        };

        beforeEach(async () => {
            lastContractCallParams = undefined;
        });

        it('calls `queryOrdersAndSampleSells()`', async () => {
            await improveMarketSellAsync(ORDERS, FILL_AMOUNT, DEFAULT_OPTS);
            expect(_.get(lastContractCallParams, ['fn'])).to.eq(SamplerFunction.QueryOrdersAndSampleSells);
        });

        it('queries `numSamples` samples', async () => {
            const numSamples = _.random(1, 16);
            await improveMarketSellAsync(ORDERS, FILL_AMOUNT, { ...DEFAULT_OPTS, numSamples });
            expect(_.get(lastContractCallParams, ['fillAmounts'])).to.deep.eq(
                getSampleAmounts(FILL_AMOUNT, numSamples),
            );
        });

        it('polls all DEXes if `excludedSources` is empty', async () => {
            await improveMarketSellAsync(ORDERS, FILL_AMOUNT, { ...DEFAULT_OPTS, excludedSources: [] });
            expect(_.get(lastContractCallParams, ['sources'])).to.deep.eq(
                SELL_SOURCES.map(s => SOURCE_TO_ADDRESS[s].toLowerCase()),
            );
        });

        it('does not poll DEXes in `excludedSources`', async () => {
            const excludedSources = _.sampleSize(SELL_SOURCES, _.random(1, SELL_SOURCES.length));
            await improveMarketSellAsync(ORDERS, FILL_AMOUNT, { ...DEFAULT_OPTS, excludedSources });
            expect(_.get(lastContractCallParams, ['sources'])).to.deep.eq(
                SELL_SOURCES.filter(s => !_.includes(excludedSources, s)).map(s => SOURCE_TO_ADDRESS[s].toLowerCase()),
            );
        });

        it('returns the most cost-effective single source if `runLimit == 0`', async () => {
            const bestRate = BigNumber.max(...SOURCE_RATES);
            const bestSource = _.findIndex(SOURCE_RATES, n => n.eq(bestRate)) as ERC20BridgeSource;
            expect(bestSource).to.exist('');
            const improvedOrders = await improveMarketSellAsync(ORDERS, FILL_AMOUNT, { ...DEFAULT_OPTS, runLimit: 0 });
            const uniqueAssetDatas = _.uniq(improvedOrders.map(o => o.makerAssetData));
            expect(uniqueAssetDatas).to.be.length(1);
            expect(getSourceFromAssetData(uniqueAssetDatas[0])).to.be.eq(bestSource);
        });

        it('generates bridge orders with correct asset data', async () => {
            const bridgeSlippage = _.random(0.1, true);
            const improvedOrders = await improveMarketSellAsync(
                // Pass in empty orders to prevent native orders from being used.
                ORDERS.map(o => ({ ...o, makerAssetAmount: constants.ZERO_AMOUNT })),
                FILL_AMOUNT,
                { ...DEFAULT_OPTS, bridgeSlippage },
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
            const bridgeSlippage = _.random(0.1, true);
            const improvedOrders = await improveMarketSellAsync(
                // Pass in empty orders to prevent native orders from being used.
                ORDERS.map(o => ({ ...o, makerAssetAmount: constants.ZERO_AMOUNT })),
                FILL_AMOUNT,
                { ...DEFAULT_OPTS, bridgeSlippage },
            );
            const totalTakerAssetAmount = BigNumber.sum(...improvedOrders.map(o => o.takerAssetAmount));
            expect(totalTakerAssetAmount).to.bignumber.gte(FILL_AMOUNT);
        });

        it('generates bridge orders with max slippage of `bridgeSlippage`', async () => {
            const bridgeSlippage = _.random(0.1, true);
            const improvedOrders = await improveMarketSellAsync(
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

        it('Ignores native orders below `dustThreshold`', async () => {
            const dustThreshold = 0.01;
            const dustAmount = FILL_AMOUNT.times(dustThreshold).integerValue(BigNumber.ROUND_DOWN);
            const maxRate = BigNumber.max(...ORDERS.map(o => o.makerAssetAmount.div(o.takerAssetAmount)));
            // Pass in an order with the globally best rate but with a dust input amount.
            const dustOrder = createOrder({
                makerAssetAmount: dustAmount.times(maxRate.plus(0.01)),
                takerAssetAmount: dustAmount,
            });
            const improvedOrders = await improveMarketSellAsync(
                _.shuffle([dustOrder, ...ORDERS]),
                FILL_AMOUNT,
                // Ignore all DEX sources so only native orders are returned.
                { ...DEFAULT_OPTS, dustThreshold, excludedSources: SELL_SOURCES },
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
            const provider = new SamplerProvider(params => ({
                ...DEFAULT_OPTS.provider.handler(params),
                samples: params.sources.map(s =>
                    shortZip(params.fillAmounts, rates[getSourceFromAddress(s)]).map(([f, r]) =>
                        f.times(r).integerValue(BigNumber.ROUND_UP),
                    ),
                ),
            }));
            const improvedOrders = await improveMarketSellAsync(
                createOrdersFromSellRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native].map(r => new BigNumber(r))),
                FILL_AMOUNT,
                { ...DEFAULT_OPTS, provider, numSamples: 4, runLimit: 512 },
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
            const provider = new SamplerProvider(params => ({
                ...DEFAULT_OPTS.provider.handler(params),
                samples: params.sources.map(s =>
                    shortZip(params.fillAmounts, rates[getSourceFromAddress(s)]).map(([f, r]) =>
                        f.times(r).integerValue(BigNumber.ROUND_UP),
                    ),
                ),
            }));
            const improvedOrders = await improveMarketSellAsync(
                createOrdersFromSellRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native].map(r => new BigNumber(r))),
                FILL_AMOUNT,
                { ...DEFAULT_OPTS, provider, numSamples: 4, runLimit: 512, noConflicts: true },
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
            const provider = new SamplerProvider(params => ({
                ...DEFAULT_OPTS.provider.handler(params),
                samples: params.sources.map(s =>
                    shortZip(params.fillAmounts, rates[getSourceFromAddress(s)]).map(([f, r]) =>
                        f.times(r).integerValue(BigNumber.ROUND_UP),
                    ),
                ),
            }));
            const improvedOrders = await improveMarketSellAsync(
                createOrdersFromSellRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native].map(r => new BigNumber(r))),
                FILL_AMOUNT,
                { ...DEFAULT_OPTS, provider, numSamples: 4, runLimit: 512, noConflicts: true },
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
        let lastContractCallParams: SamplerCallParams | undefined;
        const NUM_ORDERS = 3;
        const FILL_AMOUNT = getRandomInteger(1, 1e18);
        const SOURCE_RATES = _.times(ERC20BridgeSource.NumSources, () => getRandomFloat(1e-3, 2));
        const ORDERS = _.times(NUM_ORDERS, () =>
            createOrder({
                makerAssetAmount: FILL_AMOUNT.div(NUM_ORDERS).integerValue(BigNumber.ROUND_UP),
                takerAssetAmount: FILL_AMOUNT.div(NUM_ORDERS)
                    .div(SOURCE_RATES[ERC20BridgeSource.Native])
                    .integerValue(BigNumber.ROUND_UP),
            }),
        );
        const DEFAULT_OPTS = {
            provider: new SamplerProvider(params => {
                lastContractCallParams = params;
                return {
                    orderInfos: params.orders.map(() =>
                        createOrderInfo({
                            orderStatus: OrderStatus.Fillable,
                            orderTakerAssetFilledAmount: constants.ZERO_AMOUNT,
                        }),
                    ),
                    samples: params.sources.map(srcAddr =>
                        params.fillAmounts.map(n =>
                            n.div(SOURCE_RATES[getSourceFromAddress(srcAddr)]).integerValue(BigNumber.ROUND_UP),
                        ),
                    ),
                };
            }),
            numSamples: 3,
            runLimit: 0,
        };

        beforeEach(async () => {
            lastContractCallParams = undefined;
        });

        it('calls `queryOrdersAndSampleBuys()`', async () => {
            await improveMarketBuyAsync(ORDERS, FILL_AMOUNT, DEFAULT_OPTS);
            expect(_.get(lastContractCallParams, ['fn'])).to.eq(SamplerFunction.QueryOrdersAndSampleBuys);
        });

        it('queries `numSamples` samples', async () => {
            const numSamples = _.random(1, 16);
            await improveMarketBuyAsync(ORDERS, FILL_AMOUNT, { ...DEFAULT_OPTS, numSamples });
            expect(_.get(lastContractCallParams, ['fillAmounts'])).to.deep.eq(
                getSampleAmounts(FILL_AMOUNT, numSamples),
            );
        });

        it('polls all DEXes if `excludedSources` is empty', async () => {
            await improveMarketBuyAsync(ORDERS, FILL_AMOUNT, { ...DEFAULT_OPTS, excludedSources: [] });
            expect(_.get(lastContractCallParams, ['sources'])).to.deep.eq(
                BUY_SOURCES.map(s => SOURCE_TO_ADDRESS[s].toLowerCase()),
            );
        });

        it('does not poll DEXes in `excludedSources`', async () => {
            const excludedSources = _.sampleSize(BUY_SOURCES, _.random(1, BUY_SOURCES.length));
            await improveMarketBuyAsync(ORDERS, FILL_AMOUNT, { ...DEFAULT_OPTS, excludedSources });
            expect(_.get(lastContractCallParams, ['sources'])).to.deep.eq(
                BUY_SOURCES.filter(s => !_.includes(excludedSources, s)).map(s => SOURCE_TO_ADDRESS[s].toLowerCase()),
            );
        });

        it('returns the most cost-effective single source if `runLimit == 0`', async () => {
            const validSources = [ERC20BridgeSource.Native, ...BUY_SOURCES];
            const bestRate = BigNumber.max(...SOURCE_RATES.filter((r, i) => validSources.includes(i)));
            const bestSource = _.findIndex(SOURCE_RATES, n => n.eq(bestRate)) as ERC20BridgeSource;
            expect(bestSource).to.exist('');
            const improvedOrders = await improveMarketBuyAsync(ORDERS, FILL_AMOUNT, { ...DEFAULT_OPTS, runLimit: 0 });
            const uniqueAssetDatas = _.uniq(improvedOrders.map(o => o.makerAssetData));
            expect(uniqueAssetDatas).to.be.length(1);
            expect(getSourceFromAssetData(uniqueAssetDatas[0])).to.be.eq(bestSource);
        });

        it('generates bridge orders with correct asset data', async () => {
            const bridgeSlippage = _.random(0.1, true);
            const improvedOrders = await improveMarketBuyAsync(
                // Pass in empty orders to prevent native orders from being used.
                ORDERS.map(o => ({ ...o, makerAssetAmount: constants.ZERO_AMOUNT })),
                FILL_AMOUNT,
                { ...DEFAULT_OPTS, bridgeSlippage },
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

        it('generates bridge orders with correct maker amount', async () => {
            const bridgeSlippage = _.random(0.1, true);
            const improvedOrders = await improveMarketBuyAsync(
                // Pass in empty orders to prevent native orders from being used.
                ORDERS.map(o => ({ ...o, makerAssetAmount: constants.ZERO_AMOUNT })),
                FILL_AMOUNT,
                { ...DEFAULT_OPTS, bridgeSlippage },
            );
            const totalMakerAssetAmount = BigNumber.sum(...improvedOrders.map(o => o.makerAssetAmount));
            expect(totalMakerAssetAmount).to.bignumber.gte(FILL_AMOUNT);
        });

        it('generates bridge orders with max slippage of `bridgeSlippage`', async () => {
            const bridgeSlippage = _.random(0.1, true);
            const improvedOrders = await improveMarketBuyAsync(
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

        it('Ignores native orders below `dustThreshold`', async () => {
            const dustThreshold = 0.01;
            const dustAmount = FILL_AMOUNT.times(dustThreshold).integerValue(BigNumber.ROUND_DOWN);
            const maxRate = BigNumber.max(...ORDERS.map(o => o.makerAssetAmount.div(o.takerAssetAmount)));
            // Pass in an order with the globally best rate but with a dust input amount.
            const dustOrder = createOrder({
                makerAssetAmount: dustAmount,
                takerAssetAmount: dustAmount.div(maxRate.plus(0.01)).integerValue(BigNumber.ROUND_DOWN),
            });
            const improvedOrders = await improveMarketBuyAsync(
                _.shuffle([dustOrder, ...ORDERS]),
                FILL_AMOUNT,
                // Ignore all DEX sources so only native orders are returned.
                { ...DEFAULT_OPTS, dustThreshold, excludedSources: BUY_SOURCES },
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
            const provider = new SamplerProvider(params => ({
                ...DEFAULT_OPTS.provider.handler(params),
                samples: params.sources.map(s =>
                    shortZip(params.fillAmounts, rates[getSourceFromAddress(s)]).map(([f, r]) =>
                        f.div(r).integerValue(BigNumber.ROUND_UP),
                    ),
                ),
            }));
            const improvedOrders = await improveMarketBuyAsync(
                createOrdersFromBuyRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native].map(r => new BigNumber(r))),
                FILL_AMOUNT,
                { ...DEFAULT_OPTS, provider, numSamples: 4, runLimit: 512 },
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
