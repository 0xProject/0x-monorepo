import { BigNumber } from '@0x/utils';

import { MarketOperation } from '../../types';

import { POSITIVE_INF, SOURCE_FLAGS, ZERO_AMOUNT } from './constants';
import {
    createBatchedBridgeOrder,
    createBridgeOrder,
    createNativeOrder,
    CreateOrderFromPathOpts,
    getMakerTakerTokens,
} from './orders';
import { getCompleteRate, getRate } from './rate_utils';
import {
    CollapsedFill,
    ERC20BridgeSource,
    ExchangeProxyOverhead,
    Fill,
    NativeCollapsedFill,
    OptimizedMarketOrder,
} from './types';

// tslint:disable: prefer-for-of no-bitwise completed-docs

export interface PathSize {
    input: BigNumber;
    output: BigNumber;
}

export interface PathPenaltyOpts {
    ethToOutputRate: BigNumber;
    ethToInputRate: BigNumber;
    exchangeProxyOverhead: ExchangeProxyOverhead;
}

export const DEFAULT_PATH_PENALTY_OPTS: PathPenaltyOpts = {
    ethToOutputRate: ZERO_AMOUNT,
    ethToInputRate: ZERO_AMOUNT,
    exchangeProxyOverhead: () => ZERO_AMOUNT,
};

export class Path {
    public collapsedFills?: ReadonlyArray<CollapsedFill>;
    public orders?: OptimizedMarketOrder[];
    public sourceFlags: number = 0;
    protected _size: PathSize = { input: ZERO_AMOUNT, output: ZERO_AMOUNT };
    protected _adjustedSize: PathSize = { input: ZERO_AMOUNT, output: ZERO_AMOUNT };

    protected constructor(
        protected readonly side: MarketOperation,
        public fills: ReadonlyArray<Fill>,
        protected readonly targetInput: BigNumber,
        public readonly pathPenaltyOpts: PathPenaltyOpts,
    ) {}

    public static create(
        side: MarketOperation,
        fills: ReadonlyArray<Fill>,
        targetInput: BigNumber = POSITIVE_INF,
        pathPenaltyOpts: PathPenaltyOpts = DEFAULT_PATH_PENALTY_OPTS,
    ): Path {
        const path = new Path(side, fills, targetInput, pathPenaltyOpts);
        fills.forEach(fill => {
            path.sourceFlags |= fill.flags;
            path._addFillSize(fill);
        });
        return path;
    }

    public static clone(base: Path): Path {
        const clonedPath = new Path(base.side, base.fills.slice(), base.targetInput, base.pathPenaltyOpts);
        clonedPath.sourceFlags = base.sourceFlags;
        clonedPath._size = { ...base._size };
        clonedPath._adjustedSize = { ...base._adjustedSize };
        clonedPath.collapsedFills = base.collapsedFills === undefined ? undefined : base.collapsedFills.slice();
        clonedPath.orders = base.orders === undefined ? undefined : base.orders.slice();
        return clonedPath;
    }

    public append(fill: Fill): this {
        (this.fills as Fill[]).push(fill);
        this.sourceFlags |= fill.flags;
        this._addFillSize(fill);
        return this;
    }

    public addFallback(fallback: Path): this {
        // If the last fill is Native and penultimate is not, then the intention was to partial fill
        // In this case we drop it entirely as we can't handle a failure at the end and we don't
        // want to fully fill when it gets prepended to the front below
        const [last, penultimateIfExists] = this.fills.slice().reverse();
        const lastNativeFillIfExists =
            last.source === ERC20BridgeSource.Native &&
            penultimateIfExists &&
            penultimateIfExists.source !== ERC20BridgeSource.Native
                ? last
                : undefined;
        // By prepending native paths to the front they cannot split on-chain sources and incur
        // an additional protocol fee. I.e [Uniswap,Native,Kyber] becomes [Native,Uniswap,Kyber]
        // In the previous step we dropped any hanging Native partial fills, as to not fully fill
        const nativeFills = this.fills.filter(f => f.source === ERC20BridgeSource.Native);
        this.fills = [...nativeFills.filter(f => f !== lastNativeFillIfExists), ...fallback.fills];
        // Recompute the source flags
        this.sourceFlags = this.fills.reduce((flags, fill) => (flags |= fill.flags), 0);
        return this;
    }

    public collapse(opts: CreateOrderFromPathOpts): CollapsedPath {
        const [makerToken, takerToken] = getMakerTakerTokens(opts);
        const collapsedFills = this.collapsedFills === undefined ? this._collapseFills() : this.collapsedFills;
        this.orders = [];
        for (let i = 0; i < collapsedFills.length; ) {
            if (collapsedFills[i].source === ERC20BridgeSource.Native) {
                this.orders.push(createNativeOrder(collapsedFills[i] as NativeCollapsedFill));
                ++i;
                continue;
            }
            // If there are contiguous bridge orders, we can batch them together.
            const contiguousBridgeFills = [collapsedFills[i]];
            for (let j = i + 1; j < collapsedFills.length; ++j) {
                if (collapsedFills[j].source === ERC20BridgeSource.Native) {
                    break;
                }
                contiguousBridgeFills.push(collapsedFills[j]);
            }
            // Always use DexForwarderBridge unless configured not to
            if (!opts.shouldBatchBridgeOrders) {
                this.orders.push(createBridgeOrder(contiguousBridgeFills[0], makerToken, takerToken, opts));
                i += 1;
            } else {
                this.orders.push(createBatchedBridgeOrder(contiguousBridgeFills, opts));
                i += contiguousBridgeFills.length;
            }
        }
        return this as CollapsedPath;
    }

    public size(): PathSize {
        return this._size;
    }

