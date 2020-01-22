import { ContractAddresses } from '@0x/contract-addresses';
import { IERC20BridgeSamplerContract } from '@0x/contract-wrappers';
import { assetDataUtils, ERC20AssetData, orderCalculationUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { constants } from '../../constants';
import { MarketOperation, SignedOrderWithFillableAmounts } from '../../types';
import { fillableAmountsUtils } from '../fillable_amounts_utils';

import { constants as marketOperationUtilConstants } from './constants';
import { CreateOrderUtils } from './create_order';
import { comparePathOutputs, FillsOptimizer, getPathOutput } from './fill_optimizer';
import { DexOrderSampler } from './sampler';
import {
    AggregationError,
    CollapsedFill,
    DexSample,
    ERC20BridgeSource,
    Fill,
    FillData,
    FillFlags,
    GetMarketOrdersOpts,
    NativeCollapsedFill,
    NativeFillData,
    OptimizedMarketOrder,
    OrderDomain,
} from './types';

const { ZERO_AMOUNT } = constants;
const { BUY_SOURCES, DEFAULT_GET_MARKET_ORDERS_OPTS, ERC20_PROXY_ID, SELL_SOURCES } = marketOperationUtilConstants;

export class MarketOperationUtils {
    private readonly _dexSampler: DexOrderSampler;
    private readonly _createOrderUtils: CreateOrderUtils;
    private readonly _orderDomain: OrderDomain;

    constructor(
        samplerContract: IERC20BridgeSamplerContract,
        contractAddresses: ContractAddresses,
        orderDomain: OrderDomain,
    ) {
        this._dexSampler = new DexOrderSampler(samplerContract);
        this._createOrderUtils = new CreateOrderUtils(contractAddresses);
        this._orderDomain = orderDomain;
    }

    /**
     * gets the orders required for a market sell operation by (potentially) merging native orders with
     * generated bridge orders.
     * @param nativeOrders Native orders.
     * @param takerAmount Amount of taker asset to sell.
     * @param opts Options object.
     * @return orders.
     */
    public async getMarketSellOrdersAsync(
        nativeOrders: SignedOrder[],
        takerAmount: BigNumber,
        opts?: Partial<GetMarketOrdersOpts>,
    ): Promise<OptimizedMarketOrder[]> {
        if (nativeOrders.length === 0) {
            throw new Error(AggregationError.EmptyOrders);
        }
        const _opts = {
            ...DEFAULT_GET_MARKET_ORDERS_OPTS,
            ...opts,
        };
        const [fillableAmounts, dexQuotes] = await this._dexSampler.getFillableAmountsAndSampleMarketSellAsync(
            nativeOrders,
            DexOrderSampler.getSampleAmounts(takerAmount, _opts.numSamples, _opts.sampleDistributionBase),
            difference(SELL_SOURCES, _opts.excludedSources),
        );
        const nativeOrdersWithFillableAmounts = createSignedOrdersWithFillableAmounts(
            nativeOrders,
            fillableAmounts,
            MarketOperation.Sell,
        );

        const prunedNativePath = pruneDustFillsFromNativePath(
            createSellPathFromNativeOrders(nativeOrdersWithFillableAmounts),
            takerAmount,
            _opts.dustFractionThreshold,
        );
        const clippedNativePath = clipPathToInput(sortFillsByPrice(prunedNativePath), takerAmount);
        const dexPaths = createPathsFromDexQuotes(dexQuotes, _opts.noConflicts);
        const allPaths = [...dexPaths];
        const allFills = flattenDexPaths(dexPaths);
        // If native orders are allowed, splice them in.
        if (!_opts.excludedSources.includes(ERC20BridgeSource.Native)) {
            allPaths.splice(0, 0, clippedNativePath);
            allFills.splice(0, 0, ...clippedNativePath);
        }

        const optimizer = new FillsOptimizer(_opts.runLimit);
        const upperBoundPath = pickBestUpperBoundPath(allPaths, takerAmount);
        const optimalPath = optimizer.optimize(
            // Sorting the orders by price effectively causes the optimizer to walk
            // the greediest solution first, which is the optimal solution in most
            // cases.
            sortFillsByPrice(allFills),
            takerAmount,
            upperBoundPath,
        );
        if (!optimalPath) {
            throw new Error(AggregationError.NoOptimalPath);
        }
        const [outputToken, inputToken] = getOrderTokens(nativeOrders[0]);
        return this._createOrderUtils.createSellOrdersFromPath(
            this._orderDomain,
            inputToken,
            outputToken,
            collapsePath(optimalPath, false),
            _opts.bridgeSlippage,
        );
    }

    /**
     * gets the orders required for a market buy operation by (potentially) merging native orders with
     * generated bridge orders.
     * @param nativeOrders Native orders.
     * @param makerAmount Amount of maker asset to buy.
     * @param opts Options object.
     * @return orders.
     */
    public async getMarketBuyOrdersAsync(
        nativeOrders: SignedOrder[],
        makerAmount: BigNumber,
        opts?: Partial<GetMarketOrdersOpts>,
    ): Promise<OptimizedMarketOrder[]> {
        if (nativeOrders.length === 0) {
            throw new Error(AggregationError.EmptyOrders);
        }
        const _opts = {
            ...DEFAULT_GET_MARKET_ORDERS_OPTS,
            ...opts,
        };

        const [fillableAmounts, dexQuotes] = await this._dexSampler.getFillableAmountsAndSampleMarketBuyAsync(
            nativeOrders,
            DexOrderSampler.getSampleAmounts(makerAmount, _opts.numSamples, _opts.sampleDistributionBase),
            difference(BUY_SOURCES, _opts.excludedSources),
        );
        const signedOrderWithFillableAmounts = this._createBuyOrdersPathFromSamplerResultIfExists(
            nativeOrders,
            makerAmount,
            fillableAmounts,
            dexQuotes,
            _opts,
        );
        if (!signedOrderWithFillableAmounts) {
            throw new Error(AggregationError.NoOptimalPath);
        }
        return signedOrderWithFillableAmounts;
    }

    /**
     * gets the orders required for a batch of market buy operations by (potentially) merging native orders with
     * generated bridge orders.
     * @param batchNativeOrders Batch of Native orders.
     * @param makerAmounts Array amount of maker asset to buy for each batch.
     * @param opts Options object.
     * @return orders.
     */
    public async getBatchMarketBuyOrdersAsync(
        batchNativeOrders: SignedOrder[][],
        makerAmounts: BigNumber[],
        opts?: Partial<GetMarketOrdersOpts>,
    ): Promise<Array<OptimizedMarketOrder[] | undefined>> {
        if (batchNativeOrders.length === 0) {
            throw new Error(AggregationError.EmptyOrders);
        }
        const _opts = {
            ...DEFAULT_GET_MARKET_ORDERS_OPTS,
            ...opts,
        };

        const batchSampleResults = await this._dexSampler.getBatchFillableAmountsAndSampleMarketBuyAsync(
            batchNativeOrders,
            makerAmounts.map(makerAmount => DexOrderSampler.getSampleAmounts(makerAmount, _opts.numSamples)),
            difference(BUY_SOURCES, _opts.excludedSources),
        );
        return batchSampleResults.map(([fillableAmounts, dexQuotes], i) =>
            this._createBuyOrdersPathFromSamplerResultIfExists(
                batchNativeOrders[i],
                makerAmounts[i],
                fillableAmounts,
                dexQuotes,
                _opts,
            ),
        );
    }

    private _createBuyOrdersPathFromSamplerResultIfExists(
        nativeOrders: SignedOrder[],
        makerAmount: BigNumber,
        nativeOrderFillableAmounts: BigNumber[],
        dexQuotes: DexSample[][],
        opts: GetMarketOrdersOpts,
    ): OptimizedMarketOrder[] | undefined {
        const nativeOrdersWithFillableAmounts = createSignedOrdersWithFillableAmounts(
            nativeOrders,
            nativeOrderFillableAmounts,
            MarketOperation.Buy,
        );
        const prunedNativePath = pruneDustFillsFromNativePath(
            createBuyPathFromNativeOrders(nativeOrdersWithFillableAmounts),
            makerAmount,
            opts.dustFractionThreshold,
        );
        const clippedNativePath = clipPathToInput(sortFillsByPrice(prunedNativePath).reverse(), makerAmount);
        const dexPaths = createPathsFromDexQuotes(dexQuotes, opts.noConflicts);
        const allPaths = [...dexPaths];
        const allFills = flattenDexPaths(dexPaths);
        // If native orders are allowed, splice them in.
        if (!opts.excludedSources.includes(ERC20BridgeSource.Native)) {
            allPaths.splice(0, 0, clippedNativePath);
            allFills.splice(0, 0, ...clippedNativePath);
        }
        const optimizer = new FillsOptimizer(opts.runLimit, true);
        const upperBoundPath = pickBestUpperBoundPath(allPaths, makerAmount, true);
        const optimalPath = optimizer.optimize(
            // Sorting the orders by price effectively causes the optimizer to walk
            // the greediest solution first, which is the optimal solution in most
            // cases.
            sortFillsByPrice(allFills),
            makerAmount,
            upperBoundPath,
        );
        if (!optimalPath) {
            return undefined;
        }
        const [inputToken, outputToken] = getOrderTokens(nativeOrders[0]);
        return this._createOrderUtils.createBuyOrdersFromPath(
            this._orderDomain,
            inputToken,
            outputToken,
            collapsePath(optimalPath, true),
            opts.bridgeSlippage,
        );
    }
}

function createSignedOrdersWithFillableAmounts(
    signedOrders: SignedOrder[],
    fillableAmounts: BigNumber[],
    operation: MarketOperation,
): SignedOrderWithFillableAmounts[] {
    return signedOrders
        .map((order: SignedOrder, i: number) => {
            const fillableAmount = fillableAmounts[i];
            const fillableMakerAssetAmount =
                operation === MarketOperation.Buy
                    ? fillableAmount
                    : orderCalculationUtils.getMakerFillAmount(order, fillableAmount);
            const fillableTakerAssetAmount =
                operation === MarketOperation.Sell
                    ? fillableAmount
                    : orderCalculationUtils.getTakerFillAmount(order, fillableAmount);
            const fillableTakerFeeAmount = orderCalculationUtils.getTakerFeeAmount(order, fillableTakerAssetAmount);
            return {
                fillableMakerAssetAmount,
                fillableTakerAssetAmount,
                fillableTakerFeeAmount,
                ...order,
            };
        })
        .filter(order => {
            return !order.fillableMakerAssetAmount.isZero() && !order.fillableTakerAssetAmount.isZero();
        });
}

// Gets the difference between two sets.
function difference<T>(a: T[], b: T[]): T[] {
    return a.filter(x => b.indexOf(x) === -1);
}

function createSellPathFromNativeOrders(orders: SignedOrderWithFillableAmounts[]): Fill[] {
    const path: Fill[] = [];
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        const makerAmount = fillableAmountsUtils.getMakerAssetAmountSwappedAfterFees(order);
        const takerAmount = fillableAmountsUtils.getTakerAssetAmountSwappedAfterFees(order);
        // Native orders can be filled in any order, so they're all root nodes.
        path.push({
            flags: FillFlags.SourceNative,
            exclusionMask: 0,
            input: takerAmount,
            output: makerAmount,
            fillData: {
                source: ERC20BridgeSource.Native,
                order,
            },
        });
    }
    return path;
}

