import { BigNumber } from '@0x/utils';

import { constants } from '../../constants';

import { Fill } from './types';

const { ZERO_AMOUNT } = constants;

// Used internally by `FillsOptimizer`.
interface FillsOptimizerContext {
    currentPath: Fill[];
    currentPathInput: BigNumber;
    currentPathOutput: BigNumber;
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
    private _optimalPathOutput: BigNumber = ZERO_AMOUNT;

    constructor(runLimit: number, shouldMinimize?: boolean) {
        this._runLimit = runLimit;
        this._shouldMinimize = !!shouldMinimize;
    }

    public optimize(fills: Fill[], input: BigNumber, upperBoundPath?: Fill[]): Fill[] | undefined {
        this._currentRunCount = 0;
        this._optimalPath = upperBoundPath;
        this._optimalPathOutput = upperBoundPath ? getPathOutput(upperBoundPath, input) : ZERO_AMOUNT;
        const ctx = {
            currentPath: [],
            currentPathInput: ZERO_AMOUNT,
            currentPathOutput: ZERO_AMOUNT,
            currentPathFlags: 0,
        };
        // Visit all valid combinations of fills to find the optimal path.
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
        return comparePathOutputs(a, b, this._shouldMinimize);
    }
}

/**
 * Compute the total output for a fill path, optionally clipping the input
 * to `maxInput`.
 */
export function getPathOutput(path: Fill[], maxInput?: BigNumber): BigNumber {
    let currentInput = ZERO_AMOUNT;
    let currentOutput = ZERO_AMOUNT;
    for (const fill of path) {
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
    return currentOutput;
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
    return BigNumber.min(fill.output, fill.output.div(fill.input).times(partialInput)).integerValue(
        BigNumber.ROUND_DOWN,
    );
}
