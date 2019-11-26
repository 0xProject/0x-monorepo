import { BigNumber } from '@0x/utils';

import { InsufficientAssetLiquidityError } from '../../src/errors';

export const testHelpers = {
    expectInsufficientLiquidityErrorAsync: async (
        expect: Chai.ExpectStatic,
        functionWhichTriggersErrorAsync: () => Promise<void>,
        expectedAmountAvailableToFill: BigNumber,
    ): Promise<void> => {
        let wasErrorThrown = false;
        try {
            await functionWhichTriggersErrorAsync();
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
