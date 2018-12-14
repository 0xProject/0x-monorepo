import { BigNumber } from '@0x/utils';

import { AssetBuyerError } from './types';

/**
 * Error class representing insufficient asset liquidity
 */
export class InsufficientAssetLiquidityError extends Error {
    public amountAvailableToFill?: BigNumber;
    constructor(amountAvailableToFill?: BigNumber) {
        super(AssetBuyerError.InsufficientAssetLiquidity);
        this.amountAvailableToFill = amountAvailableToFill;
        // Setting prototype so instanceof works.  See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, InsufficientAssetLiquidityError.prototype);
    }
}
