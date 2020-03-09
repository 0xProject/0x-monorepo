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
    // TODO(dorothy-zbornak): Convex paths (like kyber) should technically always be
    // inserted at the front of the path because a partial fill can invalidate them.
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
    const allFills = [...pathA, ...pathB].sort((a, b) => b.rate.comparedTo(a.rate));
    let bestPath: Fill[] = [];
    let bestPathInput = ZERO_AMOUNT;
    let bestPathRate = ZERO_AMOUNT;
    let steps = 0;
    const _isBetterPath = (input: BigNumber, rate: BigNumber) => {
        if (bestPathInput.lt(targetInput)) {
            return input.gt(bestPathInput);
        } else if (input.gte(bestPathInput)) {
            return rate.gt(bestPathRate);
        }
        return false;
    };
    const _walk = (path: Fill[], input: BigNumber, output: BigNumber) => {
        steps += 1;
        const rate = getRate(side, input, output);
        if (_isBetterPath(input, rate)) {
            bestPath = path;
            bestPathInput = input;
            bestPathRate = rate;
        }
        if (input.lt(targetInput)) {
            for (const fill of allFills) {
                if (steps >= maxSteps) {
                    break;
                }
                const childPath = [...path, fill];
                if (!isValidPath(childPath)) {
                    continue;
                }
                _walk(childPath, input.plus(fill.input), output.plus(fill.adjustedOutput));
            }
        }
    };
    _walk(bestPath, ZERO_AMOUNT, ZERO_AMOUNT);
    return bestPath;
}

function isPathComplete(path: Fill[], targetInput: BigNumber): boolean {
    const [input] = getPathSize(path);
    return input.gte(targetInput);
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
