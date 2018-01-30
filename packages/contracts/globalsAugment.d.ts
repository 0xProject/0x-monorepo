import { BigNumber } from '@0xproject/utils';

// HACK: This module overrides the Chai namespace so that we can use BigNumber types inside.
// Source: https://github.com/Microsoft/TypeScript/issues/7352#issuecomment-191547232
declare global {
    // HACK: In order to merge the bignumber declaration added by chai-bignumber to the chai Assertion
    // interface we must use `namespace` as the Chai definitelyTyped definition does. Since we otherwise
    // disallow `namespace`, we disable tslint for the following.
    /* tslint:disable */
    namespace Chai {
        interface NumberComparer {
            (value: number | BigNumber, message?: string): Assertion;
        }
        interface NumericComparison {
            greaterThan: NumberComparer;
        }
    }
    /* tslint:enable */
}
