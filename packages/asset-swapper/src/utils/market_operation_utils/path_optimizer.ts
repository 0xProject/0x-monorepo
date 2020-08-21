import { BigNumber } from '@0x/utils';

import { MarketOperation } from '../../types';
import { Profiler } from '../profiler';

import { ZERO_AMOUNT } from './constants';
import {
    arePathFlagsAllowed,
    getCompleteRate,
    getPathAdjustedCompleteRate,
    getPathAdjustedRate,
    getPathAdjustedSize,
    getPathSize,
    isValidPath,
} from './fills';
import { Fill } from './types';

// tslint:disable: prefer-for-of custom-no-magic-numbers completed-docs no-bitwise

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
    return Profiler.timeAsync(
        'findOptimalPathAsync()',
        async () => {
          // Sort paths by descending adjusted completed rate.
            const sortedPaths = paths
                .slice(0)
                .sort((a, b) =>
                    getPathAdjustedCompleteRate(side, b, targetInput).comparedTo(
                        getPathAdjustedCompleteRate(side, a, targetInput),
                    ),
                );
            let optimalPath = sortedPaths[0] || [];
            for (const [i, path] of sortedPaths.slice(1).entries()) {
                optimalPath = mixPaths(side, optimalPath, path, targetInput, runLimit * RUN_LIMIT_DECAY_FACTOR ** i);
                // Yield to event loop.
                await Promise.resolve();
            }
            return isPathComplete(optimalPath, targetInput) ? optimalPath : undefined;
        },
    );
  }

function mixPaths(
    side: MarketOperation,
    pathA: Fill[],
    pathB: Fill[],
    targetInput: BigNumber,
    maxSteps: number,
): Fill[] {
    const _maxSteps = Math.max(maxSteps, 32);
    let steps = 0;
    // We assume pathA is the better of the two initially.
    let bestPath: Fill[] = pathA;
    let [bestPathInput, bestPathOutput] = getPathAdjustedSize(pathA, targetInput);
    let bestPathRate = getCompleteRate(side, bestPathInput, bestPathOutput, targetInput);
    const _isBetterPath = (input: BigNumber, rate: BigNumber) => {
        if (bestPathInput.lt(targetInput)) {
            return input.gt(bestPathInput);
        } else if (input.gte(targetInput)) {
            return rate.gt(bestPathRate);
        }
        return false;
    };
    const _walk = (path: Fill[], input: BigNumber, output: BigNumber, flags: number, remainingFills: Fill[]) => {
        steps += 1;
        const rate = getCompleteRate(side, input, output, targetInput);
        if (_isBetterPath(input, rate)) {
            bestPath = path;
            bestPathInput = input;
            bestPathOutput = output;
            bestPathRate = rate;
        }
        const remainingInput = targetInput.minus(input);
        if (remainingInput.gt(0)) {
            for (let i = 0; i < remainingFills.length && steps < _maxSteps; ++i) {
                const fill = remainingFills[i];
                // Only walk valid paths.
                if (!isValidNextPathFill(path, flags, fill)) {
                    continue;
                }
                // Remove this fill from the next list of candidate fills.
                const nextRemainingFills = remainingFills.slice();
                nextRemainingFills.splice(i, 1);
                // Recurse.
                _walk(
                    [...path, fill],
                    input.plus(BigNumber.min(remainingInput, fill.input)),
                    output.plus(
                        // Clip the output of the next fill to the remaining
                        // input.
                        clipFillAdjustedOutput(fill, remainingInput),
                    ),
                    flags | fill.flags,
                    nextRemainingFills,
                );
            }
        }
    };
    const allFills = [...pathA, ...pathB];
    const sources = allFills.filter(f => f.index === 0).map(f => f.sourcePathId);
    const rateBySource = Object.assign(
        {},
        ...sources.map(s => ({
            [s]: getPathAdjustedRate(side, allFills.filter(f => f.sourcePathId === s), targetInput),
        })),
    );
    // Sort subpaths by rate and keep fills contiguous to improve our
    // chances of walking ideal, valid paths first.
    const sortedFills = allFills.sort((a, b) => {
        if (a.sourcePathId !== b.sourcePathId) {
            return rateBySource[b.sourcePathId].comparedTo(rateBySource[a.sourcePathId]);
        }
        return a.index - b.index;
    });
    _walk([], ZERO_AMOUNT, ZERO_AMOUNT, 0, sortedFills);
    if (!isValidPath(bestPath)) {
        throw new Error('nooope');
    }
    return bestPath;
}

function isValidNextPathFill(path: Fill[], pathFlags: number, fill: Fill): boolean {
    if (path.length === 0) {
        return !fill.parent;
    }
    if (path[path.length - 1] === fill.parent) {
        return true;
    }
    if (fill.parent) {
        return false;
    }
    return arePathFlagsAllowed(pathFlags | fill.flags);
}

function isPathComplete(path: Fill[], targetInput: BigNumber): boolean {
    const [input] = getPathSize(path);
    return input.gte(targetInput);
}

function clipFillAdjustedOutput(fill: Fill, remainingInput: BigNumber): BigNumber {
    if (fill.input.lte(remainingInput)) {
        return fill.adjustedOutput;
    }
    // Penalty does not get interpolated.
    const penalty = fill.adjustedOutput.minus(fill.output);
    return remainingInput.times(fill.output.div(fill.input)).plus(penalty);
}
