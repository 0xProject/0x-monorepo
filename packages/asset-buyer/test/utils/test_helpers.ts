import { BigNumber } from '@0x/utils';

import { InsufficientAssetLiquidityError } from '../../src/errors';

export const testHelpers = {
    expectInsufficientLiquidityError: (
        expect: Chai.ExpectStatic,
        functionWhichTriggersError: () => void,
        expectedAmountAvailableToFill: BigNumber,
    ): void => {
        let wasErrorThrown = false;
        try {
            functionWhichTriggersError();
        } catch (e) {
            wasErrorThrown = true;
            expect(e).to.be.instanceOf(InsufficientAssetLiquidityError);
            if (expectedAmountAvailableToFill) {
                expect(e.amountAvailableToFill).to.be.bignumber.equal(expectedAmountAvailableToFill);
            } else {
                expect(e.amountAvailableToFill).to.be.undefined();
            }
        }

        expect(wasErrorThrown).to.be.true();
    },
};
