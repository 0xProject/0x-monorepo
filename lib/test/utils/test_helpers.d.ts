/// <reference types="chai" />
import { BigNumber } from '@0x/utils';
export declare const testHelpers: {
    expectInsufficientLiquidityErrorAsync: (expect: Chai.ExpectStatic, functionWhichTriggersErrorAsync: () => Promise<void>, expectedAmountAvailableToFill: BigNumber) => Promise<void>;
};
//# sourceMappingURL=test_helpers.d.ts.map