import { ERC20BridgeSamplerContract } from '@0x/contracts-erc20-bridge-sampler';
import { generatePseudoRandomSalt } from '@0x/order-utils';
import { SignedOrderWithoutDomain } from '@0x/types';
import { AbiEncoder, BigNumber } from '@0x/utils';
import { SupportedProvider } from 'ethereum-types';

import { constants } from '../constants';

const { NULL_BYTES, NULL_ADDRESS } = constants;
const ZERO = new BigNumber(0);
const INFINITE_TIMESTAMP_SEC = new BigNumber(2524604400);
// TODO(dorothy-zbornak): Point these addresses to the mainnet.
export const SAMPLER_ADDRESS = '0x425335175ecb488d7d656952da9819a48d3ffd6e';
export const KYBER_BRIDGE_ADDRESS = '0xa0cdca934847556eaf431d909fb3cf4aca01df66';
export const ETH2DAI_BRIDGE_ADDRESS = '0x27b8c4473c6b885d0b060d722cf614dbc3f9adfb';
export const UNISWAP_BRIDGE_ADDRESS = '0x9b81c8beee5d0ff8b128adc04db71f33022c5163';

/**
 * Common exception messages thrown by aggregation logic.
 */
export enum AggregationError {
    NoOptimalPath = 'no optimal path',
    EmptyOrders = 'empty orders',
    MissingProvider = 'missing provider',
}

/**
 * DEX sources to aggregate.
 */
export enum ERC20BridgeSource {
    Native,
    Uniswap,
    Eth2Dai,
    Kyber,
    NumSources,
}

/**
 * Convert a source to a canonical address used by the sampler contract.
 */
export const SOURCE_TO_ADDRESS: { [key: string]: string } = {
    [ERC20BridgeSource.Eth2Dai]: '0x39755357759cE0d7f32dC8dC45414CCa409AE24e',
    [ERC20BridgeSource.Uniswap]: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95',
    [ERC20BridgeSource.Kyber]: '0x818E6FECD516Ecc3849DAf6845e3EC868087B755',
};

/**
 * Valid sources for market sell.
 */
export const SELL_SOURCES = [ERC20BridgeSource.Uniswap, ERC20BridgeSource.Eth2Dai, ERC20BridgeSource.Kyber];

/**
 * Valid sources for market buy.
 */
export const BUY_SOURCES = [ERC20BridgeSource.Uniswap, ERC20BridgeSource.Eth2Dai];

/**
 * Represents a node on a fill path.
 */
export interface Fill {
    // See `FillFlags`.
    flags: number;
    // `FillFlags` that are incompatible with this fill, e.g., to prevent
    // Kyber from mixing with Uniswap and Eth2Dai and vice versa.
    exclusionMask: number;
    // Input fill amount (taker asset amount in a sell, maker asset amount in a buy).
    input: BigNumber;
    // Output fill amount (maker asset amount in a sell, taker asset amount in a buy).
    output: BigNumber;
    // Fill that must precede this one. This enforces certain fills to be contiguous.
    parent?: Fill;
    // Arbitrary data to store in this Fill object. Used to reconstruct orders
    // from paths.
    data?: any;
}

// Internal `data` field for `Fill` objects.
interface FillData {
    source: ERC20BridgeSource;
}

// `FillData` for native fills.
interface NativeFillData extends FillData {
    order: SignedOrderWithoutDomain;
}

/**
 * Options for `improveMarketBuyAsync()` and `improveMarketSellAsync()`.
 */
export interface ImproveOrdersOpts {
    /**
     * Liquidity sources to exclude. Default is none.
     */
    excludedSources: ERC20BridgeSource[];
    /**
     * Whether to prevent mixing Kyber orders with Uniswap and Eth2Dai orders.
     */
    noConflicts: boolean;
    /**
     * Complexity limit on the search algorithm, i.e., maximum number of
     * nodes to visit. Default is 1024.
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
     * Number of samples to take for each DEX quote.
     */
    numSamples: number;
    /**
     * Dust amount, as a fraction of the fill amount.
     * Default is 0.01 (100 basis points).
     */
    dustThreshold: number;
    /**
     * A Web3 provider. Required.
     */
    provider: SupportedProvider;
}

