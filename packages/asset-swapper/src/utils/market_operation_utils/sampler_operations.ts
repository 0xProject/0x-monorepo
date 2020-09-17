import { SupportedProvider } from '@0x/dev-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { ERC20BridgeSamplerContract } from '../../wrappers';

import { BalancerPoolsCache, computeBalancerBuyQuote, computeBalancerSellQuote } from './balancer_utils';
import { BancorService } from './bancor_service';
import { MAINNET_SUSHI_SWAP_ROUTER, MAX_UINT256, NULL_BYTES, ZERO_AMOUNT } from './constants';
import { getCurveInfosForPair, getSwerveInfosForPair } from './curve_utils';
import { getKyberReserveIdsForPair } from './kyber_utils';
import { getMultiBridgeIntermediateToken } from './multibridge_utils';
import { getIntermediateTokens } from './multihop_utils';
import { SamplerContractOperation } from './sampler_contract_operation';
import { SourceFilters } from './source_filters';
import {
    BalancerFillData,
    BancorFillData,
    BatchedOperation,
    CurveFillData,
    CurveInfo,
    DexSample,
    ERC20BridgeSource,
    HopInfo,
    KyberFillData,
    LiquidityProviderFillData,
    MooniswapFillData,
    MultiBridgeFillData,
    MultiHopFillData,
    SourceQuoteOperation,
    SushiSwapFillData,
    SwerveFillData,
    SwerveInfo,
    TokenAdjacencyGraph,
    UniswapV2FillData,
} from './types';

/**
 * Source filters for `getTwoHopBuyQuotes()` and `getTwoHopSellQuotes()`.
 */
export const TWO_HOP_SOURCE_FILTERS = SourceFilters.all().exclude([
    ERC20BridgeSource.MultiHop,
    ERC20BridgeSource.MultiBridge,
    ERC20BridgeSource.Native,
]);
/**
 * Source filters for `getSellQuotes()` and `getBuyQuotes()`.
 */
export const BATCH_SOURCE_FILTERS = SourceFilters.all().exclude([ERC20BridgeSource.MultiHop, ERC20BridgeSource.Native]);

// tslint:disable:no-inferred-empty-object-type no-unbound-method

/**
 * Composable operations that can be batched in a single transaction,
 * for use with `DexOrderSampler.executeAsync()`.
 */
export class SamplerOperations {
    protected _bancorService?: BancorService;
    public static constant<T>(result: T): BatchedOperation<T> {
        return {
            encodeCall: () => {
                return '0x';
            },
            handleCallResults: _callResults => {
                return result;
            },
        };
    }

    constructor(
        protected readonly _samplerContract: ERC20BridgeSamplerContract,
        public readonly provider?: SupportedProvider,
        public readonly balancerPoolsCache: BalancerPoolsCache = new BalancerPoolsCache(),
        protected readonly getBancorServiceFn?: () => BancorService, // for dependency injection in tests
    ) {}

    public async getBancorServiceAsync(): Promise<BancorService> {
        if (this.getBancorServiceFn !== undefined) {
            return this.getBancorServiceFn();
        }
        if (this.provider === undefined) {
            throw new Error('Cannot sample liquidity from Bancor; no provider supplied.');
        }
        if (this._bancorService === undefined) {
            this._bancorService = await BancorService.createAsync(this.provider);
        }
        return this._bancorService;
    }

