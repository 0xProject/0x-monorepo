import { BigNumber } from '@0x/utils';

import { SwapQuoterError } from './types';

/**
 * Error class representing insufficient asset liquidity
 */
export class InsufficientAssetLiquidityError extends Error {
    /**
     * The amount availabe to fill (in base units) factoring in slippage.
     */
    public amountAvailableToFill: BigNumber;
    /**
     * @param amountAvailableToFill The amount availabe to fill (in base units) factoring in slippage
     */
    constructor(amountAvailableToFill: BigNumber) {
        super(SwapQuoterError.InsufficientAssetLiquidity);
        this.amountAvailableToFill = amountAvailableToFill;
        // Setting prototype so instanceof works.  See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, InsufficientAssetLiquidityError.prototype);
    }
}
