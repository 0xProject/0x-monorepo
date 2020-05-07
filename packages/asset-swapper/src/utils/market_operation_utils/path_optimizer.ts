import { BigNumber } from '@0x/utils';

import { MarketOperation } from '../../types';

import { ZERO_AMOUNT } from './constants';
import { getPathSize, isValidPath } from './fills';
import { Fill } from './types';

// tslint:disable: prefer-for-of custom-no-magic-numbers completed-docs

/**
 * Find the optimal mixture of paths that maximizes (for sells) or minimizes
 * (for buys) output, while meeting the input requirement.
 */
export function findOptimalPath(
    side: MarketOperation,
    paths: Fill[][],
    targetInput: BigNumber,
    runLimit?: number,
): Fill[] | undefined {
    let optimalPath = paths[0] || [];
    for (const path of paths.slice(1)) {
        optimalPath = mixPaths(side, optimalPath, path, targetInput, runLimit);
    }
    return isPathComplete(optimalPath, targetInput) ? optimalPath : undefined;
}

function mixPaths(
    side: MarketOperation,
    pathA: Fill[],
    pathB: Fill[],
    targetInput: BigNumber,
    maxSteps: number = 2 ** 15,
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