const IMPROVE_ORDERS_OPTS_DEFAULTS = {
    runLimit: 1024,
    excludedSources: [],
    provider: undefined,
    bridgeSlippage: 0.0005,
    dustThreshold: 0.01,
    numSamples: 8,
    noConflicts: false,
};

// Used internally by `FillsOptimizer`.
interface FillsOptimizerContext {
    currentPath: Fill[];
    currentPathInput: BigNumber;
    currentPathOutput: BigNumber;
    currentPathFlags: number;
}

/**
 * Represents an individual DEX sample from the sampler contract.
 */
export interface DexSample {
    source: ERC20BridgeSource;
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
    nativeOrders: SignedOrderWithoutDomain[],
    takerAmount: BigNumber,
    opts?: Partial<ImproveOrdersOpts>,
): Promise<SignedOrderWithoutDomain[]> {
    if (nativeOrders.length === 0) {
        throw new Error(AggregationError.EmptyOrders);
    }
    const _opts = {
        ...IMPROVE_ORDERS_OPTS_DEFAULTS,
        ...opts,
    };
    const [fillableAmounts, dexQuotes] = await queryNetworkAsync(
        nativeOrders,
        getSampleAmounts(takerAmount, _opts.numSamples),
        difference(SELL_SOURCES, _opts.excludedSources),
        _opts.provider,
    );
    const nativePath = pruneDustFillsFromNativePath(
        createSellPathFromNativeOrders(nativeOrders, fillableAmounts),
        takerAmount,
        _opts.dustThreshold,
    );
    const dexPaths = createPathsFromDexQuotes(dexQuotes, _opts.noConflicts);
    const allPaths = [...dexPaths];
    const allFills = flattenDexPaths(dexPaths);
    if (!(_opts.excludedSources as ERC20BridgeSource[]).includes(ERC20BridgeSource.Native)) {
        allPaths.splice(0, 0, nativePath);
        allFills.splice(0, 0, ...nativePath);
    }
    const optimizer = new FillsOptimizer(_opts.runLimit);
    const optimalPath = optimizer.optimize(
        sortFillsByPrice(allFills),
        takerAmount,
        pickOptimalPath(allPaths, takerAmount),
    );
    if (!optimalPath) {
        throw new Error(AggregationError.NoOptimalPath);
    }
    const [outputToken, inputToken] = getOrderTokens(nativeOrders[0]);
    return createSellOrdersFromPath(inputToken, outputToken, simplifyPath(optimalPath), _opts.bridgeSlippage);
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
    nativeOrders: SignedOrderWithoutDomain[],
    makerAmount: BigNumber,
    opts?: Partial<ImproveOrdersOpts>,
): Promise<SignedOrderWithoutDomain[]> {
    if (nativeOrders.length === 0) {
        throw new Error(AggregationError.EmptyOrders);
    }
    const _opts = {
        ...IMPROVE_ORDERS_OPTS_DEFAULTS,
        ...opts,
    };
    const [fillableAmounts, dexQuotes] = await queryNetworkAsync(
        nativeOrders,
        getSampleAmounts(makerAmount, _opts.numSamples),
        difference(BUY_SOURCES, _opts.excludedSources),
        _opts.provider,
        true,
    );
    const nativePath = pruneDustFillsFromNativePath(
        createBuyPathFromNativeOrders(nativeOrders, fillableAmounts),
        makerAmount,
        _opts.dustThreshold,
    );
    const dexPaths = createPathsFromDexQuotes(dexQuotes, _opts.noConflicts);
    const allPaths = [...dexPaths];
    const allFills = flattenDexPaths(dexPaths);
    if (!(_opts.excludedSources as ERC20BridgeSource[]).includes(ERC20BridgeSource.Native)) {
        allPaths.splice(0, 0, nativePath);
        allFills.splice(0, 0, ...nativePath);
    }
    const optimizer = new FillsOptimizer(_opts.runLimit, true);
    const optimalPath = optimizer.optimize(
        sortFillsByPrice(allFills),
        makerAmount,
        pickOptimalPath(allPaths, makerAmount, true),
    );
    if (!optimalPath) {
        throw new Error(AggregationError.NoOptimalPath);
    }
    const [inputToken, outputToken] = getOrderTokens(nativeOrders[0]);
    return createBuyOrdersFromPath(inputToken, outputToken, simplifyPath(optimalPath), _opts.bridgeSlippage);
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

/**
 * Query the sampler contract to get native order statuses and DEX quotes.
 */
export async function queryNetworkAsync(
    nativeOrders: SignedOrderWithoutDomain[],
    sampleAmounts: BigNumber[],
    sources: ERC20BridgeSource[],
    provider?: SupportedProvider,
    isBuy?: boolean,
): Promise<[BigNumber[], DexSample[][]]> {
    if (!provider) {
        throw new Error(AggregationError.MissingProvider);
    }
    const sampler = new ERC20BridgeSamplerContract(SAMPLER_ADDRESS, provider);
    const signatures = nativeOrders.map(o => o.signature);
    let fillableAmount;
    let rawSamples;
    if (isBuy) {
        [fillableAmount, rawSamples] = await sampler
            .queryOrdersAndSampleBuys(
                nativeOrders,
                signatures,
                sources.map(s => SOURCE_TO_ADDRESS[s]),
                sampleAmounts,
            ).callAsync();
    } else {
        [fillableAmount, rawSamples] = await sampler
            .queryOrdersAndSampleSells(
                nativeOrders,
                signatures,
                sources.map(s => SOURCE_TO_ADDRESS[s]),
                sampleAmounts,
            ).callAsync();
    }
    const quotes = rawSamples.map((rawDexSamples, sourceIdx) => {
        const source = sources[sourceIdx];
        return rawDexSamples.map((sample, sampleIdx) => ({
            source,
            input: sampleAmounts[sampleIdx],
            output: sample,
        }));
    });
    return [fillableAmount, quotes];
}

/**
 * Generate sample amounts up to `maxFillAmount`.
 */
export function getSampleAmounts(maxFillAmount: BigNumber, numSamples: number): BigNumber[] {
    const amounts = [];
    for (let i = 0; i < numSamples; i++) {
        amounts.push(
            maxFillAmount
                .times(i + 1)
                .div(numSamples)
                .integerValue(BigNumber.ROUND_UP),
        );
    }
    return amounts;
}

// Gets the difference between two sets.
function difference<T>(a: T[], b: T[]): T[] {
    return a.filter(x => b.indexOf(x) === -1);
}

function createSellPathFromNativeOrders(orders: SignedOrderWithoutDomain[], fillableAmounts: BigNumber[]): Fill[] {
    const path: Fill[] = [];
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        const takerAmount = fillableAmounts[i];
        const makerAmount = getOrderFillableMakerAmount(order, takerAmount);
        // Native orders can be filled in any order, so they're all root nodes.
        path.push({
            flags: FillFlags.SourceNative,
            exclusionMask: 0,
            input: takerAmount,
            output: makerAmount,
            data: {
                source: ERC20BridgeSource.Native,
                order,
            },
        });
    }
    return path;
}

