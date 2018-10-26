import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

/**
 *  A BigNumber extension that is more flexible about decimal strings.
 *  Such as allowing:
 *  new BigNumberInput('0.') => 0
 *  new BigNumberInput('1.') => 1
 *  new BigNumberInput('1..') => still throws
 */
export class BigNumberInput extends BigNumber {
    private readonly _isEndingWithDecimal: boolean;
    constructor(bigNumberString: string) {
        const hasDecimalPeriod = _.endsWith(bigNumberString, '.');
        let internalString = bigNumberString;
        if (hasDecimalPeriod) {
            internalString = bigNumberString.slice(0, -1);
        }
        super(internalString);
        this._isEndingWithDecimal = hasDecimalPeriod;
    }
    public toDisplayString(): string {
        const internalString = super.toString();
        if (this._isEndingWithDecimal) {
            return `${internalString}.`;
        }
        return internalString;
    }
}
