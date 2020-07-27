import { BigNumber } from '@0x/utils';

import { MarketOperation } from '../../types';

import { ZERO_AMOUNT } from './constants';
import { getPathAdjustedRate, getPathSize, isValidPath } from './fills';
import { Fill } from './types';

// tslint:disable: prefer-for-of custom-no-magic-numbers completed-docs

const RUN_LIMIT_DECAY_FACTOR = 0.5;

/**
 * Find the optimal mixture of paths that maximizes (for sells) or minimizes
 * (for buys) output, while meeting the input requirement.
 */
export async function findOptimalPathAsync(
    side: MarketOperation,
    paths: Fill[][],
    targetInput: BigNumber,
    runLimit: number = 2 ** 8,
): Promise<Fill[] | undefined> {
    // Sort paths by descending adjusted rate.
    const sortedPaths = paths
        .slice(0)
        .sort((a, b) =>
            getPathAdjustedRate(side, b, targetInput).comparedTo(getPathAdjustedRate(side, a, targetInput)),
        );
    let optimalPath = sortedPaths[0] || [];
    for (const [i, path] of sortedPaths.slice(1).entries()) {
        optimalPath = mixPaths(side, optimalPath, path, targetInput, runLimit * RUN_LIMIT_DECAY_FACTOR ** i);
        // Yield to event loop.
        await Promise.resolve();
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
    const _maxSteps = Math.max(maxSteps, 16);
    let bestPath: Fill[] = pathA;
    let bestPathInput = getPathSize(pathA, targetInput)[0];
    let bestPathRate = getPathAdjustedRate(side, pathA, targetInput);
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
        const rate = getRate(side, targetInput, output);
        if (_isBetterPath(input, rate)) {
            bestPath = path;
            bestPathInput = input;
            bestPathRate = rate;
        }
        const remainingInput = targetInput.minus(input);
        if (remainingInput.gt(0)) {
            for (let i = 0; i < allFills.length && steps < _maxSteps; ++i) {
                const fill = allFills[i];
                const nextPath = [...path, fill];
                // Only walk valid paths.
                if (!isValidPath(nextPath, true)) {
                    continue;
                }
                // Remove this fill from the next list of candidate fills.
                const nextAllFills = allFills.slice();
                nextAllFills.splice(i, 1);
                // Recurse.
                _walk(
                    nextPath,
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
    const allPaths = [...pathA, ...pathB];
    const sources = allPaths.filter(f => f.index === 0).map(f => f.sourcePathId);
    const rateBySource = Object.assign(
        {},
        ...sources.map(s => ({
            [s]: getPathAdjustedRate(side, allPaths.filter(f => f.sourcePathId === s), targetInput),
        })),
    );
    _walk(
        [],
        ZERO_AMOUNT,
        ZERO_AMOUNT,
        // Sort subpaths by rate and keep fills contiguous to improve our
        // chances of walking ideal, valid paths first.
        allPaths.sort((a, b) => {
            if (a.sourcePathId !== b.sourcePathId) {
                return rateBySource[b.sourcePathId].comparedTo(rateBySource[a.sourcePathId]);
            }
            return a.index - b.index;
        }),
    );
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
