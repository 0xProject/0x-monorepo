import { BigNumber } from '@0x/utils';

import { MarketOperation } from '../../types';

import { getPathAdjustedSize, getPathSize, isValidPath } from './fills';
import { Fill } from './types';

// tslint:disable: prefer-for-of custom-no-magic-numbers completed-docs

/**
 * Find the optimal mixture of paths that maximizes (for sells) or minimizes
 * (for buys) output, while meeting the input requirement.
 */
export function findOptimalPath(side: MarketOperation, paths: Fill[][], targetInput: BigNumber): Fill[] | undefined {
    // Get all convex and concave rate paths.
    const [convexPaths, concavePaths] = splitPathsByRateConvexity(paths);
    // Hill climb convex paths.
    let optimalPath = hillClimbToOptimalPath(convexPaths, targetInput);
    // Attempt to splice in concave paths.
    for (const path of concavePaths) {
        // TODO(dorothy-zbornak): This will probably not be optimal if we are dealing
        // more than one concave path. Right now there's just Kyber.
        optimalPath = prependConcavePath(side, optimalPath, path, targetInput);
    }
    return isPathComplete(optimalPath, targetInput) ? optimalPath : undefined;
}

const RATE_DECIMALS = 8;

function hillClimbToOptimalPath(paths: Fill[][], targetInput: BigNumber): Fill[] {
    // Flatten and sort path fills by descending ADJUSTED rate.
    const fills = paths
        .reduce((acc, p) => acc.concat(p))
        .sort((a, b) => b.adjustedRate.dp(RATE_DECIMALS).comparedTo(a.adjustedRate.dp(RATE_DECIMALS)));
    // Build up a path by picking the next best, valid fill until we meet our input target.
    const path: Fill[] = [];
    while (!isPathComplete(path, targetInput)) {
        let wasAdded = false;
        for (const fill of fills) {
            // If we can just legally append this fill to the path, do that.
            if (isValidPath([...path, fill])) {
                path.push(fill);
                wasAdded = true;
                break;
            } else if (fill.parent && !path.includes(fill)) {
                // If the fill's parent is in the path, we can insert it right
                // after it.
                for (let i = 0; i < path.length; ++i) {
                    if (path[i] === fill.parent) {
                        path.splice(i + 1, 0, fill);
                        wasAdded = true;
                        break;
                    }
                }
                if (wasAdded) {
                    break;
                }
            }
        }
        if (!wasAdded) {
            break;
        }
    }
    return path;
}

function prependConcavePath(
    side: MarketOperation,
    convexPath: Fill[],
    concavePath: Fill[],
    targetInput: BigNumber,
): Fill[] {
    // Try to prepend increasing lenths of the the concave path, keeping track
    // of the best path.
    // HACK(dorothy-zbornak): We prepend because placing it at the end has the
    // possibility of turning it into a partial fill, which can invalidate the
    // quote for Kyber.
    let bestPath = convexPath;
    for (let i = 0; i < convexPath.length; ++i) {
        const path = concavePath.slice(0, i);
        const [concaveInput] = getPathSize(path);
        if (concaveInput.lt(targetInput)) {
            const remainingInput = targetInput.minus(concaveInput);
            // We sub-optimize the fills from the original path.
            const tailPath = hillClimbToOptimalPath(getSubPaths(convexPath), remainingInput);
            path.push(...tailPath);
        }
        bestPath = findBestCompletePath(side, [bestPath, path], targetInput) || bestPath;
    }
    return bestPath;
}

function getSubPaths(path: Fill[]): Fill[][] {
    const fillsBySource: { [source: string]: Fill[] } = {};
    for (const fill of path) {
        fillsBySource[fill.source] = fillsBySource[fill.source] || [];
        fillsBySource[fill.source].push(fill);
    }
    return Object.values(fillsBySource);
}

function isPathComplete(path: Fill[], targetInput: BigNumber): boolean {
    const [input] = getPathSize(path);
    return input.gte(targetInput);
}

function findBestCompletePath(side: MarketOperation, paths: Fill[][], targetInput: BigNumber): Fill[] | undefined {
    let bestPath: Fill[] | undefined;
    for (const path of paths) {
        const [input, output] = getPathAdjustedSize(path, targetInput);
        if (input.gte(targetInput)) {
            continue;
        }
        if (bestPath) {
            const [, bestPathOutput] = getPathAdjustedSize(bestPath, targetInput);
            if (side === MarketOperation.Sell) {
                if (output.lt(bestPathOutput)) {
                    continue;
                }
            } else {
                if (output.gt(bestPathOutput)) {
                    continue;
                }
            }
        }
        bestPath = path;
    }
    return bestPath;
}

function splitPathsByRateConvexity(paths: Fill[][]): [Fill[][], Fill[][]] {
    const convexPaths: Fill[][] = [];
    const concavePaths: Fill[][] = [];
    for (const path of paths) {
        if (isPathConvex(path)) {
            convexPaths.push(path);
        } else {
            concavePaths.push(path);
        }
    }
    return [convexPaths, concavePaths];
}

function isPathConvex(path: Fill[]): boolean {
    // Convex paths have descending prices.
    // HACK(dorothy-zbornak): We use the the `rate` instead of the `adjustedRate`
    // because the `adjustedRate` can make paths appear artificially concave
    // due to the fee incurred on the first fill.
    for (let i = 1; i < path.length; ++i) {
        if (path[i - 1].rate.dp(RATE_DECIMALS).lt(path[i].rate.dp(RATE_DECIMALS))) {
            return false;
        }
    }
    return true;
}
