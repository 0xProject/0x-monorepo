import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { ERC20BridgeSamplerContract } from '../../wrappers';

import { BalancerPoolsCache, computeBalancerBuyQuote, computeBalancerSellQuote } from './balancer_utils';
import { BancorService } from './bancor_service';
import { NULL_BYTES, ZERO_AMOUNT } from './constants';
import { getCurveInfosForPair } from './curve_utils';
import { getMultiBridgeIntermediateToken } from './multibridge_utils';
import { getIntermediateTokens } from './multihop_utils';
import {
    BalancerFillData,
    BancorFillData,
    BatchedOperation,
    CurveFillData,
    CurveInfo,
    DexSample,
    ERC20BridgeSource,
    HopInfo,
    LiquidityProviderFillData,
    MultiBridgeFillData,
    MultiHopFillData,
    SamplerContractOperation,
    SourceQuoteOperation,
    TokenAdjacencyGraph,
    UniswapV2FillData,
} from './types';

// tslint:disable:no-inferred-empty-object-type

/**
 * Composable operations that can be batched in a single transaction,
 * for use with `DexOrderSampler.executeAsync()`.
 */
export class SamplerOperations {
    public static constant<T>(result: T): BatchedOperation<T> {
        return {
            encodeCall: () => {
                return '0x';
            },
            handleCallResultsAsync: async _callResults => {
                return result;
            },
        };
    }

    constructor(
        protected readonly _samplerContract: ERC20BridgeSamplerContract,
        public readonly bancorService?: BancorService,
        public readonly balancerPoolsCache: BalancerPoolsCache = new BalancerPoolsCache(),
    ) {}

