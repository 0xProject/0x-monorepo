import { getContractAddressesForChainOrThrow } from '@0x/contract-addresses';
import { ERC20BridgeSamplerContract } from '@0x/contracts-erc20-bridge-sampler';
import { generatePseudoRandomSalt } from '@0x/order-utils';
import { Order, OrderInfo } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';
import { ZeroExProvider } from 'ethereum-types';

import { constants } from '../constants';

const CHAIN_ID = constants.MAINNET_CHAIN_ID;
const EXCHANGE_ADDRESS = getContractAddressesForChainOrThrow(CHAIN_ID).exchange;
const { NULL_BYTES, NULL_ADDRESS } = constants;
const ZERO = new BigNumber(0);
const INFINITE_TIMESTAMP_SEC = new BigNumber(2524604400);
const DEFAULT_RUN_LIMIT = 1024;
const DEFAULT_BRIDGE_SLIPPAGE = 0.0005;
// TODO(dorothy-zbornak): Point these addresses to the mainnet.
const SAMPLER_ADDRESS = '0x425335175ecb488d7d656952da9819a48d3ffd6e';
const KYBER_BRIDGE_ADDRESS = '0xa0cdca934847556eaf431d909fb3cf4aca01df66';
const ETH2DAI_BRIDGE_ADDRESS = '0x27b8c4473c6b885d0b060d722cf614dbc3f9adfb';
const UNISWAP_BRIDGE_ADDRESS = '0x9b81c8beee5d0ff8b128adc04db71f33022c5163';

/**
 * DEX sources to aggregate.
 */
export enum ERC20BridgeSource {
    Native,
    Uniswap,
    Eth2Dai,
    Kyber,
}

// Valid soruces for market sell.
const SELL_SOURCES = [
    ERC20BridgeSource.Uniswap,
    ERC20BridgeSource.Eth2Dai,
    ERC20BridgeSource.Kyber,
];

// Valid sources for market buy.
const BUY_SOURCES = [
    ERC20BridgeSource.Uniswap,
    ERC20BridgeSource.Eth2Dai,
];

// tslint:disable no-bitwise
/**
 * Represents a node on a fill path.
 */
export interface Fill {
    flags: number;
    exclusionMask: number;
    input: BigNumber;
    output: BigNumber;
    parent?: Fill;
    data?: any;
}

// Internal `data` field for `Fill` objects.
interface FillData {
    source: ERC20BridgeSource;
}

// `FillData` for native fills.
interface NativeFillData extends FillData {
    order: Order;
    orderInfo: OrderInfo;
}

// Order fields that are common to all bridges.
interface CommonOrderFields {
    chainId: number;
    exchangeAddress: string;
    takerAddress: string;
    senderAddress: string;
    feeRecipientAddress: string;
    makerFeeAssetData: string;
    takerFeeAssetData: string;
    makerFee: BigNumber;
    takerFee: BigNumber;
    makerAssetAmount: BigNumber;
    takerAssetAmount: BigNumber;
    salt: BigNumber;
    expirationTimeSeconds: BigNumber;
}

/**
 * Options for `ERC20BridgeAggregator` `improveMarketBuyAsync()`
 * and `improveMarketSellAsync()`.
 */
export interface ImproveOrdersOpts {
    /**
     * Liquidity sources to exclude. Default is none.
     */
    excludedSources: ERC20BridgeSource[];
    /**
     * Whether to disallow mixing Kyber orders with Uniswap and Eth2Dai orders.
     */
    shouldDisableKyberConflicts: boolean;
    /**
     * Complexity limit on the search algorithm, i.e., maximum number of
     * nodes to visit. Default is 65536.
     */
    runLimit: number;
    /**
     * When generating bridge orders, we use
     * sampled rate * (1 - bridgeSlippage)
     * as the rate for calculating maker/taker asset amounts.
     * This should be a small positive number (e.g., 0.0005) to make up for
     * small discrepancies between samples and truth.
     * Default is 0.0005 (5 basis points).
     */
    bridgeSlippage: number;
    /**
     * A Web3 provider. Required.
     */
    provider: ZeroExProvider;
}

