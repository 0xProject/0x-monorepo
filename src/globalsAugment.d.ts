import BigNumber from 'bignumber.js';

declare global {
    /* tslint:disable */
    namespace Chai {
        interface NumberComparer {
            (value: number|BigNumber, message?: string): Assertion;
        }
        interface NumericComparison {
            greaterThan: NumberComparer;
        }
    }
    /* tslint:enable */
    interface DecodedLogArg {
        name: string;
        value: string|BigNumber;
    }
}
