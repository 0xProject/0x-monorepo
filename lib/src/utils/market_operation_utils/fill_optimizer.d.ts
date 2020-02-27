import { BigNumber } from '@0x/utils';
import { Fill } from './types';
/**
 * Class for finding optimized fill paths.
 */
export declare class FillsOptimizer {
    private readonly _runLimit;
    private readonly _shouldMinimize;
    private _currentRunCount;
    private _optimalPath?;
    private _optimalPathAdjustedOutput;
    constructor(runLimit: number, shouldMinimize?: boolean);
    optimize(fills: Fill[], input: BigNumber, upperBoundPath?: Fill[]): Fill[] | undefined;
    private _walk;
    private _updateOptimalPath;
    private _compareOutputs;
}
/**
 * Compute the total output minus penalty for a fill path, optionally clipping the input
 * to `maxInput`.
 */
export declare function getPathAdjustedOutput(path: Fill[], maxInput?: BigNumber): BigNumber;
/**
 * Compares two rewards, returning -1, 0, or 1
 * if `a` is less than, equal to, or greater than `b`.
 */
export declare function comparePathOutputs(a: BigNumber, b: BigNumber, shouldMinimize: boolean): number;
/**
 * Sort a path by adjusted input -> output rate while keeping sub-fills contiguous.
 */
export declare function sortFillsByAdjustedRate(path: Fill[], shouldMinimize?: boolean): Fill[];
//# sourceMappingURL=fill_optimizer.d.ts.map