// Used internally by `FillsOptimizer`.
interface FillsOptimizerContext {
    currentPath: Fill[];
    currentPathInput: BigNumber;
    currentPathOutput: BigNumber;
    currentPathFlags: number;
}

// Represents an individual DEX sample from the sampler contract.
interface DexSample {
    source: ERC20BridgeSource;
    inputToken: string;
    outputToken: string;
    input: BigNumber;
    output: BigNumber;
}

/**
 * Flags for `Fill` objects.
 */
export enum FillFlags {
    SourceNative = 0x1,
    SourceUniswap = 0x2,
    SourceEth2Dai = 0x4,
    SourceKyber = 0x8,
}

/**
 * Improve a market sell operation by (potentially) merging native orders with
 * generated bridge orders.
 * @param nativeOrders Native orders.
 * @param takerAmount Amount of taker asset to sell.
 * @param opts Options object.
 * @return Improved orders.
 */
export async function improveMarketSellAsync(
    nativeOrders: Order[],
    takerAmount: BigNumber,
    opts?: Partial<ImproveOrdersOpts>,
): Promise<Order[]> {
    if (nativeOrders.length === 0) {
        throw new Error('empty orders');
    }
    const _opts = {
        runLimit: undefined,
        excludedSources: [],
        provider: undefined,
        bridgeSlippage: DEFAULT_BRIDGE_SLIPPAGE,
        ...opts,
    };
    const [orderInfos, dexQuotes] = await queryNetworkAsync(
        nativeOrders,
        takerAmount,
        difference(SELL_SOURCES, _opts.excludedSources),
        _opts.provider,
    );
    const nativePath = createSellPathFromNativeOrders(nativeOrders, orderInfos);
    const dexPaths = createPathsFromDexQuotes(dexQuotes);
    const optimizer = new FillsOptimizer(_opts.runLimit);
    const optimalPath = optimizer.optimize(
        sortFillsByPrice([...nativePath, ...flattenDexPaths(dexPaths)]),
        takerAmount,
        pickOptimalPath([nativePath, ...dexPaths], takerAmount),
    );
    if (!optimalPath) {
        throw new Error('no optimal path');
    }
    const [outputToken, inputToken] = getOrderTokens(nativeOrders[0]);
    return createSellOrdersFromPath(
        inputToken,
        outputToken,
        simplifyPath(optimalPath),
        _opts.bridgeSlippage,
    );
}

/**
 * Improve a market buy operation by (potentially) merging native orders with
 * generated bridge orders.
 * @param nativeOrders Native orders.
 * @param makerAmount Amount of maker asset to buy.
 * @param opts Options object.
 * @return Improved orders.
 */
export async function improveMarketBuyAsync(
    nativeOrders: Order[],
    makerAmount: BigNumber,
    opts?: Partial<ImproveOrdersOpts>,
): Promise<Order[]> {
    if (nativeOrders.length === 0) {
        throw new Error('empty orders');
    }
    const _opts = {
        runLimit: undefined,
        excludedSources: [],
        provider: undefined,
        bridgeSlippage: DEFAULT_BRIDGE_SLIPPAGE,
        ...opts,
    };
    const [orderInfos, dexQuotes] = await queryNetworkAsync(
        nativeOrders,
        makerAmount,
        difference(BUY_SOURCES, _opts.excludedSources),
        _opts.provider,
        true,
    );
    const nativePath = createBuyPathFromNativeOrders(nativeOrders, orderInfos);
    const dexPaths = createPathsFromDexQuotes(dexQuotes);
    const optimizer = new FillsOptimizer(_opts.runLimit, true);
    const optimalPath = optimizer.optimize(
        sortFillsByPrice([...nativePath, ...flattenDexPaths(dexPaths)], true),
        makerAmount,
        pickOptimalPath([nativePath, ...dexPaths], makerAmount, true),
    );
    if (!optimalPath) {
        throw new Error('no optimal path');
    }
    const [inputToken, outputToken] = getOrderTokens(nativeOrders[0]);
    return createBuyOrdersFromPath(
        inputToken,
        outputToken,
        simplifyPath(optimalPath),
        _opts.bridgeSlippage,
    );
}