function createBuyPathFromNativeOrders(orders: SignedOrderWithFillableAmounts[]): Fill[] {
    const path: Fill[] = [];
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        const makerAmount = fillableAmountsUtils.getMakerAssetAmountSwappedAfterFees(order);
        const takerAmount = fillableAmountsUtils.getTakerAssetAmountSwappedAfterFees(order);
        // Native orders can be filled in any order, so they're all root nodes.
        path.push({
            flags: FillFlags.SourceNative,
            exclusionMask: 0,
            input: makerAmount,
            output: takerAmount,
            fillData: {
                source: ERC20BridgeSource.Native,
                order,
            },
        });
    }
    return path;
}

function createPathsFromDexQuotes(dexQuotes: DexSample[][], noConflicts: boolean): Fill[][] {
    const paths: Fill[][] = [];
    for (const quote of dexQuotes) {
        // Native orders can be filled in any order, so they're all root nodes.
        const path: Fill[] = [];
        let prevSample: DexSample | undefined;
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < quote.length; i++) {
            const sample = quote[i];
            if (sample.output.eq(0) || (prevSample && prevSample.output.gte(sample.output))) {
                // Stop if the output is zero or does not increase.
                break;
            }
            path.push({
                parent: path.length !== 0 ? path[path.length - 1] : undefined,
                flags: sourceToFillFlags(sample.source),
                exclusionMask: noConflicts ? sourceToExclusionMask(sample.source) : 0,
                input: sample.input.minus(prevSample ? prevSample.input : 0),
                output: sample.output.minus(prevSample ? prevSample.output : 0),
                fillData: { source: sample.source },
            });
            prevSample = quote[i];
        }
        if (path.length > 0) {
            // Don't push empty paths.
            paths.push(path);
        }
    }
    return paths;
}

