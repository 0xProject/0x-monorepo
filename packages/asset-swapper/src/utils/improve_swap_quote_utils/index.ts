import { IERC20BridgeSamplerContract } from '@0x/contract-wrappers';
import { SignedOrderWithoutDomain } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';

import { constants } from '../../constants';
import { SignedOrderWithFillableAmounts } from '../../types';

import { constants as improveSwapQuoteConstants } from './constants';
import { createOrdersUtils } from './create_orders';
import { comparePathOutputs, FillsOptimizer, getPathOutput } from './fill_optimizer';
import { DexOrderSampler } from './sampler';
import { AggregationError, DexSample, ERC20BridgeSource, Fill, FillData, FillFlags, ImproveOrdersOpts, OrderDomain, NativeFillData } from './types';

const { ZERO_AMOUNT } = constants;
const { BUY_SOURCES, DEFAULT_IMPROVE_ORDERS_OPTS, SELL_SOURCES } = improveSwapQuoteConstants;

export class ImproveSwapQuoteUtils {

    private readonly _dexSampler: DexOrderSampler;
    private readonly _orderDomain: OrderDomain;
    constructor(samplerContract: IERC20BridgeSamplerContract, orderDomain: OrderDomain) {
        this._dexSampler = new DexOrderSampler(samplerContract);
        this._orderDomain = orderDomain;
    }

    /**
     * Improve a market sell operation by (potentially) merging native orders with
     * generated bridge orders.
     * @param nativeOrders Native orders.
     * @param takerAmount Amount of taker asset to sell.
     * @param opts Options object.
     * @return Improved orders.
     */
    public async improveMarketSellAsync(
        nativeOrders: SignedOrderWithFillableAmounts[],
        takerAmount: BigNumber,
        opts?: Partial<ImproveOrdersOpts>,
    ): Promise<SignedOrderWithFillableAmounts[]> {
        if (nativeOrders.length === 0) {
            throw new Error(AggregationError.EmptyOrders);
        }
        const _opts = {
            ...DEFAULT_IMPROVE_ORDERS_OPTS,
            ...opts,
        };
        const [_fillableAmounts, dexQuotes] = await this._dexSampler.getFillableAmountsAndSampleMarketSellAsync(
            nativeOrders,
            DexOrderSampler.getSampleAmounts(takerAmount, _opts.numSamples),
            difference(SELL_SOURCES, _opts.excludedSources),
        );
        // TODO(dave4506) replace with order pruning logic (unify logic with OrderPruner)
        const nativePath = pruneDustFillsFromNativePath(
            createSellPathFromNativeOrders(nativeOrders),
            takerAmount,
            _opts.dustFractionThreshold,
        );
        const dexPaths = createPathsFromDexQuotes(dexQuotes, _opts.noConflicts);
        const allPaths = [...dexPaths];
        const allFills = flattenDexPaths(dexPaths);
        // If native orders are allowed, splice them in.
        if (!_opts.excludedSources.includes(ERC20BridgeSource.Native)) {
            allPaths.splice(0, 0, nativePath);
            allFills.splice(0, 0, ...nativePath);
        }
        const optimizer = new FillsOptimizer(_opts.runLimit);
        const optimalPath = optimizer.optimize(
            // Sorting the orders by price effectively causes the optimizer to walk
            // the greediest solution first, which is the optimal solution in most
            // cases.
            sortFillsByPrice(allFills),
            takerAmount,
            pickBestUpperBoundPath(allPaths, takerAmount),
        );
        if (!optimalPath) {
            throw new Error(AggregationError.NoOptimalPath);
        }
        const [outputToken, inputToken] = getOrderTokens(nativeOrders[0]);
        return createOrdersUtils.createSellOrdersFromPath(this._orderDomain, inputToken, outputToken, simplifyPath(optimalPath), _opts.bridgeSlippage);
    }