/**
 * Compute the total output for a fill path, optionally clipping the input
 * to `maxInput`.
 */
export function getPathOutput(path: Fill[], maxInput?: BigNumber): BigNumber {
    let currentInput = ZERO;
    let currentOutput = ZERO;
    for (const fill of path) {
        if (maxInput && currentInput.plus(fill.input).gte(maxInput)) {
            const partialInput = maxInput.minus(currentInput);
            currentOutput = currentOutput.plus(getPartialFillOutput(fill, partialInput));
            currentInput = partialInput;
        } else {
            currentInput = currentInput.plus(fill.input);
            currentOutput = currentOutput.plus(fill.output);
        }
    }
    return currentOutput;
}

// Query the sampler contract to get native order statuses and DEX quotes.
async function queryNetworkAsync(
    nativeOrders: Order[],
    fillAmount: BigNumber,
    excludedSources: ERC20BridgeSource[],
    provider?: ZeroExProvider,
    isBuy?: boolean,
): Promise<[OrderInfo[], DexSample[][]]> {
    if (!provider) {
        throw new Error('missing provider');
    }
    const sampler = new ERC20BridgeSamplerContract(
        SAMPLER_ADDRESS,
        provider,
    );
    // TODO
}

// Gets the difference between two sets.
function difference<T>(a: T[], b: T[]): T[] {
    return a.filter(x => b.indexOf(x) === -1);
}

function createSellPathFromNativeOrders(orders: Order[], orderInfos: OrderInfo[]): Fill[] {
    const path: Fill[] = [];
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        const orderInfo = orderInfos[i];
        const [makerAmount, takerAmount] = getOrderFillableAmounts(order, orderInfo);
        // Native orders can be filled in any order, so they're all root nodes.
        path.push({
            flags: FillFlags.SourceNative,
            exclusionMask: 0,
            input: takerAmount,
            output: makerAmount,
            data: {
                source: ERC20BridgeSource.Native,
                order,
                orderInfo,
            },
        });
    }
    return path;
}

function createBuyPathFromNativeOrders(orders: Order[], orderInfos: OrderInfo[]): Fill[] {
    // Equivalent to `createSellPathFromNativeOrders` with sizes and rewards flipped.
    return createSellPathFromNativeOrders(orders, orderInfos).map(f => ({
        ...f,
        input: f.output,
        output: f.input,
    }));
}