function sourceToFillFlags(source: ERC20BridgeSource): number {
    if (source === ERC20BridgeSource.Kyber) {
        return FillFlags.SourceKyber;
    }
    if (source === ERC20BridgeSource.Eth2Dai) {
        return FillFlags.SourceEth2Dai;
    }
    if (source === ERC20BridgeSource.Uniswap) {
        return FillFlags.SourceUniswap;
    }
    return FillFlags.SourceNative;
}

function sourceToExclusionMask(source: ERC20BridgeSource): number {
    if (source === ERC20BridgeSource.Kyber) {
        // tslint:disable-next-line: no-bitwise
        return FillFlags.SourceEth2Dai | FillFlags.SourceUniswap;
    }
    if (source === ERC20BridgeSource.Eth2Dai) {
        return FillFlags.SourceKyber;
    }
    if (source === ERC20BridgeSource.Uniswap) {
        return FillFlags.SourceKyber;
    }
    return 0;
}

function pruneDustFillsFromNativePath(path: Fill[], fillAmount: BigNumber, dustFractionThreshold: number): Fill[] {
    const dustAmount = fillAmount.times(dustFractionThreshold);
    return path.filter(f => f.input.gt(dustAmount));
}

// Convert a list of DEX paths to a flattened list of `Fills`.
function flattenDexPaths(dexFills: Fill[][]): Fill[] {
    const fills: Fill[] = [];
    for (const quote of dexFills) {
        for (const fill of quote) {
            fills.push(fill);
        }
    }
    return fills;
}