    public adjustedSize(): PathSize {
        const { input, output } = this._adjustedSize;
        const { exchangeProxyOverhead, ethToOutputRate, ethToInputRate } = this.pathPenaltyOpts;
        const gasOverhead = exchangeProxyOverhead(this.sourceFlags);
        const pathPenalty = !ethToOutputRate.isZero()
            ? ethToOutputRate.times(gasOverhead)
            : ethToInputRate.times(gasOverhead).times(output.dividedToIntegerBy(input));
        return {
            input,
            output: this.side === MarketOperation.Sell ? output.minus(pathPenalty) : output.plus(pathPenalty),
        };
    }

    public adjustedCompleteRate(): BigNumber {
        const { input, output } = this.adjustedSize();
        return getCompleteRate(this.side, input, output, this.targetInput);
    }

    public adjustedRate(): BigNumber {
        const { input, output } = this.adjustedSize();
        return getRate(this.side, input, output);
    }

    public adjustedSlippage(maxRate: BigNumber): number {
        if (maxRate.eq(0)) {
            return 0;
        }
        const totalRate = this.adjustedRate();
        const rateChange = maxRate.minus(totalRate);
        return rateChange.div(maxRate).toNumber();
    }

    public isBetterThan(other: Path): boolean {
        if (!this.targetInput.isEqualTo(other.targetInput)) {
            throw new Error(`Target input mismatch: ${this.targetInput} !== ${other.targetInput}`);
        }
        const { targetInput } = this;
        const { input } = this._size;
        const { input: otherInput } = other._size;
        if (input.isLessThan(targetInput) || otherInput.isLessThan(targetInput)) {
            return input.isGreaterThan(otherInput);
        } else {
            return this.adjustedCompleteRate().isGreaterThan(other.adjustedCompleteRate());
        }
        // if (otherInput.isLessThan(targetInput)) {
        //     return input.isGreaterThan(otherInput);
        // } else if (input.isGreaterThanOrEqualTo(targetInput)) {
        //     return this.adjustedCompleteRate().isGreaterThan(other.adjustedCompleteRate());
        // }
        // return false;
    }

    public isComplete(): boolean {
        const { input } = this._size;
        return input.gte(this.targetInput);
    }

    public isValid(skipDuplicateCheck: boolean = false): boolean {
        for (let i = 0; i < this.fills.length; ++i) {
            // Fill must immediately follow its parent.
            if (this.fills[i].parent) {
                if (i === 0 || this.fills[i - 1] !== this.fills[i].parent) {
                    return false;
                }
            }
            if (!skipDuplicateCheck) {
                // Fill must not be duplicated.
                for (let j = 0; j < i; ++j) {
                    if (this.fills[i] === this.fills[j]) {
                        return false;
                    }
                }
            }
        }
        return doSourcesConflict(this.sourceFlags);
    }

    public isValidNextFill(fill: Fill): boolean {
        if (this.fills.length === 0) {
            return !fill.parent;
        }
        if (this.fills[this.fills.length - 1] === fill.parent) {
            return true;
        }
        if (fill.parent) {
            return false;
        }
        return doSourcesConflict(this.sourceFlags | fill.flags);
    }

    private _collapseFills(): ReadonlyArray<CollapsedFill> {
        this.collapsedFills = [];
        for (const fill of this.fills) {
            const source = fill.source;
            if (this.collapsedFills.length !== 0 && source !== ERC20BridgeSource.Native) {
                const prevFill = this.collapsedFills[this.collapsedFills.length - 1];
                // If the last fill is from the same source, merge them.
                if (prevFill.sourcePathId === fill.sourcePathId) {
                    prevFill.input = prevFill.input.plus(fill.input);
                    prevFill.output = prevFill.output.plus(fill.output);
                    prevFill.fillData = fill.fillData;
                    prevFill.subFills.push(fill);
                    continue;
                }
            }
            (this.collapsedFills as CollapsedFill[]).push({
                sourcePathId: fill.sourcePathId,
                source: fill.source,
                fillData: fill.fillData,
                input: fill.input,
                output: fill.output,
                subFills: [fill],
            });
        }
        return this.collapsedFills;
    }

    private _addFillSize(fill: Fill): void {
        if (this._size.input.plus(fill.input).isGreaterThan(this.targetInput)) {
            const remainingInput = this.targetInput.minus(this._size.input);
            const scaledFillOutput = fill.output.times(remainingInput.div(fill.input));
            this._size.input = this.targetInput;
            this._size.output = this._size.output.plus(scaledFillOutput);
            // Penalty does not get interpolated.
            const penalty = fill.adjustedOutput.minus(fill.output);
            this._adjustedSize.input = this.targetInput;
            this._adjustedSize.output = this._adjustedSize.output.plus(scaledFillOutput).plus(penalty);
        } else {
            this._size.input = this._size.input.plus(fill.input);
            this._size.output = this._size.output.plus(fill.output);
            this._adjustedSize.input = this._adjustedSize.input.plus(fill.input);
            this._adjustedSize.output = this._adjustedSize.output.plus(fill.adjustedOutput);
        }
    }
}

export interface CollapsedPath extends Path {
    readonly collapsedFills: ReadonlyArray<CollapsedFill>;
    readonly orders: OptimizedMarketOrder[];
}

const MULTIBRIDGE_SOURCES = SOURCE_FLAGS.LiquidityProvider | SOURCE_FLAGS.Uniswap;
export function doSourcesConflict(flags: number): boolean {
    const multiBridgeConflict = flags & SOURCE_FLAGS.MultiBridge && flags & MULTIBRIDGE_SOURCES;
    return !multiBridgeConflict;
}
