import { BigNumber } from './configured_bignumber';
import { RevertError } from './revert_error';
import * as _ from 'lodash';

// tslint:disable:max-classes-per-file

export class Uint256OverflowError extends RevertError {
    constructor(a?: BigNumber | number | string, b?: BigNumber | number | string) {
        super('Uint256OverflowError', 'Uint256OverflowError(uint256 a, uint256 b)', {
            a,
            b,
        });
    }
}

export class Uint256UnderflowError extends RevertError {
    constructor(a?: BigNumber | number | string, b?: BigNumber | number | string) {
        super('Uint256UnderflowError', 'Uint256UnderflowError(uint256 a, uint256 b)', {
            a,
            b,
        });
    }
}

const types = [
    Uint256OverflowError,
    Uint256UnderflowError,
];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
