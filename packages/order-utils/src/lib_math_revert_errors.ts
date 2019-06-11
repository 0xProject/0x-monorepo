import { BigNumber, RevertError } from '@0x/utils';
import * as _ from 'lodash';

// tslint:disable:max-classes-per-file

export class DivisionByZeroError extends RevertError {
    constructor() {
        super('DivisionByZeroError', 'DivisionByZeroError()', {});
    }
}

export class RoundingError extends RevertError {
    constructor(
        numerator?: BigNumber | number | string,
        denominator?: BigNumber | number | string,
        target?: BigNumber | number | string,
    ) {
        super('RoundingError', 'RoundingError(uint256 numerator, uint256 denominator, uint256 target)', {
            numerator,
            denominator,
            target,
        });
    }
}

const types = [DivisionByZeroError, RoundingError];

// Register the types we've defined.
for (const type of types) {
    RevertError.registerType(type);
}