function createBuyPathFromNativeOrders(orders: SignedOrderWithoutDomain[], fillableAmounts: BigNumber[]): Fill[] {
    const path: Fill[] = [];
    // tslint:disable-next-line: prefer-for-of
    for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        const makerAmount = fillableAmounts[i];
        const takerAmount = getOrderFillableTakerAmount(order, makerAmount);
        // Native orders can be filled in any order, so they're all root nodes.
        path.push({
            flags: FillFlags.SourceNative,
            exclusionMask: 0,
            input: takerAmount,
            output: makerAmount,
            data: {
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

function getOrderFillableMakerAmount(order: SignedOrderWithoutDomain, fillableTakerAmmount: BigNumber): BigNumber {
    return fillableTakerAmmount
        .times(order.makerAssetAmount)
        .div(order.takerAssetAmount)
        .integerValue(BigNumber.ROUND_DOWN);
}

function getOrderFillableTakerAmount(order: SignedOrderWithoutDomain, fillableMakerAmmount: BigNumber): BigNumber {
    return fillableMakerAmmount
        .times(order.takerAssetAmount)
        .div(order.makerAssetAmount)
        .integerValue(BigNumber.ROUND_DOWN);
}

function pruneDustFillsFromNativePath(path: Fill[], fillAmount: BigNumber, dustThreshold: number): Fill[] {
    const dustAmount = fillAmount.times(dustThreshold);
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
function pickOptimalPath(paths: Fill[][], maxInput: BigNumber, shouldMinimize?: boolean): Fill[] | undefined {
    let optimalPath: Fill[] | undefined;
    let optimalPathOutput: BigNumber = ZERO;
    for (const path of paths) {
        if (getPathInput(path).gte(maxInput)) {
            const output = getPathOutput(path, maxInput);
            if (!optimalPath || compareOutputs(output, optimalPathOutput, !!shouldMinimize) === 1) {
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
        if (simplified.length !== 0 && source !== ERC20BridgeSource.Native) {
            const prevFill = simplified[simplified.length - 1];
            const prevSource = (prevFill.data as FillData).source;
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

// Convert sell fills into orders.
function createSellOrdersFromPath(
    inputToken: string,
    outputToken: string,
    path: Fill[],
    bridgeSlippage: number,
): SignedOrderWithoutDomain[] {
    const orders: SignedOrderWithoutDomain[] = [];
    for (const fill of path) {
        const source = (fill.data as FillData).source;
        if (source === ERC20BridgeSource.Native) {
            orders.push((fill.data as NativeFillData).order);
        } else if (source === ERC20BridgeSource.Kyber) {
            orders.push(createKyberOrder(outputToken, inputToken, fill.output, fill.input, bridgeSlippage));
        } else if (source === ERC20BridgeSource.Eth2Dai) {
            orders.push(createEth2DaiOrder(outputToken, inputToken, fill.output, fill.input, bridgeSlippage));
        } else if (source === ERC20BridgeSource.Uniswap) {
            orders.push(createUniswapOrder(outputToken, inputToken, fill.output, fill.input, bridgeSlippage));
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
): SignedOrderWithoutDomain[] {
    const orders: SignedOrderWithoutDomain[] = [];
    for (const fill of path) {
        const source = (fill.data as FillData).source;
        if (source === ERC20BridgeSource.Native) {
            orders.push((fill.data as NativeFillData).order);
        } else if (source === ERC20BridgeSource.Eth2Dai) {
            orders.push(createEth2DaiOrder(inputToken, outputToken, fill.input, fill.output, bridgeSlippage, true));
        } else if (source === ERC20BridgeSource.Uniswap) {
            orders.push(createUniswapOrder(inputToken, outputToken, fill.input, fill.output, bridgeSlippage, true));
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
    isBuy: boolean = false,
): SignedOrderWithoutDomain {
    return createBridgeOrder(
        KYBER_BRIDGE_ADDRESS,
        makerToken,
        takerToken,
        makerAssetAmount,
        takerAssetAmount,
        slippage,
        isBuy,
    );
}

function createEth2DaiOrder(
    makerToken: string,
    takerToken: string,
    makerAssetAmount: BigNumber,
    takerAssetAmount: BigNumber,
    slippage: number,
    isBuy: boolean = false,
): SignedOrderWithoutDomain {
    return createBridgeOrder(
        ETH2DAI_BRIDGE_ADDRESS,
        makerToken,
        takerToken,
        makerAssetAmount,
        takerAssetAmount,
        slippage,
        isBuy,
    );
}

function createUniswapOrder(
    makerToken: string,
    takerToken: string,
    makerAssetAmount: BigNumber,
    takerAssetAmount: BigNumber,
    slippage: number,
    isBuy: boolean = false,
): SignedOrderWithoutDomain {
    return createBridgeOrder(
        UNISWAP_BRIDGE_ADDRESS,
        makerToken,
        takerToken,
        makerAssetAmount,
        takerAssetAmount,
        slippage,
        isBuy,
    );
}

function createBridgeOrder(
    bridgeAddress: string,
    makerToken: string,
    takerToken: string,
    makerAssetAmount: BigNumber,
    takerAssetAmount: BigNumber,
    slippage: number,
    isBuy: boolean = false,
): SignedOrderWithoutDomain {
    return {
        makerAddress: bridgeAddress,
        makerAssetData: createBridgeAssetData(makerToken, bridgeAddress, createBridgeData(takerToken)),
        takerAssetData: createERC20AssetData(takerToken),
        ...createCommonOrderFields(makerAssetAmount, takerAssetAmount, slippage, isBuy),
    };
}

/**
 * Create ERC20Bridge asset data.
 */
export function createBridgeAssetData(tokenAddress: string, bridgeAddress: string, bridgeData: string): string {
    const encoder = AbiEncoder.createMethod('ERC20Bridge', [
        { name: 'tokenAddress', type: 'address' },
        { name: 'bridgeAddress', type: 'address' },
        { name: 'bridgeData', type: 'bytes' },
    ]);
    return encoder.encode({ tokenAddress, bridgeAddress, bridgeData });
}

/**
 * Create ERC20Proxy asset data.
 */
export function createERC20AssetData(tokenAddress: string): string {
    const encoder = AbiEncoder.createMethod('ERC20Token', [{ name: 'tokenAddress', type: 'address' }]);
    return encoder.encode({ tokenAddress });
}

function createBridgeData(tokenAddress: string): string {
    const encoder = AbiEncoder.create([{ name: 'tokenAddress', type: 'address' }]);
    return encoder.encode({ tokenAddress });
}

type CommonOrderFields = Pick<
    SignedOrderWithoutDomain,
    Exclude<keyof SignedOrderWithoutDomain, 'makerAddress' | 'makerAssetData' | 'takerAssetData'>
>;

function createCommonOrderFields(
    makerAssetAmount: BigNumber,
    takerAssetAmount: BigNumber,
    slippage: number,
    isBuy: boolean = false,
): CommonOrderFields {
    return {
        takerAddress: NULL_ADDRESS,
        senderAddress: NULL_ADDRESS,
        feeRecipientAddress: NULL_ADDRESS,
        salt: generatePseudoRandomSalt(),
        expirationTimeSeconds: INFINITE_TIMESTAMP_SEC,
        makerFeeAssetData: NULL_BYTES,
        takerFeeAssetData: NULL_BYTES,
        makerFee: ZERO,
        takerFee: ZERO,
        makerAssetAmount: isBuy
            ? makerAssetAmount
            : makerAssetAmount.times(1 - slippage).integerValue(BigNumber.ROUND_UP),
        takerAssetAmount: isBuy
            ? takerAssetAmount.times(slippage + 1).integerValue(BigNumber.ROUND_UP)
            : takerAssetAmount,
        signature: '0x04',
    };
}

// Get the partial output earned by a fill at input `partialInput`.
function getPartialFillOutput(fill: Fill, partialInput: BigNumber): BigNumber {
    return BigNumber.min(fill.output, fill.output.div(fill.input).times(partialInput)).integerValue(
        BigNumber.ROUND_DOWN,
    );
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

    constructor(runLimit: number, shouldMinimize?: boolean) {
        this._runLimit = runLimit;
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
        // Visit all valid combintations of fills to find the optimal path.
        this._walk(fills, input, ctx);
        return this._optimalPath;
    }

    private _walk(fills: Fill[], input: BigNumber, ctx: FillsOptimizerContext): void {
        const { currentPath, currentPathInput, currentPathOutput, currentPathFlags } = ctx;

        // Stop if the current path is already complete.
        if (currentPathInput.gte(input)) {
            this._updateOptimalPath(currentPath, currentPathOutput);
            return;
        }

        const lastNode = currentPath.length !== 0 ? currentPath[currentPath.length - 1] : undefined;
        // Visit next fill candidates.
        for (const nextFill of fills) {
            // Subsequent fills must be a root node or be preceded by its parent,
            // enforcing contiguous fills.
            if (nextFill.parent && nextFill.parent !== lastNode) {
                continue;
            }
            // Stop if we've hit our run limit.
            if (this._currentRunCount++ >= this._runLimit) {
                break;
            }
            const nextPath = [...currentPath, nextFill];
            const nextPathInput = BigNumber.min(input, currentPathInput.plus(nextFill.input));
            const nextPathOutput = currentPathOutput.plus(
                getPartialFillOutput(nextFill, nextPathInput.minus(currentPathInput)),
            );
            // tslint:disable-next-line: no-bitwise
            const nextPathFlags = currentPathFlags | nextFill.flags;
            this._walk(
                // Filter out incompatible fills.
                // tslint:disable-next-line no-bitwise
                fills.filter(f => f !== nextFill && (nextPathFlags & f.exclusionMask) === 0),
                input,
                {
                    currentPath: nextPath,
                    currentPathInput: nextPathInput,
                    currentPathOutput: nextPathOutput,
                    // tslint:disable-next-line: no-bitwise
                    currentPathFlags: nextPathFlags,
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