    public getOrderFillableTakerAmounts(orders: SignedOrder[], exchangeAddress: string): BatchedOperation<BigNumber[]> {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.Native,
            contract: this._samplerContract,
            function: this._samplerContract.getOrderFillableTakerAssetAmounts,
            params: [orders, orders.map(o => o.signature), exchangeAddress],
        });
    }

    public getOrderFillableMakerAmounts(orders: SignedOrder[], exchangeAddress: string): BatchedOperation<BigNumber[]> {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.Native,
            contract: this._samplerContract,
            function: this._samplerContract.getOrderFillableMakerAssetAmounts,
            params: [orders, orders.map(o => o.signature), exchangeAddress],
        });
    }

    public getKyberSellQuotes(
        reserveId: string,
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.Kyber,
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromKyberNetwork,
            params: [reserveId, takerToken, makerToken, takerFillAmounts],
            callback: (callResults: string, fillData: KyberFillData): BigNumber[] => {
                const [hint, samples] = this._samplerContract.getABIDecodedReturnData<[string, BigNumber[]]>(
                    'sampleSellsFromKyberNetwork',
                    callResults,
                );
                fillData.hint = hint;
                fillData.reserveId = reserveId;
                return samples;
            },
        });
    }

    public getKyberBuyQuotes(
        reserveId: string,
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.Kyber,
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromKyberNetwork,
            params: [reserveId, takerToken, makerToken, makerFillAmounts],
            callback: (callResults: string, fillData: KyberFillData): BigNumber[] => {
                const [hint, samples] = this._samplerContract.getABIDecodedReturnData<[string, BigNumber[]]>(
                    'sampleBuysFromKyberNetwork',
                    callResults,
                );
                fillData.hint = hint;
                fillData.reserveId = reserveId;
                return samples;
            },
        });
    }

    public getUniswapSellQuotes(
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.Uniswap,
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromUniswap,
            params: [takerToken, makerToken, takerFillAmounts],
        });
    }

    public getUniswapBuyQuotes(
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.Uniswap,
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromUniswap,
            params: [takerToken, makerToken, makerFillAmounts],
        });
    }

    public getUniswapV2SellQuotes(
        tokenAddressPath: string[],
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<UniswapV2FillData> {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.UniswapV2,
            fillData: { tokenAddressPath },
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromUniswapV2,
            params: [tokenAddressPath, takerFillAmounts],
        });
    }

    public getUniswapV2BuyQuotes(
        tokenAddressPath: string[],
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<UniswapV2FillData> {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.UniswapV2,
            fillData: { tokenAddressPath },
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromUniswapV2,
            params: [tokenAddressPath, makerFillAmounts],
        });
    }

    public getLiquidityProviderSellQuotes(
        registryAddress: string,
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<LiquidityProviderFillData> {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.LiquidityProvider,
            fillData: {} as LiquidityProviderFillData, // tslint:disable-line:no-object-literal-type-assertion
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromLiquidityProviderRegistry,
            params: [registryAddress, takerToken, makerToken, takerFillAmounts],
            callback: (callResults: string, fillData: LiquidityProviderFillData): BigNumber[] => {
                const [samples, poolAddress] = this._samplerContract.getABIDecodedReturnData<[BigNumber[], string]>(
                    'sampleSellsFromLiquidityProviderRegistry',
                    callResults,
                );
                fillData.poolAddress = poolAddress;
                return samples;
            },
        });
    }

    public getLiquidityProviderBuyQuotes(
        registryAddress: string,
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<LiquidityProviderFillData> {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.LiquidityProvider,
            fillData: {} as LiquidityProviderFillData, // tslint:disable-line:no-object-literal-type-assertion
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromLiquidityProviderRegistry,
            params: [registryAddress, takerToken, makerToken, makerFillAmounts],
            callback: (callResults: string, fillData: LiquidityProviderFillData): BigNumber[] => {
                const [samples, poolAddress] = this._samplerContract.getABIDecodedReturnData<[BigNumber[], string]>(
                    'sampleBuysFromLiquidityProviderRegistry',
                    callResults,
                );
                fillData.poolAddress = poolAddress;
                return samples;
            },
        });
    }

    public getMultiBridgeSellQuotes(
        multiBridgeAddress: string,
        makerToken: string,
        intermediateToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<MultiBridgeFillData> {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.MultiBridge,
            fillData: { poolAddress: multiBridgeAddress },
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromMultiBridge,
            params: [multiBridgeAddress, takerToken, intermediateToken, makerToken, takerFillAmounts],
        });
    }

    public getEth2DaiSellQuotes(
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.Eth2Dai,
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromEth2Dai,
            params: [takerToken, makerToken, takerFillAmounts],
        });
    }

    public getEth2DaiBuyQuotes(
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.Eth2Dai,
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromEth2Dai,
            params: [takerToken, makerToken, makerFillAmounts],
        });
    }

    public getCurveSellQuotes(
        curve: CurveInfo,
        fromTokenIdx: number,
        toTokenIdx: number,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<CurveFillData> {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.Curve,
            fillData: {
                curve,
                fromTokenIdx,
                toTokenIdx,
            },
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromCurve,
            params: [
                {
                    poolAddress: curve.poolAddress,
                    sellQuoteFunctionSelector: curve.sellQuoteFunctionSelector,
                    buyQuoteFunctionSelector: curve.buyQuoteFunctionSelector,
                },
                new BigNumber(fromTokenIdx),
                new BigNumber(toTokenIdx),
                takerFillAmounts,
            ],
        });
    }

    public getCurveBuyQuotes(
        curve: CurveInfo,
        fromTokenIdx: number,
        toTokenIdx: number,
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<CurveFillData> {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.Curve,
            fillData: {
                curve,
                fromTokenIdx,
                toTokenIdx,
            },
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromCurve,
            params: [
                {
                    poolAddress: curve.poolAddress,
                    sellQuoteFunctionSelector: curve.sellQuoteFunctionSelector,
                    buyQuoteFunctionSelector: curve.buyQuoteFunctionSelector,
                },
                new BigNumber(fromTokenIdx),
                new BigNumber(toTokenIdx),
                makerFillAmounts,
            ],
        });
    }

    public getSwerveSellQuotes(
        pool: SwerveInfo,
        fromTokenIdx: number,
        toTokenIdx: number,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<SwerveFillData> {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.Swerve,
            fillData: {
                pool,
                fromTokenIdx,
                toTokenIdx,
            },
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromCurve,
            params: [
                {
                    poolAddress: pool.poolAddress,
                    sellQuoteFunctionSelector: pool.sellQuoteFunctionSelector,
                    buyQuoteFunctionSelector: pool.buyQuoteFunctionSelector,
                },
                new BigNumber(fromTokenIdx),
                new BigNumber(toTokenIdx),
                takerFillAmounts,
            ],
        });
    }

    public getSwerveBuyQuotes(
        pool: SwerveInfo,
        fromTokenIdx: number,
        toTokenIdx: number,
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<SwerveFillData> {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.Swerve,
            fillData: {
                pool,
                fromTokenIdx,
                toTokenIdx,
            },
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromCurve,
            params: [
                {
                    poolAddress: pool.poolAddress,
                    sellQuoteFunctionSelector: pool.sellQuoteFunctionSelector,
                    buyQuoteFunctionSelector: pool.buyQuoteFunctionSelector,
                },
                new BigNumber(fromTokenIdx),
                new BigNumber(toTokenIdx),
                makerFillAmounts,
            ],
        });
    }

    public getBalancerSellQuotes(
        poolAddress: string,
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<BalancerFillData> {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.Balancer,
            fillData: { poolAddress },
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromBalancer,
            params: [poolAddress, takerToken, makerToken, takerFillAmounts],
        });
    }

    public getBalancerBuyQuotes(
        poolAddress: string,
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<BalancerFillData> {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.Balancer,
            fillData: { poolAddress },
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromBalancer,
            params: [poolAddress, takerToken, makerToken, makerFillAmounts],
        });
    }

    public async getBalancerSellQuotesOffChainAsync(
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

    public async getBalancerBuyQuotesOffChainAsync(
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
        return new SamplerContractOperation({
            source: ERC20BridgeSource.MStable,
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromMStable,
            params: [takerToken, makerToken, takerFillAmounts],
        });
    }

    public getMStableBuyQuotes(
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.MStable,
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromMStable,
            params: [takerToken, makerToken, makerFillAmounts],
        });
    }

    public async getBancorSellQuotesOffChainAsync(
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): Promise<Array<DexSample<BancorFillData>>> {
        const bancorService = await this.getBancorServiceAsync();
        try {
            const quotes = await bancorService.getQuotesAsync(takerToken, makerToken, takerFillAmounts);
            return quotes.map((quote, i) => ({
                source: ERC20BridgeSource.Bancor,
                output: quote.amount,
                input: takerFillAmounts[i],
                fillData: quote.fillData,
            }));
        } catch (e) {
            return takerFillAmounts.map(input => ({
                source: ERC20BridgeSource.Bancor,
                output: ZERO_AMOUNT,
                input,
                fillData: { path: [], networkAddress: '' },
            }));
        }
    }

    public getMooniswapSellQuotes(
        makerToken: string,
        takerToken: string,
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.Mooniswap,
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromMooniswap,
            params: [takerToken, makerToken, takerFillAmounts],
            callback: (callResults: string, fillData: MooniswapFillData): BigNumber[] => {
                const [poolAddress, samples] = this._samplerContract.getABIDecodedReturnData<[string, BigNumber[]]>(
                    'sampleSellsFromMooniswap',
                    callResults,
                );
                fillData.poolAddress = poolAddress;
                return samples;
            },
        });
    }

    public getMooniswapBuyQuotes(
        makerToken: string,
        takerToken: string,
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.Mooniswap,
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromMooniswap,
            params: [takerToken, makerToken, makerFillAmounts],
            callback: (callResults: string, fillData: MooniswapFillData): BigNumber[] => {
                const [poolAddress, samples] = this._samplerContract.getABIDecodedReturnData<[string, BigNumber[]]>(
                    'sampleBuysFromMooniswap',
                    callResults,
                );
                fillData.poolAddress = poolAddress;
                return samples;
            },
        });
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
        const _sources = TWO_HOP_SOURCE_FILTERS.getAllowed(sources);
        if (_sources.length === 0) {
            return SamplerOperations.constant([]);
        }
        const intermediateTokens = getIntermediateTokens(makerToken, takerToken, tokenAdjacencyGraph, wethAddress);
        const subOps = intermediateTokens.map(intermediateToken => {
            const firstHopOps = this._getSellQuoteOperations(
                _sources,
                intermediateToken,
                takerToken,
                [ZERO_AMOUNT],
                wethAddress,
                liquidityProviderRegistryAddress,
            );
            const secondHopOps = this._getSellQuoteOperations(
                _sources,
                makerToken,
                intermediateToken,
                [ZERO_AMOUNT],
                wethAddress,
                liquidityProviderRegistryAddress,
            );
            return new SamplerContractOperation({
                contract: this._samplerContract,
                source: ERC20BridgeSource.MultiHop,
                function: this._samplerContract.sampleTwoHopSell,
                params: [firstHopOps.map(op => op.encodeCall()), secondHopOps.map(op => op.encodeCall()), sellAmount],
                fillData: { intermediateToken } as MultiHopFillData, // tslint:disable-line:no-object-literal-type-assertion
                callback: (callResults: string, fillData: MultiHopFillData): BigNumber[] => {
                    const [firstHop, secondHop, buyAmount] = this._samplerContract.getABIDecodedReturnData<
                        [HopInfo, HopInfo, BigNumber]
                    >('sampleTwoHopSell', callResults);
                    if (buyAmount.isZero()) {
                        return [ZERO_AMOUNT];
                    }
                    fillData.firstHopSource = firstHopOps[firstHop.sourceIndex.toNumber()];
                    fillData.secondHopSource = secondHopOps[secondHop.sourceIndex.toNumber()];
                    fillData.firstHopSource.handleCallResults(firstHop.returnData);
                    fillData.secondHopSource.handleCallResults(secondHop.returnData);
                    return [buyAmount];
                },
            });
        });
        return {
            encodeCall: () => {
                const subCalls = subOps.map(op => op.encodeCall());
                return this._samplerContract.batchCall(subCalls).getABIEncodedTransactionData();
            },
            handleCallResults: callResults => {
                const rawSubCallResults = this._samplerContract.getABIDecodedReturnData<string[]>(
                    'batchCall',
                    callResults,
                );
                return subOps.map((op, i) => {
                    const [output] = op.handleCallResults(rawSubCallResults[i]);
                    return {
                        source: op.source,
                        output,
                        input: sellAmount,
                        fillData: op.fillData,
                    };
                });
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
        const _sources = TWO_HOP_SOURCE_FILTERS.getAllowed(sources);
        if (_sources.length === 0) {
            return SamplerOperations.constant([]);
        }
        const intermediateTokens = getIntermediateTokens(makerToken, takerToken, tokenAdjacencyGraph, wethAddress);
        const subOps = intermediateTokens.map(intermediateToken => {
            const firstHopOps = this._getBuyQuoteOperations(
                _sources,
                intermediateToken,
                takerToken,
                [new BigNumber(0)],
                wethAddress,
                liquidityProviderRegistryAddress,
            );
            const secondHopOps = this._getBuyQuoteOperations(
                _sources,
                makerToken,
                intermediateToken,
                [new BigNumber(0)],
                wethAddress,
                liquidityProviderRegistryAddress,
            );
            return new SamplerContractOperation({
                contract: this._samplerContract,
                source: ERC20BridgeSource.MultiHop,
                function: this._samplerContract.sampleTwoHopBuy,
                params: [firstHopOps.map(op => op.encodeCall()), secondHopOps.map(op => op.encodeCall()), buyAmount],
                fillData: { intermediateToken } as MultiHopFillData, // tslint:disable-line:no-object-literal-type-assertion
                callback: (callResults: string, fillData: MultiHopFillData): BigNumber[] => {
                    const [firstHop, secondHop, sellAmount] = this._samplerContract.getABIDecodedReturnData<
                        [HopInfo, HopInfo, BigNumber]
                    >('sampleTwoHopBuy', callResults);
                    if (sellAmount.isEqualTo(MAX_UINT256)) {
                        return [sellAmount];
                    }
                    fillData.firstHopSource = firstHopOps[firstHop.sourceIndex.toNumber()];
                    fillData.secondHopSource = secondHopOps[secondHop.sourceIndex.toNumber()];
                    fillData.firstHopSource.handleCallResults(firstHop.returnData);
                    fillData.secondHopSource.handleCallResults(secondHop.returnData);
                    return [sellAmount];
                },
            });
        });
        return {
            encodeCall: () => {
                const subCalls = subOps.map(op => op.encodeCall());
                return this._samplerContract.batchCall(subCalls).getABIEncodedTransactionData();
            },
            handleCallResults: callResults => {
                const rawSubCallResults = this._samplerContract.getABIDecodedReturnData<string[]>(
                    'batchCall',
                    callResults,
                );
                return subOps.map((op, i) => {
                    const [output] = op.handleCallResults(rawSubCallResults[i]);
                    return {
                        source: op.source,
                        output,
                        input: buyAmount,
                        fillData: op.fillData,
                    };
                });
            },
        };
    }

    public getSushiSwapSellQuotes(
        tokenAddressPath: string[],
        takerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<SushiSwapFillData> {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.SushiSwap,
            fillData: { tokenAddressPath, router: MAINNET_SUSHI_SWAP_ROUTER },
            contract: this._samplerContract,
            function: this._samplerContract.sampleSellsFromSushiSwap,
            params: [MAINNET_SUSHI_SWAP_ROUTER, tokenAddressPath, takerFillAmounts],
        });
    }

    public getSushiSwapBuyQuotes(
        tokenAddressPath: string[],
        makerFillAmounts: BigNumber[],
    ): SourceQuoteOperation<SushiSwapFillData> {
        return new SamplerContractOperation({
            source: ERC20BridgeSource.SushiSwap,
            fillData: { tokenAddressPath, router: MAINNET_SUSHI_SWAP_ROUTER },
            contract: this._samplerContract,
            function: this._samplerContract.sampleBuysFromSushiSwap,
            params: [MAINNET_SUSHI_SWAP_ROUTER, tokenAddressPath, makerFillAmounts],
        });
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
            handleCallResults: callResults => {
                if (callResults === NULL_BYTES) {
                    return ZERO_AMOUNT;
                }
                const rawSubCallResults = this._samplerContract.getABIDecodedReturnData<string[]>(
                    'batchCall',
                    callResults,
                );
                const samples = getSellQuotes.handleCallResults(rawSubCallResults[0]);
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
        const _sources = BATCH_SOURCE_FILTERS.getAllowed(sources);
        const subOps = this._getSellQuoteOperations(
            _sources,
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
            handleCallResults: callResults => {
                const rawSubCallResults = this._samplerContract.getABIDecodedReturnData<string[]>(
                    'batchCall',
                    callResults,
                );
                const samples = subOps.map((op, i) => op.handleCallResults(rawSubCallResults[i]));
                return subOps.map((op, i) => {
                    return samples[i].map((output, j) => ({
                        source: op.source,
                        output,
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
        const _sources = BATCH_SOURCE_FILTERS.getAllowed(sources);
        const subOps = this._getBuyQuoteOperations(
            _sources,
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
            handleCallResults: callResults => {
                const rawSubCallResults = this._samplerContract.getABIDecodedReturnData<string[]>(
                    'batchCall',
                    callResults,
                );
                const samples = subOps.map((op, i) => op.handleCallResults(rawSubCallResults[i]));
                return subOps.map((op, i) => {
                    return samples[i].map((output, j) => ({
                        source: op.source,
                        output,
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
                        case ERC20BridgeSource.SushiSwap:
                            const sushiOps = [this.getSushiSwapSellQuotes([takerToken, makerToken], takerFillAmounts)];
                            if (takerToken !== wethAddress && makerToken !== wethAddress) {
                                sushiOps.push(
                                    this.getSushiSwapSellQuotes(
                                        [takerToken, wethAddress, makerToken],
                                        takerFillAmounts,
                                    ),
                                );
                            }
                            return sushiOps;
                        case ERC20BridgeSource.Kyber:
                            return getKyberReserveIdsForPair(takerToken, makerToken).map(reserveId =>
                                this.getKyberSellQuotes(reserveId, makerToken, takerToken, takerFillAmounts),
                            );
                        case ERC20BridgeSource.Curve:
                            return getCurveInfosForPair(takerToken, makerToken).map(curve =>
                                this.getCurveSellQuotes(
                                    curve,
                                    curve.tokens.indexOf(takerToken),
                                    curve.tokens.indexOf(makerToken),
                                    takerFillAmounts,
                                ),
                            );
                        case ERC20BridgeSource.Swerve:
                            return getSwerveInfosForPair(takerToken, makerToken).map(pool =>
                                this.getSwerveSellQuotes(
                                    pool,
                                    pool.tokens.indexOf(takerToken),
                                    pool.tokens.indexOf(makerToken),
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
                                .getCachedPoolAddressesForPair(takerToken, makerToken)!
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
                        case ERC20BridgeSource.SushiSwap:
                            const sushiOps = [this.getSushiSwapBuyQuotes([takerToken, makerToken], makerFillAmounts)];
                            if (takerToken !== wethAddress && makerToken !== wethAddress) {
                                sushiOps.push(
                                    this.getSushiSwapBuyQuotes([takerToken, wethAddress, makerToken], makerFillAmounts),
                                );
                            }
                            return sushiOps;
                        case ERC20BridgeSource.Kyber:
                            return getKyberReserveIdsForPair(takerToken, makerToken).map(reserveId =>
                                this.getKyberBuyQuotes(reserveId, makerToken, takerToken, makerFillAmounts),
                            );
                        case ERC20BridgeSource.Curve:
                            return getCurveInfosForPair(takerToken, makerToken).map(curve =>
                                this.getCurveBuyQuotes(
                                    curve,
                                    curve.tokens.indexOf(takerToken),
                                    curve.tokens.indexOf(makerToken),
                                    makerFillAmounts,
                                ),
                            );
                        case ERC20BridgeSource.Swerve:
                            return getSwerveInfosForPair(takerToken, makerToken).map(pool =>
                                this.getSwerveBuyQuotes(
                                    pool,
                                    pool.tokens.indexOf(takerToken),
                                    pool.tokens.indexOf(makerToken),
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
                                .getCachedPoolAddressesForPair(takerToken, makerToken)!
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