    /**
     * Improve a market buy operation by (potentially) merging native orders with
     * generated bridge orders.
     * @param nativeOrders Native orders.
     * @param makerAmount Amount of maker asset to buy.
     * @param opts Options object.
     * @return Improved orders.
     */
    public async improveMarketBuyAsync(
        nativeOrders: SignedOrderWithFillableAmounts[],
        makerAmount: BigNumber,
        opts?: Partial<ImproveOrdersOpts>,
    ): Promise<SignedOrderWithFillableAmounts[]> {
        // TODO(dave4506) remove this error catch?
        if (nativeOrders.length === 0) {
            throw new Error(AggregationError.EmptyOrders);
        }
        const _opts = {
            ...DEFAULT_IMPROVE_ORDERS_OPTS,
            ...opts,
        };

        // TODO(dave4506) we have already fetched fillable amounts, this is redundant work
        const [_fillableAmounts, dexQuotes] = await this._dexSampler.getFillableAmountsAndSampleMarketBuyAsync(
            nativeOrders,
            DexOrderSampler.getSampleAmounts(makerAmount, _opts.numSamples),
            difference(BUY_SOURCES, _opts.excludedSources),
        );
        // TODO(dave4506) replace with order pruning logic (unify logic with OrderPruner)
        const nativePath = pruneDustFillsFromNativePath(
            createBuyPathFromNativeOrders(nativeOrders),
            makerAmount,
            _opts.dustFractionThreshold,
        );

        const dexPaths = createPathsFromDexQuotes(dexQuotes, _opts.noConflicts);
        const allPaths = [...dexPaths];
        const allFills = flattenDexPaths(dexPaths);
        // If native orders are allowed, splice them in.
        if (!_opts.excludedSources.includes(ERC20BridgeSource.Native)) {
            allPaths.splice(0, 0, nativePath);
            allFills.splice(0, 0, ...nativePath);
        }
        const optimizer = new FillsOptimizer(_opts.runLimit, true);
        const optimalPath = optimizer.optimize(
            // Sorting the orders by price effectively causes the optimizer to walk
            // the greediest solution first, which is the optimal solution in most
            // cases.
            sortFillsByPrice(allFills),
            makerAmount,
            pickBestUpperBoundPath(allPaths, makerAmount, true),
        );
        if (!optimalPath) {
            throw new Error(AggregationError.NoOptimalPath);
        }
        const [inputToken, outputToken] = getOrderTokens(nativeOrders[0]);
        return createOrdersUtils.createBuyOrdersFromPath(this._orderDomain, inputToken, outputToken, simplifyPath(optimalPath), _opts.bridgeSlippage);
    }
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
        const takerAmount = order.fillableTakerAssetAmount;
        const makerAmount = order.fillableMakerAssetAmount;
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
        const makerAmount = order.fillableMakerAssetAmount;
        const takerAmount = order.fillableTakerAssetAmount;
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
        paths.push(path);
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < quote.length; i++) {
            const sample = quote[i];
            const prev = i !== 0 ? quote[i - 1] : undefined;
            const parent = i !== 0 ? path[path.length - 1] : undefined;
            path.push({
                parent,
                flags: sourceToFillFlags(sample.source),
                exclusionMask: noConflicts ? sourceToExclusionMask(sample.source) : 0,
                input: sample.input.minus(prev ? prev.input : 0),
                output: sample.output.minus(prev ? prev.output : 0),
                fillData: { source: sample.source },
            });
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
function simplifyPath(path: Fill[]): Fill[] {
    const simplified: Fill[] = [];
    for (const fill of path) {
        const source = (fill.fillData as FillData).source;
        if (simplified.length !== 0 && source !== ERC20BridgeSource.Native) {
            const prevFill = simplified[simplified.length - 1];
            const prevSource = (prevFill.fillData as FillData).source;
            // If the last fill is from the same source, merge them.
            if (prevSource === source) {
                prevFill.input = prevFill.input.plus(fill.input);
                prevFill.output = prevFill.output.plus(fill.output);
                continue;
            }
        }
        simplified.push(fill);
    }
    return simplified;
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

function getOrderTokens(order: SignedOrderWithoutDomain): [string, string] {
    const encoder = AbiEncoder.createMethod('ERC20Token', [{ name: 'tokenAddress', type: 'address' }]);
    return [encoder.strictDecode(order.makerAssetData), encoder.strictDecode(order.takerAssetData)];
}
