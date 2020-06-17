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
import { Web3Wrapper } from '@0x/dev-utils';
import { assetDataUtils, generatePseudoRandomSalt } from '@0x/order-utils';
import { AssetProxyId, ERC20BridgeAssetData, SignedOrder } from '@0x/types';
import { BigNumber, fromTokenUnitAmount, hexUtils, NULL_ADDRESS } from '@0x/utils';
import * as _ from 'lodash';

import { MarketOperation, SignedOrderWithFillableAmounts } from '../src';
import { MarketOperationUtils } from '../src/utils/market_operation_utils/';
import {
    BUY_SOURCES,
    DEFAULT_CURVE_OPTS,
    POSITIVE_INF,
    SELL_SOURCES,
    ZERO_AMOUNT,
} from '../src/utils/market_operation_utils/constants';
import { createFillPaths } from '../src/utils/market_operation_utils/fills';
import { DexOrderSampler } from '../src/utils/market_operation_utils/sampler';
import { DexSample, ERC20BridgeSource, NativeFillData } from '../src/utils/market_operation_utils/types';

// tslint:disable: custom-no-magic-numbers
describe('MarketOperationUtils tests', () => {
    const CHAIN_ID = 1;
    const contractAddresses = { ...getContractAddressesForChainOrThrow(CHAIN_ID), multiBridge: NULL_ADDRESS };
    const ETH2DAI_BRIDGE_ADDRESS = contractAddresses.eth2DaiBridge;
    const KYBER_BRIDGE_ADDRESS = contractAddresses.kyberBridge;
    const UNISWAP_BRIDGE_ADDRESS = contractAddresses.uniswapBridge;
    const UNISWAP_V2_BRIDGE_ADDRESS = contractAddresses.uniswapV2Bridge;
    const CURVE_BRIDGE_ADDRESS = contractAddresses.curveBridge;

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
        const bridgeData = assetDataUtils.decodeAssetDataOrThrow(assetData);
        if (!assetDataUtils.isERC20BridgeAssetData(bridgeData)) {
            throw new Error('AssetData is not ERC20BridgeAssetData');
        }
        const { bridgeAddress } = bridgeData;
        switch (bridgeAddress) {
            case KYBER_BRIDGE_ADDRESS.toLowerCase():
                return ERC20BridgeSource.Kyber;
            case ETH2DAI_BRIDGE_ADDRESS.toLowerCase():
                return ERC20BridgeSource.Eth2Dai;
            case UNISWAP_BRIDGE_ADDRESS.toLowerCase():
                return ERC20BridgeSource.Uniswap;
            case UNISWAP_V2_BRIDGE_ADDRESS.toLowerCase():
                return ERC20BridgeSource.UniswapV2;
            case CURVE_BRIDGE_ADDRESS.toLowerCase():
                const curveSource = Object.keys(DEFAULT_CURVE_OPTS).filter(
                    k => assetData.indexOf(DEFAULT_CURVE_OPTS[k].curveAddress.slice(2)) !== -1,
                );
                return curveSource[0] as ERC20BridgeSource;
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

    function createSamplesFromRates(source: ERC20BridgeSource, inputs: Numberish[], rates: Numberish[]): DexSample[] {
        const samples: DexSample[] = [];
        inputs.forEach((input, i) => {
            const rate = rates[i];
            samples.push({
                source,
                input: new BigNumber(input),
                output: new BigNumber(input)
                    .minus(i === 0 ? 0 : samples[i - 1].input)
                    .times(rate)
                    .plus(i === 0 ? 0 : samples[i - 1].output)
                    .integerValue(),
            });
        });
        return samples;
    }

    type GetMultipleQuotesOperation = (
        sources: ERC20BridgeSource[],
        makerToken: string,
        takerToken: string,
        fillAmounts: BigNumber[],
        wethAddress: string,
        liquidityProviderAddress?: string,
    ) => DexSample[][];

    function createGetMultipleSellQuotesOperationFromRates(rates: RatesBySource): GetMultipleQuotesOperation {
        return (
            sources: ERC20BridgeSource[],
            makerToken: string,
            takerToken: string,
            fillAmounts: BigNumber[],
            wethAddress: string,
        ) => {
            return sources.map(s => createSamplesFromRates(s, fillAmounts, rates[s]));
        };
    }

    function callTradeOperationAndRetainLiquidityProviderParams(
        tradeOperation: (rates: RatesBySource) => GetMultipleQuotesOperation,
        rates: RatesBySource,
    ): [{ sources: ERC20BridgeSource[]; liquidityProviderAddress?: string }, GetMultipleQuotesOperation] {
        const liquidityPoolParams: { sources: ERC20BridgeSource[]; liquidityProviderAddress?: string } = {
            sources: [],
            liquidityProviderAddress: undefined,
        };
        const fn = (
            sources: ERC20BridgeSource[],
            makerToken: string,
            takerToken: string,
            fillAmounts: BigNumber[],
            wethAddress: string,
            liquidityProviderAddress?: string,
        ) => {
            liquidityPoolParams.liquidityProviderAddress = liquidityProviderAddress;
            liquidityPoolParams.sources = sources;
            return tradeOperation(rates)(
                sources,
                makerToken,
                takerToken,
                fillAmounts,
                wethAddress,
                liquidityProviderAddress,
            );
        };
        return [liquidityPoolParams, fn];
    }

    function createGetMultipleBuyQuotesOperationFromRates(rates: RatesBySource): GetMultipleQuotesOperation {
        return (
            sources: ERC20BridgeSource[],
            makerToken: string,
            takerToken: string,
            fillAmounts: BigNumber[],
            wethAddress: string,
        ) => {
            return sources.map(s => createSamplesFromRates(s, fillAmounts, rates[s].map(r => new BigNumber(1).div(r))));
        };
    }

    type GetMedianRateOperation = (
        sources: ERC20BridgeSource[],
        makerToken: string,
        takerToken: string,
        fillAmounts: BigNumber[],
        wethAddress: string,
        liquidityProviderAddress?: string,
    ) => BigNumber;

    type GetLiquidityProviderFromRegistryOperation = (
        registryAddress: string,
        takerToken: string,
        makerToken: string,
    ) => string;

    function createGetMedianSellRate(rate: Numberish): GetMedianRateOperation {
        return (
            sources: ERC20BridgeSource[],
            makerToken: string,
            takerToken: string,
            fillAmounts: BigNumber[],
            wethAddress: string,
        ) => {
            return new BigNumber(rate);
        };
    }

    function getLiquidityProviderFromRegistry(): GetLiquidityProviderFromRegistryOperation {
        return (registryAddress: string, takerToken: string, makerToken: string): string => {
            return NULL_ADDRESS;
        };
    }

    function getLiquidityProviderFromRegistryAndReturnCallParameters(
        liquidityProviderAddress: string = NULL_ADDRESS,
    ): [
        { registryAddress?: string; takerToken?: string; makerToken?: string },
        GetLiquidityProviderFromRegistryOperation
    ] {
        const callArgs: { registryAddress?: string; takerToken?: string; makerToken?: string } = {
            registryAddress: undefined,
            takerToken: undefined,
            makerToken: undefined,
        };
        const fn = (registryAddress: string, takerToken: string, makerToken: string): string => {
            callArgs.makerToken = makerToken;
            callArgs.takerToken = takerToken;
            if (registryAddress !== constants.NULL_ADDRESS) {
                callArgs.registryAddress = registryAddress;
            }
            return liquidityProviderAddress;
        };
        return [callArgs, fn];
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
        [ERC20BridgeSource.UniswapV2]: createDecreasingRates(NUM_SAMPLES),
        [ERC20BridgeSource.UniswapV2Eth]: createDecreasingRates(NUM_SAMPLES),
        [ERC20BridgeSource.CurveUsdcDai]: _.times(NUM_SAMPLES, () => 0),
        [ERC20BridgeSource.CurveUsdcDaiUsdt]: _.times(NUM_SAMPLES, () => 0),
        [ERC20BridgeSource.CurveUsdcDaiUsdtTusd]: _.times(NUM_SAMPLES, () => 0),
        [ERC20BridgeSource.CurveUsdcDaiUsdtBusd]: _.times(NUM_SAMPLES, () => 0),
        [ERC20BridgeSource.CurveUsdcDaiUsdtSusd]: _.times(NUM_SAMPLES, () => 0),
        [ERC20BridgeSource.LiquidityProvider]: _.times(NUM_SAMPLES, () => 0),
        [ERC20BridgeSource.MultiBridge]: _.times(NUM_SAMPLES, () => 0),
    };

    const DEFAULT_OPS = {
        getOrderFillableTakerAmounts(orders: SignedOrder[]): BigNumber[] {
            return orders.map(o => o.takerAssetAmount);
        },
        getOrderFillableMakerAmounts(orders: SignedOrder[]): BigNumber[] {
            return orders.map(o => o.makerAssetAmount);
        },
        getSellQuotes: createGetMultipleSellQuotesOperationFromRates(DEFAULT_RATES),
        getBuyQuotes: createGetMultipleBuyQuotesOperationFromRates(DEFAULT_RATES),
        getMedianSellRate: createGetMedianSellRate(1),
        getLiquidityProviderFromRegistry: getLiquidityProviderFromRegistry(),
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
            const FILL_AMOUNT = new BigNumber('100e18');
            const ORDERS = createOrdersFromSellRates(
                FILL_AMOUNT,
                _.times(NUM_SAMPLES, i => DEFAULT_RATES[ERC20BridgeSource.Native][i]),
            );
            const DEFAULT_OPTS = {
                numSamples: NUM_SAMPLES,
                sampleDistributionBase: 1,
                bridgeSlippage: 0,
                maxFallbackSlippage: 100,
                excludedSources: [
                    ERC20BridgeSource.Uniswap,
                    ERC20BridgeSource.UniswapV2Eth,
                    ...(Object.keys(DEFAULT_CURVE_OPTS) as ERC20BridgeSource[]),
                ],
                allowFallback: false,
                shouldBatchBridgeOrders: false,
            };

            beforeEach(() => {
                replaceSamplerOps();
            });

            it('queries `numSamples` samples', async () => {
                const numSamples = _.random(1, NUM_SAMPLES);
                let actualNumSamples = 0;
                replaceSamplerOps({
                    getSellQuotes: (sources, makerToken, takerToken, amounts, wethAddress) => {
                        actualNumSamples = amounts.length;
                        return DEFAULT_OPS.getSellQuotes(sources, makerToken, takerToken, amounts, wethAddress);
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
                    getSellQuotes: (sources, makerToken, takerToken, amounts, wethAddress) => {
                        sourcesPolled = sources.slice();
                        return DEFAULT_OPS.getSellQuotes(sources, makerToken, takerToken, amounts, wethAddress);
                    },
                });
                await marketOperationUtils.getMarketSellOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    excludedSources: [],
                });
                expect(sourcesPolled.sort()).to.deep.eq(SELL_SOURCES.slice().sort());
            });

            it('polls the liquidity provider when the registry is provided in the arguments', async () => {
                const [args, fn] = callTradeOperationAndRetainLiquidityProviderParams(
                    createGetMultipleSellQuotesOperationFromRates,
                    DEFAULT_RATES,
                );
                replaceSamplerOps({
                    getSellQuotes: fn,
                });
                const registryAddress = randomAddress();
                const newMarketOperationUtils = new MarketOperationUtils(
                    MOCK_SAMPLER,
                    contractAddresses,
                    ORDER_DOMAIN,
                    registryAddress,
                );
                await newMarketOperationUtils.getMarketSellOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    excludedSources: [],
                });
                expect(args.sources.sort()).to.deep.eq(
                    SELL_SOURCES.concat([ERC20BridgeSource.LiquidityProvider]).sort(),
                );
                expect(args.liquidityProviderAddress).to.eql(registryAddress);
            });

            it('does not poll DEXes in `excludedSources`', async () => {
                const excludedSources = _.sampleSize(SELL_SOURCES, _.random(1, SELL_SOURCES.length));
                let sourcesPolled: ERC20BridgeSource[] = [];
                replaceSamplerOps({
                    getSellQuotes: (sources, makerToken, takerToken, amounts, wethAddress) => {
                        sourcesPolled = sources.slice();
                        return DEFAULT_OPS.getSellQuotes(sources, makerToken, takerToken, amounts, wethAddress);
                    },
                });
                await marketOperationUtils.getMarketSellOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    excludedSources,
                });
                expect(sourcesPolled.sort()).to.deep.eq(_.without(SELL_SOURCES, ...excludedSources).sort());
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
                    const expectedMakerAmount = order.fills[0].output;
                    const slippage = 1 - order.makerAssetAmount.div(expectedMakerAmount.plus(1)).toNumber();
                    assertRoughlyEquals(slippage, bridgeSlippage, 1);
                }
            });

            it('can mix convex sources', async () => {
                const rates: RatesBySource = {};
                rates[ERC20BridgeSource.Native] = [0.4, 0.3, 0.2, 0.1];
                rates[ERC20BridgeSource.UniswapV2] = [0.5, 0.05, 0.05, 0.05];
                rates[ERC20BridgeSource.Eth2Dai] = [0.6, 0.05, 0.05, 0.05];
                rates[ERC20BridgeSource.Kyber] = [0, 0, 0, 0]; // unused
                replaceSamplerOps({
                    getSellQuotes: createGetMultipleSellQuotesOperationFromRates(rates),
                });
                const improvedOrders = await marketOperationUtils.getMarketSellOrdersAsync(
                    createOrdersFromSellRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, numSamples: 4 },
                );
                const orderSources = improvedOrders.map(o => o.fills[0].source);
                const expectedSources = [
                    ERC20BridgeSource.Eth2Dai,
                    ERC20BridgeSource.UniswapV2,
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Native,
                ];
                expect(orderSources.sort()).to.deep.eq(expectedSources.sort());
            });

            const ETH_TO_MAKER_RATE = 1.5;

            it('factors in fees for native orders', async () => {
                // Native orders will have the best rates but have fees,
                // dropping their effective rates.
                const nativeFeeRate = 0.06;
                const rates: RatesBySource = {
                    [ERC20BridgeSource.Native]: [1, 0.99, 0.98, 0.97], // Effectively [0.94, 0.93, 0.92, 0.91]
                    [ERC20BridgeSource.UniswapV2]: [0.96, 0.1, 0.1, 0.1],
                    [ERC20BridgeSource.Eth2Dai]: [0.95, 0.1, 0.1, 0.1],
                    [ERC20BridgeSource.Kyber]: [0.1, 0.1, 0.1, 0.1],
                };
                const feeSchedule = {
                    [ERC20BridgeSource.Native]: FILL_AMOUNT.div(4)
                        .times(nativeFeeRate)
                        .dividedToIntegerBy(ETH_TO_MAKER_RATE),
                };
                replaceSamplerOps({
                    getSellQuotes: createGetMultipleSellQuotesOperationFromRates(rates),
                    getMedianSellRate: createGetMedianSellRate(ETH_TO_MAKER_RATE),
                });
                const improvedOrders = await marketOperationUtils.getMarketSellOrdersAsync(
                    createOrdersFromSellRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, numSamples: 4, feeSchedule },
                );
                const orderSources = improvedOrders.map(o => o.fills[0].source);
                const expectedSources = [
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.UniswapV2,
                    ERC20BridgeSource.Eth2Dai,
                    ERC20BridgeSource.Native,
                ];
                expect(orderSources.sort()).to.deep.eq(expectedSources.sort());
            });

            it('factors in fees for dexes', async () => {
                // Kyber will have the best rates but will have fees,
                // dropping its effective rates.
                const uniswapFeeRate = 0.2;
                const rates: RatesBySource = {
                    [ERC20BridgeSource.Native]: [0.95, 0.1, 0.1, 0.1],
                    [ERC20BridgeSource.Kyber]: [0.1, 0.1, 0.1, 0.1],
                    [ERC20BridgeSource.Eth2Dai]: [0.92, 0.1, 0.1, 0.1],
                    // Effectively [0.8, ~0.5, ~0, ~0]
                    [ERC20BridgeSource.UniswapV2]: [1, 0.7, 0.2, 0.2],
                };
                const feeSchedule = {
                    [ERC20BridgeSource.Uniswap]: FILL_AMOUNT.div(4)
                        .times(uniswapFeeRate)
                        .dividedToIntegerBy(ETH_TO_MAKER_RATE),
                };
                replaceSamplerOps({
                    getSellQuotes: createGetMultipleSellQuotesOperationFromRates(rates),
                    getMedianSellRate: createGetMedianSellRate(ETH_TO_MAKER_RATE),
                });
                const improvedOrders = await marketOperationUtils.getMarketSellOrdersAsync(
                    createOrdersFromSellRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, numSamples: 4, feeSchedule },
                );
                const orderSources = improvedOrders.map(o => o.fills[0].source);
                const expectedSources = [
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Eth2Dai,
                    ERC20BridgeSource.UniswapV2,
                ];
                expect(orderSources.sort()).to.deep.eq(expectedSources.sort());
            });

            it('can mix one concave source', async () => {
                const rates: RatesBySource = {
                    [ERC20BridgeSource.Kyber]: [0, 0, 0, 0], // Won't use
                    [ERC20BridgeSource.Eth2Dai]: [0.5, 0.85, 0.75, 0.75], // Concave
                    [ERC20BridgeSource.UniswapV2]: [0.96, 0.2, 0.1, 0.1],
                    [ERC20BridgeSource.Native]: [0.95, 0.2, 0.2, 0.1],
                };
                replaceSamplerOps({
                    getSellQuotes: createGetMultipleSellQuotesOperationFromRates(rates),
                    getMedianSellRate: createGetMedianSellRate(ETH_TO_MAKER_RATE),
                });
                const improvedOrders = await marketOperationUtils.getMarketSellOrdersAsync(
                    createOrdersFromSellRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, numSamples: 4 },
                );
                const orderSources = improvedOrders.map(o => o.fills[0].source);
                const expectedSources = [
                    ERC20BridgeSource.Eth2Dai,
                    ERC20BridgeSource.UniswapV2,
                    ERC20BridgeSource.Native,
                ];
                expect(orderSources.sort()).to.deep.eq(expectedSources.sort());
            });

            it('fallback orders use different sources', async () => {
                const rates: RatesBySource = {};
                rates[ERC20BridgeSource.Native] = [0.9, 0.8, 0.5, 0.5];
                rates[ERC20BridgeSource.UniswapV2] = [0.6, 0.05, 0.01, 0.01];
                rates[ERC20BridgeSource.Eth2Dai] = [0.4, 0.3, 0.01, 0.01];
                rates[ERC20BridgeSource.Kyber] = [0.35, 0.2, 0.01, 0.01];
                replaceSamplerOps({
                    getSellQuotes: createGetMultipleSellQuotesOperationFromRates(rates),
                });
                const improvedOrders = await marketOperationUtils.getMarketSellOrdersAsync(
                    createOrdersFromSellRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, numSamples: 4, allowFallback: true },
                );
                const orderSources = improvedOrders.map(o => o.fills[0].source);
                const firstSources = [
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.UniswapV2,
                ];
                const secondSources = [ERC20BridgeSource.Eth2Dai, ERC20BridgeSource.Kyber];
                expect(orderSources.slice(0, firstSources.length).sort()).to.deep.eq(firstSources.sort());
                expect(orderSources.slice(firstSources.length).sort()).to.deep.eq(secondSources.sort());
            });

            it('does not create a fallback if below maxFallbackSlippage', async () => {
                const rates: RatesBySource = {};
                rates[ERC20BridgeSource.Native] = [1, 1, 0.01, 0.01];
                rates[ERC20BridgeSource.UniswapV2] = [1, 1, 0.01, 0.01];
                rates[ERC20BridgeSource.Eth2Dai] = [0.49, 0.49, 0.49, 0.49];
                rates[ERC20BridgeSource.Kyber] = [0.35, 0.2, 0.01, 0.01];
                replaceSamplerOps({
                    getSellQuotes: createGetMultipleSellQuotesOperationFromRates(rates),
                });
                const improvedOrders = await marketOperationUtils.getMarketSellOrdersAsync(
                    createOrdersFromSellRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, numSamples: 4, allowFallback: true, maxFallbackSlippage: 0.25 },
                );
                const orderSources = improvedOrders.map(o => o.fills[0].source);
                const firstSources = [ERC20BridgeSource.Native, ERC20BridgeSource.Native, ERC20BridgeSource.UniswapV2];
                const secondSources: ERC20BridgeSource[] = [];
                expect(orderSources.slice(0, firstSources.length).sort()).to.deep.eq(firstSources.sort());
                expect(orderSources.slice(firstSources.length).sort()).to.deep.eq(secondSources.sort());
            });

            it('is able to create a order from LiquidityProvider', async () => {
                const registryAddress = randomAddress();
                const liquidityProviderAddress = randomAddress();
                const xAsset = randomAddress();
                const yAsset = randomAddress();
                const toSell = fromTokenUnitAmount(10);

                const [getSellQuotesParams, getSellQuotesFn] = callTradeOperationAndRetainLiquidityProviderParams(
                    createGetMultipleSellQuotesOperationFromRates,
                    {
                        [ERC20BridgeSource.LiquidityProvider]: createDecreasingRates(5),
                    },
                );
                const [
                    getLiquidityProviderParams,
                    getLiquidityProviderFn,
                ] = getLiquidityProviderFromRegistryAndReturnCallParameters(liquidityProviderAddress);
                replaceSamplerOps({
                    getOrderFillableTakerAmounts: () => [constants.ZERO_AMOUNT],
                    getSellQuotes: getSellQuotesFn,
                    getLiquidityProviderFromRegistry: getLiquidityProviderFn,
                });

                const sampler = new MarketOperationUtils(
                    MOCK_SAMPLER,
                    contractAddresses,
                    ORDER_DOMAIN,
                    registryAddress,
                );
                const result = await sampler.getMarketSellOrdersAsync(
                    [
                        createOrder({
                            makerAssetData: assetDataUtils.encodeERC20AssetData(xAsset),
                            takerAssetData: assetDataUtils.encodeERC20AssetData(yAsset),
                        }),
                    ],
                    Web3Wrapper.toBaseUnitAmount(10, 18),
                    { excludedSources: SELL_SOURCES, numSamples: 4, bridgeSlippage: 0, shouldBatchBridgeOrders: false },
                );
                expect(result.length).to.eql(1);
                expect(result[0].makerAddress).to.eql(liquidityProviderAddress);

                // tslint:disable-next-line:no-unnecessary-type-assertion
                const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(
                    result[0].makerAssetData,
                ) as ERC20BridgeAssetData;
                expect(decodedAssetData.assetProxyId).to.eql(AssetProxyId.ERC20Bridge);
                expect(decodedAssetData.bridgeAddress).to.eql(liquidityProviderAddress);
                expect(result[0].takerAssetAmount).to.bignumber.eql(toSell);
                expect(getSellQuotesParams.sources).contains(ERC20BridgeSource.LiquidityProvider);
                expect(getSellQuotesParams.liquidityProviderAddress).is.eql(registryAddress);
                expect(getLiquidityProviderParams.registryAddress).is.eql(registryAddress);
                expect(getLiquidityProviderParams.makerToken).is.eql(yAsset);
                expect(getLiquidityProviderParams.takerToken).is.eql(xAsset);
            });

            it('batches contiguous bridge sources', async () => {
                const rates: RatesBySource = {};
                rates[ERC20BridgeSource.UniswapV2] = [1, 0.01, 0.01, 0.01];
                rates[ERC20BridgeSource.Native] = [0.5, 0.01, 0.01, 0.01];
                rates[ERC20BridgeSource.Eth2Dai] = [0.49, 0.01, 0.01, 0.01];
                rates[ERC20BridgeSource.CurveUsdcDai] = [0.48, 0.01, 0.01, 0.01];
                replaceSamplerOps({
                    getSellQuotes: createGetMultipleSellQuotesOperationFromRates(rates),
                });
                const improvedOrders = await marketOperationUtils.getMarketSellOrdersAsync(
                    createOrdersFromSellRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    {
                        ...DEFAULT_OPTS,
                        numSamples: 4,
                        excludedSources: [
                            ERC20BridgeSource.Kyber,
                            ..._.without(DEFAULT_OPTS.excludedSources, ERC20BridgeSource.CurveUsdcDai),
                        ],
                        shouldBatchBridgeOrders: true,
                    },
                );
                expect(improvedOrders).to.be.length(3);
                const orderFillSources = improvedOrders.map(o => o.fills.map(f => f.source));
                expect(orderFillSources).to.deep.eq([
                    [ERC20BridgeSource.UniswapV2],
                    [ERC20BridgeSource.Native],
                    [ERC20BridgeSource.Eth2Dai, ERC20BridgeSource.CurveUsdcDai],
                ]);
            });
        });

        describe('getMarketBuyOrdersAsync()', () => {
            const FILL_AMOUNT = new BigNumber('100e18');
            const ORDERS = createOrdersFromBuyRates(
                FILL_AMOUNT,
                _.times(NUM_SAMPLES, () => DEFAULT_RATES[ERC20BridgeSource.Native][0]),
            );
            const DEFAULT_OPTS = {
                numSamples: NUM_SAMPLES,
                sampleDistributionBase: 1,
                bridgeSlippage: 0,
                maxFallbackSlippage: 100,
                excludedSources: [
                    ...(Object.keys(DEFAULT_CURVE_OPTS) as ERC20BridgeSource[]),
                    ERC20BridgeSource.Kyber,
                    ERC20BridgeSource.Uniswap,
                    ERC20BridgeSource.UniswapV2Eth,
                ],
                allowFallback: false,
                shouldBatchBridgeOrders: false,
            };

            beforeEach(() => {
                replaceSamplerOps();
            });

            it('queries `numSamples` samples', async () => {
                const numSamples = _.random(1, 16);
                let actualNumSamples = 0;
                replaceSamplerOps({
                    getBuyQuotes: (sources, makerToken, takerToken, amounts, wethAddress) => {
                        actualNumSamples = amounts.length;
                        return DEFAULT_OPS.getBuyQuotes(sources, makerToken, takerToken, amounts, wethAddress);
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
                    getBuyQuotes: (sources, makerToken, takerToken, amounts, wethAddress) => {
                        sourcesPolled = sources.slice();
                        return DEFAULT_OPS.getBuyQuotes(sources, makerToken, takerToken, amounts, wethAddress);
                    },
                });
                await marketOperationUtils.getMarketBuyOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    excludedSources: [],
                });
                expect(sourcesPolled).to.deep.eq(BUY_SOURCES);
            });

            it('polls the liquidity provider when the registry is provided in the arguments', async () => {
                const [args, fn] = callTradeOperationAndRetainLiquidityProviderParams(
                    createGetMultipleBuyQuotesOperationFromRates,
                    DEFAULT_RATES,
                );
                replaceSamplerOps({
                    getBuyQuotes: fn,
                });
                const registryAddress = randomAddress();
                const newMarketOperationUtils = new MarketOperationUtils(
                    MOCK_SAMPLER,
                    contractAddresses,
                    ORDER_DOMAIN,
                    registryAddress,
                );
                await newMarketOperationUtils.getMarketBuyOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    excludedSources: [],
                });
                expect(args.sources.sort()).to.deep.eq(
                    BUY_SOURCES.concat([ERC20BridgeSource.LiquidityProvider]).sort(),
                );
                expect(args.liquidityProviderAddress).to.eql(registryAddress);
            });

            it('does not poll DEXes in `excludedSources`', async () => {
                const excludedSources = _.sampleSize(SELL_SOURCES, _.random(1, SELL_SOURCES.length));
                let sourcesPolled: ERC20BridgeSource[] = [];
                replaceSamplerOps({
                    getBuyQuotes: (sources, makerToken, takerToken, amounts, wethAddress) => {
                        sourcesPolled = sources.slice();
                        return DEFAULT_OPS.getBuyQuotes(sources, makerToken, takerToken, amounts, wethAddress);
                    },
                });
                await marketOperationUtils.getMarketBuyOrdersAsync(ORDERS, FILL_AMOUNT, {
                    ...DEFAULT_OPTS,
                    excludedSources,
                });
                expect(sourcesPolled).to.deep.eq(_.without(BUY_SOURCES, ...excludedSources));
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

            it('generates bridge orders with correct maker amount', async () => {
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
                    const expectedTakerAmount = order.fills[0].output;
                    const slippage = order.takerAssetAmount.div(expectedTakerAmount.plus(1)).toNumber() - 1;
                    assertRoughlyEquals(slippage, bridgeSlippage, 1);
                }
            });

            it('can mix convex sources', async () => {
                const rates: RatesBySource = {};
                rates[ERC20BridgeSource.Native] = [0.4, 0.3, 0.2, 0.1];
                rates[ERC20BridgeSource.UniswapV2] = [0.5, 0.05, 0.05, 0.05];
                rates[ERC20BridgeSource.Eth2Dai] = [0.6, 0.05, 0.05, 0.05];
                replaceSamplerOps({
                    getBuyQuotes: createGetMultipleBuyQuotesOperationFromRates(rates),
                });
                const improvedOrders = await marketOperationUtils.getMarketBuyOrdersAsync(
                    createOrdersFromBuyRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, numSamples: 4 },
                );
                const orderSources = improvedOrders.map(o => o.fills[0].source);
                const expectedSources = [
                    ERC20BridgeSource.Eth2Dai,
                    ERC20BridgeSource.UniswapV2,
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Native,
                ];
                expect(orderSources.sort()).to.deep.eq(expectedSources.sort());
            });

            const ETH_TO_TAKER_RATE = 1.5;

            it('factors in fees for native orders', async () => {
                // Native orders will have the best rates but have fees,
                // dropping their effective rates.
                const nativeFeeRate = 0.06;
                const rates: RatesBySource = {
                    [ERC20BridgeSource.Native]: [1, 0.99, 0.98, 0.97], // Effectively [0.94, ~0.93, ~0.92, ~0.91]
                    [ERC20BridgeSource.UniswapV2]: [0.96, 0.1, 0.1, 0.1],
                    [ERC20BridgeSource.Eth2Dai]: [0.95, 0.1, 0.1, 0.1],
                    [ERC20BridgeSource.Kyber]: [0.1, 0.1, 0.1, 0.1],
                };
                const feeSchedule = {
                    [ERC20BridgeSource.Native]: FILL_AMOUNT.div(4)
                        .times(nativeFeeRate)
                        .dividedToIntegerBy(ETH_TO_TAKER_RATE),
                };
                replaceSamplerOps({
                    getBuyQuotes: createGetMultipleBuyQuotesOperationFromRates(rates),
                    getMedianSellRate: createGetMedianSellRate(ETH_TO_TAKER_RATE),
                });
                const improvedOrders = await marketOperationUtils.getMarketBuyOrdersAsync(
                    createOrdersFromBuyRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, numSamples: 4, feeSchedule },
                );
                const orderSources = improvedOrders.map(o => o.fills[0].source);
                const expectedSources = [
                    ERC20BridgeSource.UniswapV2,
                    ERC20BridgeSource.Eth2Dai,
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Native,
                ];
                expect(orderSources.sort()).to.deep.eq(expectedSources.sort());
            });

            it('factors in fees for dexes', async () => {
                // Uniswap will have the best rates but will have fees,
                // dropping its effective rates.
                const uniswapFeeRate = 0.2;
                const rates: RatesBySource = {
                    [ERC20BridgeSource.Native]: [0.95, 0.1, 0.1, 0.1],
                    // Effectively [0.8, ~0.5, ~0, ~0]
                    [ERC20BridgeSource.UniswapV2]: [1, 0.7, 0.2, 0.2],
                    [ERC20BridgeSource.Eth2Dai]: [0.92, 0.1, 0.1, 0.1],
                };
                const feeSchedule = {
                    [ERC20BridgeSource.UniswapV2]: FILL_AMOUNT.div(4)
                        .times(uniswapFeeRate)
                        .dividedToIntegerBy(ETH_TO_TAKER_RATE),
                };
                replaceSamplerOps({
                    getBuyQuotes: createGetMultipleBuyQuotesOperationFromRates(rates),
                    getMedianSellRate: createGetMedianSellRate(ETH_TO_TAKER_RATE),
                });
                const improvedOrders = await marketOperationUtils.getMarketBuyOrdersAsync(
                    createOrdersFromBuyRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, numSamples: 4, feeSchedule },
                );
                const orderSources = improvedOrders.map(o => o.fills[0].source);
                const expectedSources = [
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Eth2Dai,
                    ERC20BridgeSource.UniswapV2,
                ];
                expect(orderSources.sort()).to.deep.eq(expectedSources.sort());
            });

            it('fallback orders use different sources', async () => {
                const rates: RatesBySource = {};
                rates[ERC20BridgeSource.Native] = [0.9, 0.8, 0.5, 0.5];
                rates[ERC20BridgeSource.UniswapV2] = [0.6, 0.05, 0.01, 0.01];
                rates[ERC20BridgeSource.Eth2Dai] = [0.4, 0.3, 0.01, 0.01];
                replaceSamplerOps({
                    getBuyQuotes: createGetMultipleBuyQuotesOperationFromRates(rates),
                });
                const improvedOrders = await marketOperationUtils.getMarketBuyOrdersAsync(
                    createOrdersFromBuyRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, numSamples: 4, allowFallback: true },
                );
                const orderSources = improvedOrders.map(o => o.fills[0].source);
                const firstSources = [
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.Native,
                    ERC20BridgeSource.UniswapV2,
                ];
                const secondSources = [ERC20BridgeSource.Eth2Dai];
                expect(orderSources.slice(0, firstSources.length).sort()).to.deep.eq(firstSources.sort());
                expect(orderSources.slice(firstSources.length).sort()).to.deep.eq(secondSources.sort());
            });

            it('does not create a fallback if below maxFallbackSlippage', async () => {
                const rates: RatesBySource = {};
                rates[ERC20BridgeSource.Native] = [1, 1, 0.01, 0.01];
                rates[ERC20BridgeSource.UniswapV2] = [1, 1, 0.01, 0.01];
                rates[ERC20BridgeSource.Eth2Dai] = [0.49, 0.49, 0.49, 0.49];
                replaceSamplerOps({
                    getBuyQuotes: createGetMultipleBuyQuotesOperationFromRates(rates),
                });
                const improvedOrders = await marketOperationUtils.getMarketBuyOrdersAsync(
                    createOrdersFromBuyRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    { ...DEFAULT_OPTS, numSamples: 4, allowFallback: true, maxFallbackSlippage: 0.25 },
                );
                const orderSources = improvedOrders.map(o => o.fills[0].source);
                const firstSources = [ERC20BridgeSource.Native, ERC20BridgeSource.Native, ERC20BridgeSource.UniswapV2];
                const secondSources: ERC20BridgeSource[] = [];
                expect(orderSources.slice(0, firstSources.length).sort()).to.deep.eq(firstSources.sort());
                expect(orderSources.slice(firstSources.length).sort()).to.deep.eq(secondSources.sort());
            });

            it('batches contiguous bridge sources', async () => {
                const rates: RatesBySource = {};
                rates[ERC20BridgeSource.Native] = [0.5, 0.01, 0.01, 0.01];
                rates[ERC20BridgeSource.Eth2Dai] = [0.49, 0.01, 0.01, 0.01];
                rates[ERC20BridgeSource.UniswapV2] = [0.48, 0.47, 0.01, 0.01];
                replaceSamplerOps({
                    getBuyQuotes: createGetMultipleBuyQuotesOperationFromRates(rates),
                });
                const improvedOrders = await marketOperationUtils.getMarketBuyOrdersAsync(
                    createOrdersFromBuyRates(FILL_AMOUNT, rates[ERC20BridgeSource.Native]),
                    FILL_AMOUNT,
                    {
                        ...DEFAULT_OPTS,
                        numSamples: 4,
                        shouldBatchBridgeOrders: true,
                    },
                );
                expect(improvedOrders).to.be.length(2);
                const orderFillSources = improvedOrders.map(o => o.fills.map(f => f.source));
                expect(orderFillSources).to.deep.eq([
                    [ERC20BridgeSource.Native],
                    [ERC20BridgeSource.Eth2Dai, ERC20BridgeSource.UniswapV2],
                ]);
            });
        });
    });

    describe('createFillPaths', () => {
        const takerAssetAmount = new BigNumber(5000000);
        const ethToOutputRate = new BigNumber(0.5);
        // tslint:disable-next-line:no-object-literal-type-assertion
        const smallOrder = {
            chainId: 1,
            makerAddress: 'SMALL_ORDER',
            takerAddress: NULL_ADDRESS,
            takerAssetAmount,
            makerAssetAmount: takerAssetAmount.times(2),
            makerFee: ZERO_AMOUNT,
            takerFee: ZERO_AMOUNT,
            makerAssetData: '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            takerAssetData: '0xf47261b0000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            makerFeeAssetData: '0x',
            takerFeeAssetData: '0x',
            fillableTakerAssetAmount: takerAssetAmount,
            fillableMakerAssetAmount: takerAssetAmount.times(2),
            fillableTakerFeeAmount: ZERO_AMOUNT,
        } as SignedOrderWithFillableAmounts;
        const largeOrder = {
            ...smallOrder,
            makerAddress: 'LARGE_ORDER',
            fillableMakerAssetAmount: smallOrder.fillableMakerAssetAmount.times(2),
            fillableTakerAssetAmount: smallOrder.fillableTakerAssetAmount.times(2),
            makerAssetAmount: smallOrder.makerAssetAmount.times(2),
            takerAssetAmount: smallOrder.takerAssetAmount.times(2),
        };
        const orders = [smallOrder, largeOrder];
        const feeSchedule = {
            [ERC20BridgeSource.Native]: new BigNumber(2e5),
        };

        it('penalizes native fill based on target amount when target is smaller', () => {
            const path = createFillPaths({
                side: MarketOperation.Sell,
                orders,
                dexQuotes: [],
                targetInput: takerAssetAmount.minus(1),
                ethToOutputRate,
                feeSchedule,
            });
            expect((path[0][0].fillData as NativeFillData).order.makerAddress).to.eq(smallOrder.makerAddress);
            expect(path[0][0].input).to.be.bignumber.eq(takerAssetAmount.minus(1));
        });

        it('penalizes native fill based on available amount when target is larger', () => {
            const path = createFillPaths({
                side: MarketOperation.Sell,
                orders,
                dexQuotes: [],
                targetInput: POSITIVE_INF,
                ethToOutputRate,
                feeSchedule,
            });
            expect((path[0][0].fillData as NativeFillData).order.makerAddress).to.eq(largeOrder.makerAddress);
            expect((path[0][1].fillData as NativeFillData).order.makerAddress).to.eq(smallOrder.makerAddress);
        });
    });
});
// tslint:disable-next-line: max-file-line-count