    public getOrderFillableTakerAmounts(orders: SignedOrder[], exchangeAddress: string): BatchedOperation<BigNumber[]> {
        return new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.Native,
            this._samplerContract.getOrderFillableTakerAssetAmounts,
            [orders, orders.map(o => o.signature), exchangeAddress],
        );
    }

    public getOrderFillableMakerAmounts(orders: SignedOrder[], exchangeAddress: string): BatchedOperation<BigNumber[]> {
        return new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.Native,
            this._samplerContract.getOrderFillableMakerAssetAmounts,
            [orders, orders.map(o => o.signature), exchangeAddress],
        );
    }

    public getKyberSellQuotes(
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.Kyber,
            this._samplerContract.sampleSellsFromKyberNetwork,
            [takerToken, makerToken, takerFillAmounts],
        );
    }

    public getKyberBuyQuotes(
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.Kyber,
            this._samplerContract.sampleBuysFromKyberNetwork,
            [takerToken, makerToken, makerFillAmounts],
        );
    }

    public getUniswapSellQuotes(
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.Uniswap,
            this._samplerContract.sampleSellsFromUniswap,
            [takerToken, makerToken, takerFillAmounts],
        );
    }

    public getUniswapBuyQuotes(
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.Uniswap,
            this._samplerContract.sampleBuysFromUniswap,
            [takerToken, makerToken, makerFillAmounts],
        );
    }

    public getUniswapV2SellQuotes(
        tokenAddressPath: string[],
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<UniswapV2FillData> {
        return new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.UniswapV2,
            this._samplerContract.sampleSellsFromUniswapV2,
            [tokenAddressPath, takerFillAmounts],
            { tokenAddressPath },
        );
    }

    public getUniswapV2BuyQuotes(
        tokenAddressPath: string[],
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<UniswapV2FillData> {
        return new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.UniswapV2,
            this._samplerContract.sampleBuysFromUniswapV2,
            [tokenAddressPath, makerFillAmounts],
            { tokenAddressPath },
        );
    }

    public getLiquidityProviderSellQuotes(
        registryAddress: string,
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<LiquidityProviderFillData> {
        const op = new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.LiquidityProvider,
            this._samplerContract.sampleSellsFromLiquidityProviderRegistry,
            [registryAddress, takerToken, makerToken, takerFillAmounts],
            {} as LiquidityProviderFillData, // tslint:disable-line:no-object-literal-type-assertion
            async (callResults: string): Promise<BigNumber[]> => {
                const [samples, poolAddress] = this._samplerContract.getABIDecodedReturnData<[BigNumber[], string]>(
                    'sampleSellsFromLiquidityProviderRegistry',
                    callResults,
                );
                op.fillData.poolAddress = poolAddress;
                return Promise.resolve(samples);
            },
        );
        return op;
    }

    public getLiquidityProviderBuyQuotes(
        registryAddress: string,
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<LiquidityProviderFillData> {
        const op = new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.LiquidityProvider,
            this._samplerContract.sampleBuysFromLiquidityProviderRegistry,
            [registryAddress, takerToken, makerToken, makerFillAmounts],
            {} as LiquidityProviderFillData, // tslint:disable-line:no-object-literal-type-assertion
            async (callResults: string): Promise<BigNumber[]> => {
                const [samples, poolAddress] = this._samplerContract.getABIDecodedReturnData<[BigNumber[], string]>(
                    'sampleBuysFromLiquidityProviderRegistry',
                    callResults,
                );
                op.fillData.poolAddress = poolAddress;
                return Promise.resolve(samples);
            },
        );
        return op;
    }

    public getMultiBridgeSellQuotes(
        multiBridgeAddress: string,
        makerToken: string,
        intermediateToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<MultiBridgeFillData> {
        return new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.MultiBridge,
            this._samplerContract.sampleSellsFromMultiBridge,
            [multiBridgeAddress, takerToken, intermediateToken, makerToken, takerFillAmounts],
            { poolAddress: multiBridgeAddress },
        );
    }

    public getEth2DaiSellQuotes(
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.Eth2Dai,
            this._samplerContract.sampleSellsFromEth2Dai,
            [takerToken, makerToken, takerFillAmounts],
        );
    }

    public getEth2DaiBuyQuotes(
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.Eth2Dai,
            this._samplerContract.sampleBuysFromEth2Dai,
            [takerToken, makerToken, makerFillAmounts],
        );
    }

    public getCurveSellQuotes(
        curve: CurveInfo,
        fromTokenIdx: number,
        toTokenIdx: number,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<CurveFillData> {
        return new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.Curve,
            this._samplerContract.sampleSellsFromCurve,
            [
                {
                    poolAddress: curve.poolAddress,
                    sellQuoteFunctionSelector: curve.sellQuoteFunctionSelector,
                    buyQuoteFunctionSelector: curve.buyQuoteFunctionSelector,
                },
                new BigNumber(fromTokenIdx),
                new BigNumber(toTokenIdx),
                takerFillAmounts,
            ],
            {
                curve,
                fromTokenIdx,
                toTokenIdx,
            },
        );
    }

    public getCurveBuyQuotes(
        curve: CurveInfo,
        fromTokenIdx: number,
        toTokenIdx: number,
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<CurveFillData> {
        return new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.Curve,
            this._samplerContract.sampleBuysFromCurve,
            [
                {
                    poolAddress: curve.poolAddress,
                    sellQuoteFunctionSelector: curve.sellQuoteFunctionSelector,
                    buyQuoteFunctionSelector: curve.buyQuoteFunctionSelector,
                },
                new BigNumber(fromTokenIdx),
                new BigNumber(toTokenIdx),
                makerFillAmounts,
            ],
            {
                curve,
                fromTokenIdx,
                toTokenIdx,
            },
        );
    }

    public getBalancerSellQuotes(
        poolAddress: string,
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<BalancerFillData> {
        return new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.Balancer,
            this._samplerContract.sampleSellsFromBalancer,
            [poolAddress, takerToken, makerToken, takerFillAmounts],
            { poolAddress },
        );
    }

    public getBalancerBuyQuotes(
        poolAddress: string,
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<BalancerFillData> {
        return new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.Balancer,
            this._samplerContract.sampleBuysFromBalancer,
            [poolAddress, takerToken, makerToken, makerFillAmounts],
            { poolAddress },
        );
    }

    public async getBalancerSellQuotesAsync(
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): Promise<Array<Array<DexSample<BalancerFillData>>>> {
        const pools = await this.balancerPoolsCache.getPoolsForPairAsync(takerToken, makerToken);
        return pools.map(pool =>
            takerFillAmounts.map(amount => ({
                source: ERC20BridgeSource.Balancer,
                output: computeBalancerSellQuote(pool, amount),
                input: amount,
                fillData: { poolAddress: pool.id },
            })),
        );
    }

    public async getBalancerBuyQuotesAsync(
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
    ): Promise<Array<Array<DexSample<BalancerFillData>>>> {
        const pools = await this.balancerPoolsCache.getPoolsForPairAsync(takerToken, makerToken);
        return pools.map(pool =>
            makerFillAmounts.map(amount => ({
                source: ERC20BridgeSource.Balancer,
                output: computeBalancerBuyQuote(pool, amount),
                input: amount,
                fillData: { poolAddress: pool.id },
            })),
        );
    }

    public getMStableSellQuotes(
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.MStable,
            this._samplerContract.sampleSellsFromMStable,
            [takerToken, makerToken, takerFillAmounts],
        );
    }

    public getMStableBuyQuotes(
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.MStable,
            this._samplerContract.sampleBuysFromMStable,
            [takerToken, makerToken, makerFillAmounts],
        );
    }

    public async getBancorSellQuotesAsync(
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): Promise<Array<DexSample<BancorFillData>>> {
        if (this.bancorService === undefined) {
            throw new Error('Cannot sample liquidity from Bancor; no Bancor service instantiated.');
        }
        return Promise.all(
            takerFillAmounts.map(async amount => {
                const { amount: output, fillData } = await this.bancorService!.getQuoteAsync(
                    takerToken,
                    makerToken,
                    amount,
                );
                return {
                    source: ERC20BridgeSource.Bancor,
                    output,
                    input: amount,
                    fillData,
                };
            }),
        );
    }

    public getMooniswapSellQuotes(
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.Mooniswap,
            this._samplerContract.sampleSellsFromMooniswap,
            [takerToken, makerToken, takerFillAmounts],
        );
    }

    public getMooniswapBuyQuotes(
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return new SamplerContractOperation(
            this._samplerContract,
            ERC20BridgeSource.Mooniswap,
            this._samplerContract.sampleBuysFromMooniswap,
            [takerToken, makerToken, makerFillAmounts],
        );
    }

    public getTwoHopSellQuotes(
        sources: ERC20BridgeSource[],
        makerToken: string,
        takerToken: string,
        sellAmount: BigNumber,
        tokenAdjacencyGraph: TokenAdjacencyGraph,
        wethAddress: string,
        liquidityProviderRegistryAddress?: string,
    ): BatchedOperation<Array<DexSample<MultiHopFillData>>> {
        const intermediateTokens = getIntermediateTokens(makerToken, takerToken, tokenAdjacencyGraph, wethAddress);
        const subOps = intermediateTokens.map(intermediateToken => {
            const firstHopOps = this._getSellQuoteOperations(
                sources,
                intermediateToken,
                takerToken,
                [new BigNumber(0)],
                wethAddress,
                liquidityProviderRegistryAddress,
            );
            const secondHopOps = this._getSellQuoteOperations(
                sources,
                makerToken,
                intermediateToken,
                [new BigNumber(0)],
                wethAddress,
                liquidityProviderRegistryAddress,
            );
            const samplerOp = new SamplerContractOperation(
                this._samplerContract,
                ERC20BridgeSource.MultiHop,
                this._samplerContract.sampleTwoHopSell,
                [firstHopOps.map(op => op.encodeCall()), secondHopOps.map(op => op.encodeCall()), sellAmount],
                { intermediateToken } as MultiHopFillData, // tslint:disable-line:no-object-literal-type-assertion
                async (callResults: string): Promise<BigNumber[]> => {
                    const [firstHop, secondHop, buyAmount] = this._samplerContract.getABIDecodedReturnData<
                        [HopInfo, HopInfo, BigNumber]
                    >('sampleTwoHopSell', callResults);
                    samplerOp.fillData.firstHopSource = firstHopOps[firstHop.sourceIndex.toNumber()];
                    samplerOp.fillData.secondHopSource = secondHopOps[secondHop.sourceIndex.toNumber()];
                    await samplerOp.fillData.firstHopSource.handleCallResultsAsync(firstHop.returnData);
                    await samplerOp.fillData.secondHopSource.handleCallResultsAsync(secondHop.returnData);
                    return Promise.resolve([buyAmount]);
                },
            );
            return samplerOp;
        });
        return {
            encodeCall: () => {
                const subCalls = subOps.map(op => op.encodeCall());
                return this._samplerContract.batchCall(subCalls).getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async callResults => {
                const rawSubCallResults = this._samplerContract.getABIDecodedReturnData<string[]>(
                    'batchCall',
                    callResults,
                );
                return Promise.all(
                    subOps.map(async (op, i) => {
                        const [output] = await op.handleCallResultsAsync(rawSubCallResults[i]);
                        return {
                            source: op.source,
                            output,
                            input: sellAmount,
                            fillData: op.fillData,
                        };
                    }),
                );
            },
        };
    }

    public getTwoHopBuyQuotes(
        sources: ERC20BridgeSource[],
        makerToken: string,
        takerToken: string,
        buyAmount: BigNumber,
        tokenAdjacencyGraph: TokenAdjacencyGraph,
        wethAddress: string,
        liquidityProviderRegistryAddress?: string,
    ): BatchedOperation<Array<DexSample<MultiHopFillData>>> {
        const intermediateTokens = getIntermediateTokens(makerToken, takerToken, tokenAdjacencyGraph, wethAddress);
        const subOps = intermediateTokens.map(intermediateToken => {
            const firstHopOps = this._getBuyQuoteOperations(
                sources,
                intermediateToken,
                takerToken,
                [new BigNumber(0)],
                wethAddress,
                liquidityProviderRegistryAddress,
            );
            const secondHopOps = this._getBuyQuoteOperations(
                sources,
                makerToken,
                intermediateToken,
                [new BigNumber(0)],
                wethAddress,
                liquidityProviderRegistryAddress,
            );
            const samplerOp = new SamplerContractOperation(
                this._samplerContract,
                ERC20BridgeSource.MultiHop,
                this._samplerContract.sampleTwoHopBuy,
                [firstHopOps.map(op => op.encodeCall()), secondHopOps.map(op => op.encodeCall()), buyAmount],
                {} as MultiHopFillData, // tslint:disable-line:no-object-literal-type-assertion
                async (callResults: string): Promise<BigNumber[]> => {
                    const [firstHop, secondHop, sellAmount] = this._samplerContract.getABIDecodedReturnData<
                        [HopInfo, HopInfo, BigNumber]
                    >('sampleTwoHopBuy', callResults);
                    samplerOp.fillData.firstHopSource = firstHopOps[firstHop.sourceIndex.toNumber()];
                    samplerOp.fillData.secondHopSource = secondHopOps[secondHop.sourceIndex.toNumber()];
                    await samplerOp.fillData.firstHopSource.handleCallResultsAsync(firstHop.returnData);
                    await samplerOp.fillData.secondHopSource.handleCallResultsAsync(secondHop.returnData);
                    return Promise.resolve([sellAmount]);
                },
            );
            return samplerOp;
        });
        return {
            encodeCall: () => {
                const subCalls = subOps.map(op => op.encodeCall());
                return this._samplerContract.batchCall(subCalls).getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async callResults => {
                const rawSubCallResults = this._samplerContract.getABIDecodedReturnData<string[]>(
                    'batchCall',
                    callResults,
                );
                return Promise.all(
                    subOps.map(async (op, i) => {
                        const [output] = await op.handleCallResultsAsync(rawSubCallResults[i]);
                        return {
                            source: op.source,
                            output,
                            input: buyAmount,
                            fillData: op.fillData,
                        };
                    }),
                );
            },
        };
    }

    public getMedianSellRate(
        sources: ERC20BridgeSource[],
        makerToken: string,
        takerToken: string,
        takerFillAmount: BigNumber,
        wethAddress: string,
        liquidityProviderRegistryAddress?: string,
        multiBridgeAddress?: string,
    ): BatchedOperation<BigNumber> {
        if (makerToken.toLowerCase() === takerToken.toLowerCase()) {
            return SamplerOperations.constant(new BigNumber(1));
        }
        const getSellQuotes = this.getSellQuotes(
            sources,
            makerToken,
            takerToken,
            [takerFillAmount],
            wethAddress,
            liquidityProviderRegistryAddress,
            multiBridgeAddress,
        );
        return {
            encodeCall: () => {
                const encodedCall = getSellQuotes.encodeCall();
                // All soures were excluded
                if (encodedCall === NULL_BYTES) {
                    return NULL_BYTES;
                }
                return this._samplerContract.batchCall([encodedCall]).getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async callResults => {
                if (callResults === NULL_BYTES) {
                    return ZERO_AMOUNT;
                }
                const rawSubCallResults = this._samplerContract.getABIDecodedReturnData<string[]>(
                    'batchCall',
                    callResults,
                );
                const samples = await getSellQuotes.handleCallResultsAsync(rawSubCallResults[0]);
                if (samples.length === 0) {
                    return ZERO_AMOUNT;
                }
                const flatSortedSamples = samples
                    .reduce((acc, v) => acc.concat(...v))
                    .filter(v => !v.output.isZero())
                    .sort((a, b) => a.output.comparedTo(b.output));
                if (flatSortedSamples.length === 0) {
                    return ZERO_AMOUNT;
                }
                const medianSample = flatSortedSamples[Math.floor(flatSortedSamples.length / 2)];
                return medianSample.output.div(medianSample.input);
            },
        };
    }

    public getSellQuotes(
        sources: ERC20BridgeSource[],
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
        wethAddress: string,
        liquidityProviderRegistryAddress?: string,
        multiBridgeAddress?: string,
    ): BatchedOperation<DexSample[][]> {
        const subOps = this._getSellQuoteOperations(
            sources,
            makerToken,
            takerToken,
            takerFillAmounts,
            wethAddress,
            liquidityProviderRegistryAddress,
            multiBridgeAddress,
        );
        return {
            encodeCall: () => {
                const subCalls = subOps.map(op => op.encodeCall());
                return this._samplerContract.batchCall(subCalls).getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async callResults => {
                const rawSubCallResults = this._samplerContract.getABIDecodedReturnData<string[]>(
                    'batchCall',
                    callResults,
                );
                const samples = await Promise.all(
                    subOps.map(async (op, i) => op.handleCallResultsAsync(rawSubCallResults[i])),
                );
                return subOps.map((op, i) => {
                    return samples[i].map((output, j) => ({
                        source: op.source,
                        output: output,
                        input: takerFillAmounts[j],
                        fillData: op.fillData,
                    }));
                });
            },
        };
    }

    public getBuyQuotes(
        sources: ERC20BridgeSource[],
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
        wethAddress: string,
        liquidityProviderRegistryAddress?: string,
    ): BatchedOperation<DexSample[][]> {
        const subOps = this._getBuyQuoteOperations(
            sources,
            makerToken,
            takerToken,
            makerFillAmounts,
            wethAddress,
            liquidityProviderRegistryAddress,
        );
        return {
            encodeCall: () => {
                const subCalls = subOps.map(op => op.encodeCall());
                return this._samplerContract.batchCall(subCalls).getABIEncodedTransactionData();
            },
            handleCallResultsAsync: async callResults => {
                const rawSubCallResults = this._samplerContract.getABIDecodedReturnData<string[]>(
                    'batchCall',
                    callResults,
                );
                const samples = await Promise.all(
                    subOps.map(async (op, i) => op.handleCallResultsAsync(rawSubCallResults[i])),
                );
                return subOps.map((op, i) => {
                    return samples[i].map((output, j) => ({
                        source: op.source,
                        output: output,
                        input: makerFillAmounts[j],
                        fillData: op.fillData,
                    }));
                });
            },
        };
    }

    private _getSellQuoteOperations(
        sources: ERC20BridgeSource[],
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
        wethAddress: string,
        liquidityProviderRegistryAddress?: string,
        multiBridgeAddress?: string,
    ): SourceQuoteOperation[] {
        return _.flatten(
            sources.map(
                (source): SourceQuoteOperation | SourceQuoteOperation[] => {
                    switch (source) {
                        case ERC20BridgeSource.Eth2Dai:
                            return this.getEth2DaiSellQuotes(makerToken, takerToken, takerFillAmounts);
                        case ERC20BridgeSource.Uniswap:
                            return this.getUniswapSellQuotes(makerToken, takerToken, takerFillAmounts);
                        case ERC20BridgeSource.UniswapV2:
                            const ops = [this.getUniswapV2SellQuotes([takerToken, makerToken], takerFillAmounts)];
                            if (takerToken !== wethAddress && makerToken !== wethAddress) {
                                ops.push(
                                    this.getUniswapV2SellQuotes(
                                        [takerToken, wethAddress, makerToken],
                                        takerFillAmounts,
                                    ),
                                );
                            }
                            return ops;
                        case ERC20BridgeSource.Kyber:
                            return this.getKyberSellQuotes(makerToken, takerToken, takerFillAmounts);
                        case ERC20BridgeSource.Curve:
                            return getCurveInfosForPair(takerToken, makerToken).map(curve =>
                                this.getCurveSellQuotes(
                                    curve,
                                    curve.tokens.indexOf(takerToken),
                                    curve.tokens.indexOf(makerToken),
                                    takerFillAmounts,
                                ),
                            );
                        case ERC20BridgeSource.LiquidityProvider:
                            if (liquidityProviderRegistryAddress === undefined) {
                                throw new Error(
                                    'Cannot sample liquidity from a LiquidityProvider liquidity pool, if a registry is not provided.',
                                );
                            }
                            return this.getLiquidityProviderSellQuotes(
                                liquidityProviderRegistryAddress,
                                makerToken,
                                takerToken,
                                takerFillAmounts,
                            );
                        case ERC20BridgeSource.MultiBridge:
                            if (multiBridgeAddress === undefined) {
                                throw new Error(
                                    'Cannot sample liquidity from MultiBridge if an address is not provided.',
                                );
                            }
                            const intermediateToken = getMultiBridgeIntermediateToken(takerToken, makerToken);
                            return this.getMultiBridgeSellQuotes(
                                multiBridgeAddress,
                                makerToken,
                                intermediateToken,
                                takerToken,
                                takerFillAmounts,
                            );
                        case ERC20BridgeSource.MStable:
                            return this.getMStableSellQuotes(makerToken, takerToken, takerFillAmounts);
                        case ERC20BridgeSource.Mooniswap:
                            return this.getMooniswapSellQuotes(makerToken, takerToken, takerFillAmounts);
                        case ERC20BridgeSource.Balancer:
                            return this.balancerPoolsCache
                                .getCachedPoolAddressesForPair(takerToken, makerToken)
                                .map(poolAddress =>
                                    this.getBalancerSellQuotes(poolAddress, makerToken, takerToken, takerFillAmounts),
                                );
                        default:
                            throw new Error(`Unsupported sell sample source: ${source}`);
                    }
                },
            ),
        );
    }

    private _getBuyQuoteOperations(
        sources: ERC20BridgeSource[],
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
        wethAddress: string,
        liquidityProviderRegistryAddress?: string,
    ): SourceQuoteOperation[] {
        return _.flatten(
            sources.map(
                (source): SourceQuoteOperation | SourceQuoteOperation[] => {
                    switch (source) {
                        case ERC20BridgeSource.Eth2Dai:
                            return this.getEth2DaiBuyQuotes(makerToken, takerToken, makerFillAmounts);
                        case ERC20BridgeSource.Uniswap:
                            return this.getUniswapBuyQuotes(makerToken, takerToken, makerFillAmounts);
                        case ERC20BridgeSource.UniswapV2:
                            const ops = [this.getUniswapV2BuyQuotes([takerToken, makerToken], makerFillAmounts)];
                            if (takerToken !== wethAddress && makerToken !== wethAddress) {
                                ops.push(
                                    this.getUniswapV2BuyQuotes([takerToken, wethAddress, makerToken], makerFillAmounts),
                                );
                            }
                            return ops;
                        case ERC20BridgeSource.Kyber:
                            return this.getKyberBuyQuotes(makerToken, takerToken, makerFillAmounts);
                        case ERC20BridgeSource.Curve:
                            return getCurveInfosForPair(takerToken, makerToken).map(curve =>
                                this.getCurveBuyQuotes(
                                    curve,
                                    curve.tokens.indexOf(takerToken),
                                    curve.tokens.indexOf(makerToken),
                                    makerFillAmounts,
                                ),
                            );
                        case ERC20BridgeSource.LiquidityProvider:
                            if (liquidityProviderRegistryAddress === undefined) {
                                throw new Error(
                                    'Cannot sample liquidity from a LiquidityProvider liquidity pool, if a registry is not provided.',
                                );
                            }
                            return this.getLiquidityProviderBuyQuotes(
                                liquidityProviderRegistryAddress,
                                makerToken,
                                takerToken,
                                makerFillAmounts,
                            );
                        case ERC20BridgeSource.MStable:
                            return this.getMStableBuyQuotes(makerToken, takerToken, makerFillAmounts);
                        case ERC20BridgeSource.Mooniswap:
                            return this.getMooniswapBuyQuotes(makerToken, takerToken, makerFillAmounts);
                        case ERC20BridgeSource.Balancer:
                            return this.balancerPoolsCache
                                .getCachedPoolAddressesForPair(takerToken, makerToken)
                                .map(poolAddress =>
                                    this.getBalancerBuyQuotes(poolAddress, makerToken, takerToken, makerFillAmounts),
                                );
                        default:
                            throw new Error(`Unsupported buy sample source: ${source}`);
                    }
                },
            ),
        );
    }
}
// tslint:disable max-file-line-count