// Picks the path with the highest (or lowest if `shouldMinimize` is true) output.
function pickBestUpperBoundPath(paths: Fill[][], maxInput: BigNumber, shouldMinimize?: boolean): Fill[] | undefined {
    let optimalPath: Fill[] | undefined;
    let optimalPathOutput: BigNumber = ZERO_AMOUNT;
    for (const path of paths) {
        if (getPathInput(path).gte(maxInput)) {
            const output = getPathOutput(path, maxInput);
            if (!optimalPath || comparePathOutputs(output, optimalPathOutput, !!shouldMinimize) === 1) {
                optimalPath = path;
                optimalPathOutput = output;
            }
        }
    }
    return optimalPath;
}

// Gets the total input of a path.
function getPathInput(path: Fill[]): BigNumber {
    return BigNumber.sum(...path.map(p => p.input));
}

// Merges contiguous fills from the same DEX.
function collapsePath(path: Fill[], isBuy: boolean): CollapsedFill[] {
    const collapsed: Array<CollapsedFill | NativeCollapsedFill> = [];
    for (const fill of path) {
        const makerAssetAmount = isBuy ? fill.input : fill.output;
        const takerAssetAmount = isBuy ? fill.output : fill.input;
        const source = (fill.fillData as FillData).source;
        if (collapsed.length !== 0 && source !== ERC20BridgeSource.Native) {
            const prevFill = collapsed[collapsed.length - 1];
            // If the last fill is from the same source, merge them.
            if (prevFill.source === source) {
                prevFill.totalMakerAssetAmount = prevFill.totalMakerAssetAmount.plus(makerAssetAmount);
                prevFill.totalTakerAssetAmount = prevFill.totalTakerAssetAmount.plus(takerAssetAmount);
                prevFill.subFills.push({ makerAssetAmount, takerAssetAmount });
                continue;
            }
        }
        collapsed.push({
            source: fill.fillData.source,
            totalMakerAssetAmount: makerAssetAmount,
            totalTakerAssetAmount: takerAssetAmount,
            subFills: [{ makerAssetAmount, takerAssetAmount }],
            nativeOrder: (fill.fillData as NativeFillData).order,
        });
    }
    return collapsed;
}

// Sort fills by descending price.
function sortFillsByPrice(fills: Fill[]): Fill[] {
    return fills.sort((a, b) => {
        const d = b.output.div(b.input).minus(a.output.div(a.input));
        if (d.gt(0)) {
            return 1;
        } else if (d.lt(0)) {
            return -1;
        }
        return 0;
    });
}

function getOrderTokens(order: SignedOrder): [string, string] {
    const assets = [order.makerAssetData, order.takerAssetData].map(a => assetDataUtils.decodeAssetDataOrThrow(a)) as [
        ERC20AssetData,
        ERC20AssetData
    ];
    if (assets.some(a => a.assetProxyId !== ERC20_PROXY_ID)) {
        throw new Error(AggregationError.NotERC20AssetData);
    }
    return assets.map(a => a.tokenAddress) as [string, string];
}

function clipPathToInput(path: Fill[], assetAmount: BigNumber): Fill[] {
    const clipped = [];
    let totalInput = ZERO_AMOUNT;
    for (const fill of path) {
        if (totalInput.gte(assetAmount)) {
            break;
        }
        clipped.push(fill);
        totalInput = totalInput.plus(fill.input);
    }
    return clipped;
}
