import { BigNumber } from '@0x/utils';

import { MarketOperation } from '../../types';

import { ZERO_AMOUNT } from './constants';
import { clipPathToInput, getPathAdjustedRate, getPathAdjustedCompleteRate, getPathSize, arePathFlagsAllowed, isValidPath } from './fills';
import { Fill } from './types';

// tslint:disable: prefer-for-of custom-no-magic-numbers completed-docs

const RUN_LIMIT_DECAY_FACTOR = 0.75;

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
    // Sort paths by descending adjusted completed rate.
    const sortedPaths = paths
        .slice(0)
        .sort((a, b) =>
            getPathAdjustedRate(side, b, targetInput)
                .comparedTo(getPathAdjustedRate(side, a, targetInput)),
        );
    let optimalPath = sortedPaths[0] || [];
    // console.log(optimalPath.map(f => `${f.source}-${f.sourcePathId.slice(0,4)}-${f.index}: ${f.rate}`));
    for (const [i, path] of sortedPaths.slice(1).entries()) {
        optimalPath = stackPaths(side, optimalPath, path, targetInput);
        // console.log(optimalPath.map(f => `${f.source}-${f.sourcePathId.slice(0,4)}-${f.index}: ${f.rate}`));
        // Yield to event loop.
        await Promise.resolve();
    }
    return isPathComplete(optimalPath, targetInput) ? optimalPath : undefined;
}

function stackPaths(
    side: MarketOperation,
    pathA: Fill[],
    pathB: Fill[],
    targetInput: BigNumber,
): Fill[] {
    if (pathB.length === 0 || targetInput.lte(0)) {
        return pathA;
    }
    for (let i = 0; i < pathA.length; ++i) {
        const head = pathA.slice(0, i);
        const tail = pathA.slice(i);
        const [headInput,] = getPathSize(head, targetInput);
        const remainingInput = BigNumber.max(targetInput.minus(headInput), 0);
        if (remainingInput.eq(0)) {
            return head;
        }
        const tailRate = getPathAdjustedCompleteRate(side, tail, remainingInput);
        const newTailRate = getPathAdjustedCompleteRate(side, pathB, remainingInput);
        // console.log(tail.length, tailRate.div(newTailRate), remainingInput.div('1e18'));
        if (tailRate.lt(newTailRate)) {
            if (tail.length) {
                // console.log(`<${tail[0].source}-${tail[0].sourcePathId.slice(0,4)}-${tail[0].index}`);
            } else {
                // console.log(`>${head[head.length-1].source}-${head[head.length-1].sourcePathId.slice(0,4)}-${head[head.length-1].index}`);
            }
            const n = tail.findIndex(v => !v.parent);
            const _tail = tail.slice(n === -1 ? tail.length : n);
            return [
                ...head,
                ...stackPaths(side, clipPathToInput(pathB, remainingInput), _tail, remainingInput),
            ];
        }
    }
    const [pathAInput,] = getPathSize(pathA, targetInput);
    if (pathAInput.gte(targetInput)) {
        return pathA;
    }
    return [...pathA, ...clipPathToInput(pathB, targetInput.minus(pathAInput))];
}

function mixPaths(
    side: MarketOperation,
    pathA: Fill[],
    pathB: Fill[],
    targetInput: BigNumber,
    maxSteps: number,
): Fill[] {
    const _maxSteps = Math.max(maxSteps, 64);
    let steps = 0;
    // We assume pathA is the better of the two initially.
    let bestPath: Fill[] = pathA;
    let [bestPathInput, bestPathOutput] = getPathSize(pathA, targetInput);
    let bestPathRate = getAdjustedCompleteRate(side, bestPathInput, bestPathOutput, targetInput);
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
        const rate = getAdjustedCompleteRate(side, input, output, targetInput);
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
    return remainingInput.times(fill.rate).plus(penalty);
}

function getAdjustedCompleteRate(side: MarketOperation, input: BigNumber, output: BigNumber, targetInput: BigNumber): BigNumber {
    if (input.eq(0) || output.eq(0) || targetInput.eq(0)) {
        return ZERO_AMOUNT;
    }
    // Penalize paths that fall short of the entire input amount by a factor of
    // input / targetInput => (i / t)
    if (side === MarketOperation.Sell) {
        // (o / i) * (i / t) => (o / t)
        return output.div(targetInput);
    }
    // (i / o) * (i / t)
    return input.div(output).times(input.div(targetInput));
}

function getAdjustedRate(side: MarketOperation, input: BigNumber, output: BigNumber): BigNumber {
    if (input.eq(0) || output.eq(0)) {
        return ZERO_AMOUNT;
    }
    return side === MarketOperation.Sell ? output.div(input) : input.div(output);
}
