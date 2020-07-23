import { BigNumber } from '@0x/utils';

import { MarketOperation } from '../../types';

import { ZERO_AMOUNT } from './constants';
import { getPathAdjustedSize, getPathSize, isValidPath } from './fills';
import { Fill } from './types';

// tslint:disable: prefer-for-of custom-no-magic-numbers completed-docs

const RUN_LIMIT_DECAY_FACTOR = 0.8;
// Used to yield the event loop when performing CPU intensive tasks
// tislint:disable-next-line:no-inferred-empty-object-type
const setImmediateAsync = async (delay: number = 0) =>
    new Promise<void>(resolve => setImmediate(() => resolve(), delay));

/**
 * Find the optimal mixture of paths that maximizes (for sells) or minimizes
 * (for buys) output, while meeting the input requirement.
 */
export async function findOptimalPathAsync(
    side: MarketOperation,
    paths: Fill[][],
    targetInput: BigNumber,
    runLimit: number = 2 ** 15,
): Promise<Fill[] | undefined> {
    // Sort paths in descending order by adjusted output amount.
    const sortedPaths = paths
        .slice(0)
        .sort((a, b) => getPathAdjustedSize(b, targetInput)[1].comparedTo(getPathAdjustedSize(a, targetInput)[1]));
    let optimalPath = sortedPaths[0] || [];
    for (const [i, path] of sortedPaths.slice(1).entries()) {
        optimalPath = mixPaths(side, optimalPath, path, targetInput, runLimit * RUN_LIMIT_DECAY_FACTOR ** i);
        await setImmediateAsync();
    }
    return isPathComplete(optimalPath, targetInput) ? optimalPath : undefined;
}

function mixPaths(
    side: MarketOperation,
    pathA: Fill[],
    pathB: Fill[],
    targetInput: BigNumber,
    maxSteps: number,
): Fill[] {
    let bestPath: Fill[] = [];
    let bestPathInput = ZERO_AMOUNT;
    let bestPathRate = ZERO_AMOUNT;
    let steps = 0;
    const _isBetterPath = (input: BigNumber, rate: BigNumber) => {
        if (bestPathInput.lt(targetInput)) {
            return input.gt(bestPathInput);
        } else if (input.gte(targetInput)) {
            return rate.gt(bestPathRate);
        }
        return false;
    };
    const _walk = (path: Fill[], input: BigNumber, output: BigNumber, allFills: Fill[]) => {
        steps += 1;
        const rate = getRate(side, input, output);
        if (_isBetterPath(input, rate)) {
            bestPath = path;
            bestPathInput = input;
            bestPathRate = rate;
        }
        const remainingInput = targetInput.minus(input);
        if (remainingInput.gt(0)) {
            for (let i = 0; i < allFills.length; ++i) {
                const fill = allFills[i];
                if (steps + 1 >= maxSteps) {
                    break;
                }
                const childPath = [...path, fill];
                if (!isValidPath(childPath, true)) {
                    continue;
                }
                // Remove this fill from the next list of candidate fills.
                const nextAllFills = allFills.slice();
                nextAllFills.splice(i, 1);
                // Recurse.
                _walk(
                    childPath,
                    input.plus(BigNumber.min(remainingInput, fill.input)),
                    output.plus(
                        // Clip the output of the next fill to the remaining
                        // input.
                        clipFillAdjustedOutput(fill, remainingInput),
                    ),
                    nextAllFills,
                );
            }
        }
    };
    _walk(bestPath, ZERO_AMOUNT, ZERO_AMOUNT, [...pathA, ...pathB].sort((a, b) => b.rate.comparedTo(a.rate)));
    return bestPath;
}

function isPathComplete(path: Fill[], targetInput: BigNumber): boolean {
    const [input] = getPathSize(path);
    return input.gte(targetInput);
}

function clipFillAdjustedOutput(fill: Fill, remainingInput: BigNumber): BigNumber {
    if (fill.input.lte(remainingInput)) {
        return fill.adjustedOutput;
    }
    const penalty = fill.adjustedOutput.minus(fill.output);
    return remainingInput.times(fill.rate).plus(penalty);
}

function getRate(side: MarketOperation, input: BigNumber, output: BigNumber): BigNumber {
    if (input.eq(0) || output.eq(0)) {
        return ZERO_AMOUNT;
    }
    if (side === MarketOperation.Sell) {
        return output.div(input);
    }
    return input.div(output);
}
