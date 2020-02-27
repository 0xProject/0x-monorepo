import { BigNumber } from '@0x/utils';
/**
 * Error class representing insufficient asset liquidity
 */
export declare class InsufficientAssetLiquidityError extends Error {
    /**
     * The amount availabe to fill (in base units) factoring in slippage.
     */
    amountAvailableToFill: BigNumber;
    /**
     * @param amountAvailableToFill The amount availabe to fill (in base units) factoring in slippage
     */
    constructor(amountAvailableToFill: BigNumber);
}
//# sourceMappingURL=errors.d.ts.map