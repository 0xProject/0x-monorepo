import { BigNumber } from '../../configured_bignumber';
import { RevertError } from '../../revert_error';

// tslint:disable:max-classes-per-file

export class InvalidFromAddressError extends RevertError {
    constructor(from?: string) {
        super('InvalidFromAddressError', 'InvalidFromAddressError(address from)', { from });
    }
}

export class AmountsLengthMustEqualOneError extends RevertError {
    constructor(amountsLength?: BigNumber | number | string) {
        super('AmountsLengthMustEqualOneError', 'AmountsLengthMustEqualOneError(uint256 amountsLength)', {
            amountsLength,
        });
    }
}

export class TooFewBrokerAssetsProvidedError extends RevertError {
    constructor(numBrokeredAssets?: BigNumber | number | string) {
        super('TooFewBrokerAssetsProvidedError', 'TooFewBrokerAssetsProvidedError(uint256 numBrokeredAssets)', {
            numBrokeredAssets,
        });
    }
}

export class InvalidFunctionSelectorError extends RevertError {
    constructor(selector?: string) {
        super('InvalidFunctionSelectorError', 'InvalidFunctionSelectorError(bytes4 selector)', { selector });
    }
}

const types = [
    InvalidFromAddressError,
    AmountsLengthMustEqualOneError,
    TooFewBrokerAssetsProvidedError,
    InvalidFunctionSelectorError,
];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
