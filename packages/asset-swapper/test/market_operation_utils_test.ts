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
import { SignedOrder } from '@0x/types';
import { BigNumber, hexUtils } from '@0x/utils';
import * as _ from 'lodash';

import { MarketOperationUtils } from '../src/utils/market_operation_utils/';
import { constants as marketOperationUtilConstants } from '../src/utils/market_operation_utils/constants';
import { DexOrderSampler } from '../src/utils/market_operation_utils/sampler';
import { DexSample, ERC20BridgeSource } from '../src/utils/market_operation_utils/types';

const { BUY_SOURCES, SELL_SOURCES } = marketOperationUtilConstants;

// tslint:disable: custom-no-magic-numbers
describe('MarketOperationUtils tests', () => {
    const CHAIN_ID = 1;
    const contractAddresses = getContractAddressesForChainOrThrow(CHAIN_ID);
    const ETH2DAI_BRIDGE_ADDRESS = contractAddresses.eth2DaiBridge;
    const KYBER_BRIDGE_ADDRESS = contractAddresses.kyberBridge;
    const UNISWAP_BRIDGE_ADDRESS = contractAddresses.uniswapBridge;

    const MAKER_TOKEN = randomAddress();
    const TAKER_TOKEN = randomAddress();
    const MAKER_ASSET_DATA = assetDataUtils.encodeERC20AssetData(MAKER_TOKEN);
    const TAKER_ASSET_DATA = assetDataUtils.encodeERC20AssetData(TAKER_TOKEN);
    let originalSamplerOperations: any;

    before(() => {
        originalSamplerOperations = DexOrderSampler.ops;
    });

    after(() => {
        DexOrderSampler.ops = originalSamplerOperations;
    });

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
            makerFeeAssetData: constants.NULL_BYTES,
            takerFeeAssetData: constants.NULL_BYTES,
            makerAssetAmount: getRandomInteger(1, 1e18),
            takerAssetAmount: getRandomInteger(1, 1e18),
            makerFee: constants.ZERO_AMOUNT,
            takerFee: constants.ZERO_AMOUNT,
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

    function assertSamePrefix(actual: string, expected: string): void {
        expect(actual.substr(0, expected.length)).to.eq(expected);
    }

    function createOrdersFromSellRates(takerAssetAmount: BigNumber, rates: Numberish[]): SignedOrder[] {
        const singleTakerAssetAmount = takerAssetAmount.div(rates.length).integerValue(BigNumber.ROUND_UP);
        return rates.map(r =>
            createOrder({
                makerAssetAmount: singleTakerAssetAmount.times(r).integerValue(),
                takerAssetAmount: singleTakerAssetAmount,
            }),
        );
    }

    function createOrdersFromBuyRates(makerAssetAmount: BigNumber, rates: Numberish[]): SignedOrder[] {
        const singleMakerAssetAmount = makerAssetAmount.div(rates.length).integerValue(BigNumber.ROUND_UP);
        return rates.map(r =>
            createOrder({
                makerAssetAmount: singleMakerAssetAmount,
                takerAssetAmount: singleMakerAssetAmount.div(r).integerValue(),
            }),
        );
    }

    const ORDER_DOMAIN = {
        exchangeAddress: contractAddresses.exchange,
        chainId: CHAIN_ID,
    };

    type GetQuotesOperation = (makerToken: string, takerToken: string, fillAmounts: BigNumber[]) => BigNumber[];

    function createGetQuotesOperationFromSellRates(rates: Numberish[]): GetQuotesOperation {
        return (makerToken: string, takerToken: string, fillAmounts: BigNumber[]) => {
            return fillAmounts.map((a, i) => a.times(rates[i]).integerValue());
        };
    }

    function createGetQuotesOperationFromBuyRates(rates: Numberish[]): GetQuotesOperation {
        return (makerToken: string, takerToken: string, fillAmounts: BigNumber[]) => {
            return fillAmounts.map((a, i) => a.div(rates[i]).integerValue());
        };
    }

    type GetMultipleQuotesOperation = (
        sources: ERC20BridgeSource[],
        makerToken: string,
        takerToken: string,
        fillAmounts: BigNumber[],
    ) => DexSample[][];

    function createGetMultipleQuotesOperationFromSellRates(rates: RatesBySource): GetMultipleQuotesOperation {
        return (sources: ERC20BridgeSource[], makerToken: string, takerToken: string, fillAmounts: BigNumber[]) => {
            return sources.map(s =>
                fillAmounts.map((a, i) => ({
                    source: s,
                    input: a,
                    output: a.times(rates[s][i]).integerValue(),
                })),
            );
        };
    }

    function createGetMultipleQuotesOperationFromBuyRates(rates: RatesBySource): GetMultipleQuotesOperation {
        return (sources: ERC20BridgeSource[], makerToken: string, takerToken: string, fillAmounts: BigNumber[]) => {
            return sources.map(s =>
                fillAmounts.map((a, i) => ({
                    source: s,
                    input: a,
                    output: a.div(rates[s][i]).integerValue(),
                })),
            );
        };
    }

    function createDecreasingRates(count: number): BigNumber[] {
        const rates: BigNumber[] = [];
        const initialRate = getRandomFloat(1e-3, 1e2);
        _.times(count, () => getRandomFloat(0.95, 1)).forEach((r, i) => {
            const prevRate = i === 0 ? initialRate : rates[i - 1];
            rates.push(prevRate.times(r));
        });
        return rates;
    }

    const NUM_SAMPLES = 3;

    interface RatesBySource {
        [source: string]: Numberish[];
    }

    const DEFAULT_RATES: RatesBySource = {
        [ERC20BridgeSource.Native]: createDecreasingRates(NUM_SAMPLES),
        [ERC20BridgeSource.Eth2Dai]: createDecreasingRates(NUM_SAMPLES),
        [ERC20BridgeSource.Kyber]: createDecreasingRates(NUM_SAMPLES),
        [ERC20BridgeSource.Uniswap]: createDecreasingRates(NUM_SAMPLES),
    };

    function findSourceWithMaxOutput(rates: RatesBySource): ERC20BridgeSource {
        const minSourceRates = Object.keys(rates).map(s => _.last(rates[s]) as BigNumber);
        const bestSourceRate = BigNumber.max(...minSourceRates);
        let source = Object.keys(rates)[_.findIndex(minSourceRates, t => bestSourceRate.eq(t))] as ERC20BridgeSource;
        // Native order rates play by different rules.
        if (source !== ERC20BridgeSource.Native) {
            const nativeTotalRate = BigNumber.sum(...rates[ERC20BridgeSource.Native]).div(
                rates[ERC20BridgeSource.Native].length,
            );
            if (nativeTotalRate.gt(bestSourceRate)) {
                source = ERC20BridgeSource.Native;
            }
        }
        return source;
    }

    const DEFAULT_OPS = {
        getOrderFillableTakerAmounts(orders: SignedOrder[]): BigNumber[] {
            return orders.map(o => o.takerAssetAmount);
        },
        getOrderFillableMakerAmounts(orders: SignedOrder[]): BigNumber[] {
            return orders.map(o => o.makerAssetAmount);
        },
        getKyberSellQuotes: createGetQuotesOperationFromSellRates(DEFAULT_RATES[ERC20BridgeSource.Kyber]),
        getUniswapSellQuotes: createGetQuotesOperationFromSellRates(DEFAULT_RATES[ERC20BridgeSource.Uniswap]),
        getEth2DaiSellQuotes: createGetQuotesOperationFromSellRates(DEFAULT_RATES[ERC20BridgeSource.Eth2Dai]),
        getUniswapBuyQuotes: createGetQuotesOperationFromBuyRates(DEFAULT_RATES[ERC20BridgeSource.Uniswap]),
        getEth2DaiBuyQuotes: createGetQuotesOperationFromBuyRates(DEFAULT_RATES[ERC20BridgeSource.Eth2Dai]),
        getSellQuotes: createGetMultipleQuotesOperationFromSellRates(DEFAULT_RATES),
        getBuyQuotes: createGetMultipleQuotesOperationFromBuyRates(DEFAULT_RATES),
    };

    function replaceSamplerOps(ops: Partial<typeof DEFAULT_OPS> = {}): void {
        DexOrderSampler.ops = {
            ...DEFAULT_OPS,
            ...ops,
        } as any;
    }

    const MOCK_SAMPLER = ({
        async executeAsync(...ops: any[]): Promise<any[]> {
            return ops;
        },
        async executeBatchAsync(ops: any[]): Promise<any[]> {
            return ops;
        },
    } as any) as DexOrderSampler;

    describe('MarketOperationUtils', () => {
        let marketOperationUtils: MarketOperationUtils;

        before(async () => {
            marketOperationUtils = new MarketOperationUtils(MOCK_SAMPLER, contractAddresses, ORDER_DOMAIN);
        });

        describe('getMarketSellOrdersAsync()', () => {
            const FILL_AMOUNT = getRandomInteger(1, 1e18);
            const ORDERS = createOrdersFromSellRates(
                FILL_AMOUNT,
                _.times(NUM_SAMPLES, i => DEFAULT_RATES[ERC20BridgeSource.Native][i]),
            );
            const DEFAULT_OPTS = { numSamples: NUM_SAMPLES, runLimit: 0, sampleDistributionBase: 1 };

            beforeEach(() => {
                replaceSamplerOps();
            });

            it('queries `numSamples` samples', async () => {
                const numSamples = _.random(1, 16);
                let actualNumSamples = 0;
                replaceSamplerOps({
                    getSellQuotes: (sources, makerToken, takerToken, amounts) => {
                        actualNumSamples = amounts.length;
                        return DEFAULT_OPS.getSellQuotes(sources, makerToken, takerToken, amounts);
                    },
                });
                await marketOperationUtils.getMarketSellOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    numSamples,
                });
                expect(actualNumSamples).eq(numSamples);
            });

            it('polls all DEXes if `excludedSources` is empty', async () => {
                let sourcesPolled: ERC20BridgeSource[] = [];
                replaceSamplerOps({
                    getSellQuotes: (sources, makerToken, takerToken, amounts) => {
                        sourcesPolled = sources.slice();
                        return DEFAULT_OPS.getSellQuotes(sources, makerToken, takerToken, amounts);
                    },
                });
                await marketOperationUtils.getMarketSellOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    excludedSources: [],
                });
                expect(sourcesPolled.sort()).to.deep.eq(SELL_SOURCES.slice().sort());
            });

            it('does not poll DEXes in `excludedSources`', async () => {
                const excludedSources = _.sampleSize(SELL_SOURCES, _.random(1, SELL_SOURCES.length));
                let sourcesPolled: ERC20BridgeSource[] = [];
                replaceSamplerOps({
                    getSellQuotes: (sources, makerToken, takerToken, amounts) => {
                        sourcesPolled = sources.slice();
                        return DEFAULT_OPS.getSellQuotes(sources, makerToken, takerToken, amounts);
                    },
                });
                await marketOperationUtils.getMarketSellOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    excludedSources,
                });
                expect(sourcesPolled.sort()).to.deep.eq(_.without(SELL_SOURCES, ...excludedSources).sort());
            });

            it('returns the most cost-effective single source if `runLimit == 0`', async () => {
                const bestSource = findSourceWithMaxOutput(DEFAULT_RATES);
                expect(bestSource).to.exist('');
                const improvedOrders = await marketOperationUtils.getMarketSellOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    runLimit: 0,
                });
                const uniqueAssetDatas = _.uniq(improvedOrders.map(o => o.makerAssetData));
                expect(uniqueAssetDatas).to.be.length(1);
                expect(getSourceFromAssetData(uniqueAssetDatas[0])).to.be.eq(bestSource);
            });

            it('generates bridge orders with correct asset data', async () => {
                const improvedOrders = await marketOperationUtils.getMarketSellOrdersAsync(
                    // Pass in empty orders to prevent native orders from being used.
                    ORDERS.map(o => ({ ...o, makerAssetAmount: constants.ZERO_AMOUNT })),
                    FILL_AMOUNT,
                    DEFAULT_OPTS,
                );
                expect(improvedOrders).to.not.be.length(0);
                for (const order of improvedOrders) {
                    expect(getSourceFromAssetData(order.makerAssetData)).to.exist('');
                    const makerAssetDataPrefix = hexUtils.slice(
                        assetDataUtils.encodeERC20BridgeAssetData(
                            MAKER_TOKEN,
                            constants.NULL_ADDRESS,
                            constants.NULL_BYTES,
                        ),
                        0,
                        36,
                    );
                    assertSamePrefix(order.makerAssetData, makerAssetDataPrefix);
                    expect(order.takerAssetData).to.eq(TAKER_ASSET_DATA);
                }
            });

            it('generates bridge orders with correct taker amount', async () => {
                const improvedOrders = await marketOperationUtils.getMarketSellOrdersAsync(
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
                const improvedOrders = await marketOperationUtils.getMarketSellOrdersAsync(
                    // Pass in empty orders to prevent native orders from being used.
                    ORDERS.map(o => ({ ...o, makerAssetAmount: constants.ZERO_AMOUNT })),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, bridgeSlippage },
                );
                expect(improvedOrders).to.not.be.length(0);
                for (const order of improvedOrders) {
                    const source = getSourceFromAssetData(order.makerAssetData);
                    const expectedMakerAmount = FILL_AMOUNT.times(_.last(DEFAULT_RATES[source]) as BigNumber);
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
                const improvedOrders = await marketOperationUtils.getMarketSellOrdersAsync(
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
                replaceSamplerOps({
                    getSellQuotes: createGetMultipleQuotesOperationFromSellRates(rates),
                });
                const improvedOrders = await marketOperationUtils.getMarketSellOrdersAsync(
                    createOrdersFromSellRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, numSamples: 4, runLimit: 512, noConflicts: false },
                );
                expect(improvedOrders).to.be.length(4);
                const orderSources = improvedOrders.map(o => getSourceFromAssetData(o.makerAssetData));
                const expectedSources = [
                    ERC20BridgeSource.Kyber,
                    ERC20BridgeSource.Eth2Dai,
                    ERC20BridgeSource.Uniswap,
                    ERC20BridgeSource.Native,
                ];
                expect(orderSources).to.deep.eq(expectedSources);
            });

            it('excludes Kyber when `noConflicts` enabled and Uniswap or Eth2Dai are used first', async () => {
                const rates: RatesBySource = {};
                rates[ERC20BridgeSource.Native] = [0.3, 0.2, 0.1, 0.05];
                rates[ERC20BridgeSource.Uniswap] = [0.5, 0.05, 0.05, 0.05];
                rates[ERC20BridgeSource.Eth2Dai] = [0.6, 0.05, 0.05, 0.05];
                rates[ERC20BridgeSource.Kyber] = [0.4, 0.05, 0.05, 0.05];
                replaceSamplerOps({
                    getSellQuotes: createGetMultipleQuotesOperationFromSellRates(rates),
                });
                const improvedOrders = await marketOperationUtils.getMarketSellOrdersAsync(
                    createOrdersFromSellRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, numSamples: 4, runLimit: 512, noConflicts: true },
                );
                expect(improvedOrders).to.be.length(4);
                const orderSources = improvedOrders.map(o => getSourceFromAssetData(o.makerAssetData));
                const expectedSources = [
                    ERC20BridgeSource.Eth2Dai,
                    ERC20BridgeSource.Uniswap,
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Native,
                ];
                expect(orderSources).to.deep.eq(expectedSources);
            });

            it('excludes Uniswap and Eth2Dai when `noConflicts` enabled and Kyber is used first', async () => {
                const rates: RatesBySource = {};
                rates[ERC20BridgeSource.Native] = [0.1, 0.05, 0.05, 0.05];
                rates[ERC20BridgeSource.Uniswap] = [0.15, 0.05, 0.05, 0.05];
                rates[ERC20BridgeSource.Eth2Dai] = [0.15, 0.05, 0.05, 0.05];
                rates[ERC20BridgeSource.Kyber] = [0.7, 0.05, 0.05, 0.05];
                replaceSamplerOps({
                    getSellQuotes: createGetMultipleQuotesOperationFromSellRates(rates),
                });
                const improvedOrders = await marketOperationUtils.getMarketSellOrdersAsync(
                    createOrdersFromSellRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, numSamples: 4, runLimit: 512, noConflicts: true },
                );
                expect(improvedOrders).to.be.length(4);
                const orderSources = improvedOrders.map(o => getSourceFromAssetData(o.makerAssetData));
                const expectedSources = [
                    ERC20BridgeSource.Kyber,
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Native,
                ];
                expect(orderSources).to.deep.eq(expectedSources);
            });
        });

        describe('getMarketBuyOrdersAsync()', () => {
            const FILL_AMOUNT = getRandomInteger(1, 1e18);
            const ORDERS = createOrdersFromBuyRates(
                FILL_AMOUNT,
                _.times(NUM_SAMPLES, () => DEFAULT_RATES[ERC20BridgeSource.Native][0]),
            );
            const DEFAULT_OPTS = { numSamples: NUM_SAMPLES, runLimit: 0, sampleDistributionBase: 1 };

            beforeEach(() => {
                replaceSamplerOps();
            });

            it('queries `numSamples` samples', async () => {
                const numSamples = _.random(1, 16);
                let actualNumSamples = 0;
                replaceSamplerOps({
                    getBuyQuotes: (sources, makerToken, takerToken, amounts) => {
                        actualNumSamples = amounts.length;
                        return DEFAULT_OPS.getBuyQuotes(sources, makerToken, takerToken, amounts);
                    },
                });
                await marketOperationUtils.getMarketBuyOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    numSamples,
                });
                expect(actualNumSamples).eq(numSamples);
            });

            it('polls all DEXes if `excludedSources` is empty', async () => {
                let sourcesPolled: ERC20BridgeSource[] = [];
                replaceSamplerOps({
                    getBuyQuotes: (sources, makerToken, takerToken, amounts) => {
                        sourcesPolled = sources.slice();
                        return DEFAULT_OPS.getBuyQuotes(sources, makerToken, takerToken, amounts);
                    },
                });
                await marketOperationUtils.getMarketBuyOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    excludedSources: [],
                });
                expect(sourcesPolled).to.deep.eq(BUY_SOURCES);
            });

            it('does not poll DEXes in `excludedSources`', async () => {
                const excludedSources = _.sampleSize(SELL_SOURCES, _.random(1, SELL_SOURCES.length));
                let sourcesPolled: ERC20BridgeSource[] = [];
                replaceSamplerOps({
                    getBuyQuotes: (sources, makerToken, takerToken, amounts) => {
                        sourcesPolled = sources.slice();
                        return DEFAULT_OPS.getBuyQuotes(sources, makerToken, takerToken, amounts);
                    },
                });
                await marketOperationUtils.getMarketBuyOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    excludedSources,
                });
                expect(sourcesPolled).to.deep.eq(_.without(BUY_SOURCES, ...excludedSources));
            });

            it('returns the most cost-effective single source if `runLimit == 0`', async () => {
                const bestSource = findSourceWithMaxOutput(DEFAULT_RATES);
                expect(bestSource).to.exist('');
                const improvedOrders = await marketOperationUtils.getMarketBuyOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    runLimit: 0,
                });
                const uniqueAssetDatas = _.uniq(improvedOrders.map(o => o.makerAssetData));
                expect(uniqueAssetDatas).to.be.length(1);
                expect(getSourceFromAssetData(uniqueAssetDatas[0])).to.be.eq(bestSource);
            });

            it('generates bridge orders with correct asset data', async () => {
                const improvedOrders = await marketOperationUtils.getMarketBuyOrdersAsync(
                    // Pass in empty orders to prevent native orders from being used.
                    ORDERS.map(o => ({ ...o, makerAssetAmount: constants.ZERO_AMOUNT })),
                    FILL_AMOUNT,
                    DEFAULT_OPTS,
                );
                expect(improvedOrders).to.not.be.length(0);
                for (const order of improvedOrders) {
                    expect(getSourceFromAssetData(order.makerAssetData)).to.exist('');
                    const makerAssetDataPrefix = hexUtils.slice(
                        assetDataUtils.encodeERC20BridgeAssetData(
                            MAKER_TOKEN,
                            constants.NULL_ADDRESS,
                            constants.NULL_BYTES,
                        ),
                        0,
                        36,
                    );
                    assertSamePrefix(order.makerAssetData, makerAssetDataPrefix);
                    expect(order.takerAssetData).to.eq(TAKER_ASSET_DATA);
                }
            });

            it('generates bridge orders with correct taker amount', async () => {
                const improvedOrders = await marketOperationUtils.getMarketBuyOrdersAsync(
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
                const improvedOrders = await marketOperationUtils.getMarketBuyOrdersAsync(
                    // Pass in empty orders to prevent native orders from being used.
                    ORDERS.map(o => ({ ...o, makerAssetAmount: constants.ZERO_AMOUNT })),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, bridgeSlippage },
                );
                expect(improvedOrders).to.not.be.length(0);
                for (const order of improvedOrders) {
                    const source = getSourceFromAssetData(order.makerAssetData);
                    const expectedTakerAmount = FILL_AMOUNT.div(_.last(DEFAULT_RATES[source]) as BigNumber);
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
                const improvedOrders = await marketOperationUtils.getMarketBuyOrdersAsync(
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
                replaceSamplerOps({
                    getBuyQuotes: createGetMultipleQuotesOperationFromBuyRates(rates),
                });
                const improvedOrders = await marketOperationUtils.getMarketBuyOrdersAsync(
                    createOrdersFromBuyRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, numSamples: 4, runLimit: 512 },
                );
                expect(improvedOrders).to.be.length(4);
                const orderSources = improvedOrders.map(o => getSourceFromAssetData(o.makerAssetData));
                const expectedSources = [
                    ERC20BridgeSource.Eth2Dai,
                    ERC20BridgeSource.Uniswap,
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Native,
                ];
                expect(orderSources).to.deep.eq(expectedSources);
            });
        });
    });
});
// tslint:disable-next-line: max-file-line-count