function createPathsFromDexQuotes(dexQuotes: DexSample[][]): Fill[][] {
    const paths: Fill[][] = [];
    for (const quote of dexQuotes) {
        // Native orders can be filled in any order, so they're all root nodes.
        const path: Fill[] = [];
        paths.push(path);
        for (const sample of quote) {
            path.push({
                flags: sourceToFillFlags(sample.source),
                exclusionMask: sourceToExclusionMask(sample.source),
                input: sample.input,
                output: sample.output,
                parent: path.length !== 0 ? path[path.length - 1] : undefined,
                data: { source: sample.source },
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

function getOrderFillableAmounts(order: Order, orderInfo: OrderInfo): [BigNumber, BigNumber] {
    const takerAmount = order.takerAssetAmount.minus(orderInfo.orderTakerAssetFilledAmount);
    const makerAmount = takerAmount
        .times(order.makerAssetAmount)
        .div(order.takerAssetAmount)
        .integerValue(BigNumber.ROUND_DOWN);
    return [makerAmount, takerAmount];
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
function pickOptimalPath(
    paths: Fill[][],
    maxInput: BigNumber,
    shouldMinimize?: boolean,
): Fill[] | undefined {
    let optimalPath: Fill[] | undefined;
    let optimalPathOutput: BigNumber = ZERO;
    for (const path of paths) {
        if (getPathInput(path).gte(maxInput)) {
            const output = getPathOutput(path, maxInput);
            if (!optimalPath ||
                compareOutputs(output, optimalPathOutput, !!shouldMinimize) === 1) {
                optimalPath = path;
                optimalPathOutput = optimalPathOutput;
            }
        }
    }
    return optimalPath;
}

// Gets the total input of a path.
function getPathInput(path: Fill[]): BigNumber {
    return BigNumber.sum(...path.map(p => p.input));
}

// Compares two rewards, returning -1, 0, or 1
// if `a` is less than, equal to, or greater than `b`.
function compareOutputs(a: BigNumber, b: BigNumber, shouldMinimize: boolean): number {
    return shouldMinimize ? b.comparedTo(a) : a.comparedTo(b);
}

// Merges contiguous fills from the same DEX.
function simplifyPath(path: Fill[]): Fill[] {
    const simplified: Fill[] = [];
    for (const fill of path) {
        const source = (fill.data as FillData).source;
        if (path.length !== 0 && source !== ERC20BridgeSource.Native) {
            const prevFill = path[path.length - 1];
            const prevSource = (prevFill.data as FillData).source;
            if (prevSource === source) {
                path[path.length - 1] = {
                    ...prevFill,
                    input: prevFill.input.plus(fill.input),
                    output: prevFill.output.plus(fill.output),
                };
                continue;
            }
        }
        simplified.push(fill);
    }
    return simplified;
}

function sortFillsByPrice(fills: Fill[], reversed?: boolean): Fill[] {
    return fills.sort((a, b) => {
        let d = (a.output.div(a.input)).minus(b.output.div(b.input));
        if (reversed) {
            d = d.negated();
        }
        if (d.gt(0)) {
            return 1;
        } else if (d.lt(0)) {
            return -1;
        }
        return 0;
    });
}

function getOrderTokens(order: Order): [string, string] {
    const encoder = AbiEncoder.createMethod(
        'ERC20Token',
        [{ name: 'tokenAddress', type: 'address' }],
    );
    const { tokenAddress: makerToken } = encoder.strictDecode(order.makerAssetData);
    const { tokenAddress: takerToken } = encoder.strictDecode(order.takerAssetData);
    return [makerToken, takerToken];
}

// Convert sell fills into orders.
function createSellOrdersFromPath(
    inputToken: string,
    outputToken: string,
    path: Fill[],
    bridgeSlippage: number,
): Order[] {
    const orders: Order[] = [];
    for (const fill of path) {
        const source = (fill.data as FillData).source;
        if (source === ERC20BridgeSource.Native) {
            orders.push((fill.data as NativeFillData).order);
        } else if (source === ERC20BridgeSource.Kyber) {
            orders.push(createKyberOrder(
                inputToken,
                outputToken,
                fill.output,
                fill.input,
                bridgeSlippage,
            ));
        } else if (source === ERC20BridgeSource.Eth2Dai) {
            orders.push(createEth2DaiOrder(
                inputToken,
                outputToken,
                fill.output,
                fill.input,
                bridgeSlippage,
            ));
        } else if (source === ERC20BridgeSource.Uniswap) {
            orders.push(createUniswapOrder(
                inputToken,
                outputToken,
                fill.output,
                fill.input,
                bridgeSlippage,
            ));
        } else {
            throw new Error(`invalid sell fill source: ${source}`);
        }
    }
    return orders;
}

// Convert buy fills into orders.
function createBuyOrdersFromPath(
    inputToken: string,
    outputToken: string,
    path: Fill[],
    bridgeSlippage: number,
): Order[] {
    const orders: Order[] = [];
    for (const fill of path) {
        const source = (fill.data as FillData).source;
        if (source === ERC20BridgeSource.Native) {
            orders.push((fill.data as NativeFillData).order);
        } else if (source === ERC20BridgeSource.Eth2Dai) {
            orders.push(createEth2DaiOrder(
                inputToken,
                outputToken,
                fill.input,
                fill.output,
                bridgeSlippage,
                true,
            ));
        } else if (source === ERC20BridgeSource.Uniswap) {
            orders.push(createUniswapOrder(
                inputToken,
                outputToken,
                fill.input,
                fill.output,
                bridgeSlippage,
                true,
            ));
        } else {
            throw new Error(`invalid buy fill source: ${source}`);
        }
    }
    return orders;
}

function createKyberOrder(
    makerToken: string,
    takerToken: string,
    makerAssetAmount: BigNumber,
    takerAssetAmount: BigNumber,
    slippage: number,
    buy: boolean = false,
): Order {
    return createBridgeOrder(
        KYBER_BRIDGE_ADDRESS,
        makerToken,
        takerToken,
        makerAssetAmount,
        takerAssetAmount,
        slippage,
        buy,
    );
}

function createEth2DaiOrder(
    makerToken: string,
    takerToken: string,
    makerAssetAmount: BigNumber,
    takerAssetAmount: BigNumber,
    slippage: number,
    buy: boolean = false,
): Order {
    return createBridgeOrder(
        ETH2DAI_BRIDGE_ADDRESS,
        makerToken,
        takerToken,
        makerAssetAmount,
        takerAssetAmount,
        slippage,
        buy,
    );
}

function createUniswapOrder(
    makerToken: string,
    takerToken: string,
    makerAssetAmount: BigNumber,
    takerAssetAmount: BigNumber,
    slippage: number,
    buy: boolean = false,
): Order {
    return createBridgeOrder(
        UNISWAP_BRIDGE_ADDRESS,
        makerToken,
        takerToken,
        makerAssetAmount,
        takerAssetAmount,
        slippage,
        buy,
    );
}

function createBridgeOrder(
    bridgeAddress: string,
    makerToken: string,
    takerToken: string,
    makerAssetAmount: BigNumber,
    takerAssetAmount: BigNumber,
    slippage: number,
    buy: boolean = false,
): Order {
    return {
        makerAddress: bridgeAddress,
        makerAssetData: createBridgeAssetData(
            takerToken,
            bridgeAddress,
            createBridgeData(makerToken),
        ),
        takerAssetData: createERC20AssetData(takerToken),
        ...createCommonOrderFields(makerAssetAmount, takerAssetAmount, slippage, buy),
    };
}

function createBridgeAssetData(
    tokenAddress: string,
    bridgeAddress: string,
    bridgeData: string,
): string {
    const encoder = AbiEncoder.createMethod(
        'ERC20Bridge',
        [
            { name: 'tokenAddress', type: 'address' },
            { name: 'bridgeAddress', type: 'address' },
            { name: 'bridgeData', type: 'bytes' },
        ],
    );
    return encoder.encode({ tokenAddress, bridgeAddress, bridgeData });
}

function createERC20AssetData(tokenAddress: string): string {
    const encoder = AbiEncoder.createMethod(
        'ERC20Token',
        [{ name: 'tokenAddress', type: 'address' }],
    );
    return encoder.encode({ tokenAddress });
}

function createBridgeData(tokenAddress: string): string {
    const encoder = AbiEncoder.create(
        [{ name: 'tokenAddress', type: 'address' }],
    );
    return encoder.encode({ tokenAddress });
}

function createCommonOrderFields(
    makerAssetAmount: BigNumber,
    takerAssetAmount: BigNumber,
    slippage: number,
    buy: boolean = false,
): CommonOrderFields {
    const rate = makerAssetAmount.times(1 - Math.min(1, slippage)).div(takerAssetAmount);
    return {
        chainId: CHAIN_ID,
        exchangeAddress: EXCHANGE_ADDRESS,
        takerAddress: NULL_ADDRESS,
        senderAddress: NULL_ADDRESS,
        feeRecipientAddress: NULL_ADDRESS,
        salt: generatePseudoRandomSalt(),
        expirationTimeSeconds: INFINITE_TIMESTAMP_SEC,
        makerFeeAssetData: NULL_BYTES,
        takerFeeAssetData: NULL_BYTES,
        makerFee: ZERO,
        takerFee: ZERO,
        makerAssetAmount: buy ?
            makerAssetAmount :
            makerAssetAmount.times(rate).integerValue(),
        takerAssetAmount: buy ?
            takerAssetAmount.div(rate).integerValue() :
            takerAssetAmount,
    };
}

// Get the partial output earned by a fill at input `partialInput`.
function getPartialFillOutput(fill: Fill, partialInput: BigNumber): BigNumber {
    return BigNumber.min(fill.output, fill.output.div(fill.input).times(partialInput));
}

/**
 * Class for finding optimized fill paths.
 */
export class FillsOptimizer {
    private readonly _runLimit: number;
    private readonly _shouldMinimize: boolean;
    private _currentRunCount: number = 0;
    private _optimalPath?: Fill[] = undefined;
    private _optimalPathOutput: BigNumber = ZERO;

    constructor(runLimit?: number, shouldMinimize?: boolean) {
        this._runLimit = runLimit === undefined ? DEFAULT_RUN_LIMIT : runLimit;
        this._shouldMinimize = !!shouldMinimize;
    }

    public optimize(fills: Fill[], input: BigNumber, optimalPath?: Fill[]): Fill[] | undefined {
        this._currentRunCount = 0;
        this._optimalPath = optimalPath;
        this._optimalPathOutput = optimalPath ? getPathOutput(optimalPath, input) : ZERO;
        const ctx = {
            currentPath: [],
            currentPathInput: ZERO,
            currentPathOutput: ZERO,
            currentPathFlags: 0,
        };
        this._walk(fills, input, ctx);
        return this._optimalPath;
    }

    private _walk(fills: Fill[], input: BigNumber, ctx: FillsOptimizerContext): void {
        const {
            currentPath,
            currentPathInput,
            currentPathOutput,
            currentPathFlags,
        } = ctx;

        // Stop if the current path is already complete.
        if (currentPathInput.gte(input)) {
            this._updateOptimalPath(currentPath, currentPathOutput);
        }

        const lastNode = currentPath.length !== 0 ?
            currentPath[currentPath.length - 1] : undefined;
        // Visit next fill candidates.
        for (const nextFill of fills) {
            // Subsequent fills must be a root node or be preceded by its parent,
            // enforcing contiguous fills.
            if (nextFill.parent && nextFill.parent !== lastNode) {
                break;
            }
            // Stop if we've hit our run limit.
            if (this._currentRunCount-- >= this._runLimit) {
                break;
            }
            const nextPath = [...currentPath, nextFill];
            const nextPathInput = BigNumber.min(input, currentPathInput.plus(nextFill.input));
            const nextPathOutput = currentPathOutput.plus(
                getPartialFillOutput(nextFill, currentPathInput.minus(nextPathInput)),
            );
            this._walk(
                // Filter out incompatible fills.
                fills.filter(f => (f.flags & nextFill.exclusionMask) === 0),
                input,
                {
                    currentPath: nextPath,
                    currentPathInput: nextPathInput,
                    currentPathOutput: nextPathOutput,
                    currentPathFlags: currentPathFlags | nextFill.flags,
                },
            );
        }
    }

    private _updateOptimalPath(path: Fill[], output: BigNumber): void {
        if (!this._optimalPath || this._compareOutputs(output, this._optimalPathOutput) === 1) {
            this._optimalPath = path;
            this._optimalPathOutput = output;
        }
    }

    private _compareOutputs(a: BigNumber, b: BigNumber): number {
        return compareOutputs(a, b, this._shouldMinimize);
    }
}
// tslint:disable: max-file-line-count
