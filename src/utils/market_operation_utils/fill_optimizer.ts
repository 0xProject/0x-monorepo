import { BigNumber } from '@0x/utils';

import { constants } from '../../constants';

import { Fill } from './types';

const { ZERO_AMOUNT } = constants;

// Used internally by `FillsOptimizer`.
interface FillsOptimizerContext {
    currentPath: Fill[];
    currentPathInput: BigNumber;
    currentPathAdjustedOutput: BigNumber;
    currentPathFlags: number;
}

/**
 * Class for finding optimized fill paths.
 */
export class FillsOptimizer {
    private readonly _runLimit: number;
    private readonly _shouldMinimize: boolean;
    private _currentRunCount: number = 0;
    private _optimalPath?: Fill[] = undefined;
    private _optimalPathAdjustedOutput: BigNumber = ZERO_AMOUNT;

    constructor(runLimit: number, shouldMinimize?: boolean) {
        this._runLimit = runLimit;
        this._shouldMinimize = !!shouldMinimize;
    }

    public optimize(fills: Fill[], input: BigNumber, upperBoundPath?: Fill[]): Fill[] | undefined {
        this._currentRunCount = 0;
        this._optimalPath = upperBoundPath;
        this._optimalPathAdjustedOutput = upperBoundPath ? getPathAdjustedOutput(upperBoundPath, input) : ZERO_AMOUNT;
        const ctx = {
            currentPath: [],
            currentPathInput: ZERO_AMOUNT,
            currentPathAdjustedOutput: ZERO_AMOUNT,
            currentPathFlags: 0,
        };
        // Visit all valid combinations of fills to find the optimal path.
        this._walk(fills, input, ctx);
        if (this._optimalPath) {
            return sortFillsByAdjustedRate(this._optimalPath, this._shouldMinimize);
        }
        return undefined;
    }

    private _walk(fills: Fill[], input: BigNumber, ctx: FillsOptimizerContext): void {
        const { currentPath, currentPathInput, currentPathAdjustedOutput, currentPathFlags } = ctx;

        // Stop if the current path is already complete.
        if (currentPathInput.gte(input)) {
            this._updateOptimalPath(currentPath, currentPathAdjustedOutput);
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
            const nextPathAdjustedOutput = currentPathAdjustedOutput.plus(
                getPartialFillOutput(nextFill, nextPathInput.minus(currentPathInput)).minus(nextFill.fillPenalty),
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
                    currentPathAdjustedOutput: nextPathAdjustedOutput,
                    // tslint:disable-next-line: no-bitwise
                    currentPathFlags: nextPathFlags,
                },
            );
        }
    }

    private _updateOptimalPath(path: Fill[], adjustedOutput: BigNumber): void {
        if (!this._optimalPath || this._compareOutputs(adjustedOutput, this._optimalPathAdjustedOutput) === 1) {
            this._optimalPath = path;
            this._optimalPathAdjustedOutput = adjustedOutput;
        }
    }

    private _compareOutputs(a: BigNumber, b: BigNumber): number {
        return comparePathOutputs(a, b, this._shouldMinimize);
    }
}

/**
 * Compute the total output minus penalty for a fill path, optionally clipping the input
 * to `maxInput`.
 */
export function getPathAdjustedOutput(path: Fill[], maxInput?: BigNumber): BigNumber {
    let currentInput = ZERO_AMOUNT;
    let currentOutput = ZERO_AMOUNT;
    let currentPenalty = ZERO_AMOUNT;
    for (const fill of path) {
        currentPenalty = currentPenalty.plus(fill.fillPenalty);
        if (maxInput && currentInput.plus(fill.input).gte(maxInput)) {
            const partialInput = maxInput.minus(currentInput);
            currentOutput = currentOutput.plus(getPartialFillOutput(fill, partialInput));
            currentInput = partialInput;
            break;
        } else {
            currentInput = currentInput.plus(fill.input);
            currentOutput = currentOutput.plus(fill.output);
        }
    }
    return currentOutput.minus(currentPenalty);
}

/**
 * Compares two rewards, returning -1, 0, or 1
 * if `a` is less than, equal to, or greater than `b`.
 */
export function comparePathOutputs(a: BigNumber, b: BigNumber, shouldMinimize: boolean): number {
    return shouldMinimize ? b.comparedTo(a) : a.comparedTo(b);
}

// Get the partial output earned by a fill at input `partialInput`.
function getPartialFillOutput(fill: Fill, partialInput: BigNumber): BigNumber {
    return BigNumber.min(fill.output, fill.output.div(fill.input).times(partialInput));
}

/**
 * Sort a path by adjusted input -> output rate while keeping sub-fills contiguous.
 */
export function sortFillsByAdjustedRate(path: Fill[], shouldMinimize: boolean = false): Fill[] {
    return path.slice(0).sort((a, b) => {
        const rootA = getFillRoot(a);
        const rootB = getFillRoot(b);
        const adjustedRateA = rootA.output.minus(rootA.fillPenalty).div(rootA.input);
        const adjustedRateB = rootB.output.minus(rootB.fillPenalty).div(rootB.input);
        if ((!a.parent && !b.parent) || a.fillData.source !== b.fillData.source) {
            return shouldMinimize ? adjustedRateA.comparedTo(adjustedRateB) : adjustedRateB.comparedTo(adjustedRateA);
        }
        if (isFillAncestorOf(a, b)) {
            return -1;
        }
        if (isFillAncestorOf(b, a)) {
            return 1;
        }
        return 0;
    });
}

function getFillRoot(fill: Fill): Fill {
    let root = fill;
    while (root.parent) {
        root = root.parent;
    }
    return root;
}

function isFillAncestorOf(ancestor: Fill, fill: Fill): boolean {
    let currFill = fill.parent;
    while (currFill) {
        if (currFill === ancestor) {
            return true;
        }
        currFill = currFill.parent;
    }
    return false;
}
