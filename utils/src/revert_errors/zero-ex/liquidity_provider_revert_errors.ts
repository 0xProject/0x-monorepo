import { RevertError } from '../../revert_error';
import { Numberish } from '../../types';

// tslint:disable:max-classes-per-file
export class LiquidityProviderIncompleteSellError extends RevertError {
    constructor(
        providerAddress?: string,
        makerToken?: string,
        takerToken?: string,
        sellAmount?: Numberish,
        boughtAmount?: Numberish,
        minBuyAmount?: Numberish,
    ) {
        super(
            'LiquidityProviderIncompleteSellError',
            'LiquidityProviderIncompleteSellError(address providerAddress, address makerToken, address takerToken, uint256 sellAmount, uint256 boughtAmount, uint256 minBuyAmount)',
            {
                providerAddress,
                makerToken,
                takerToken,
                sellAmount,
                boughtAmount,
                minBuyAmount,
            },
        );
    }
}

export class NoLiquidityProviderForMarketError extends RevertError {
    constructor(xAsset?: string, yAsset?: string) {
        super(
            'NoLiquidityProviderForMarketError',
            'NoLiquidityProviderForMarketError(address xAsset, address yAsset)',
            {
                xAsset,
                yAsset,
            },
        );
    }
}

const types = [LiquidityProviderIncompleteSellError, NoLiquidityProviderForMarketError];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
