import { BigNumber } from '@0x/utils';

import { InsufficientAssetLiquidityError } from '../../src/types';

export const testHelpers = {
    expectInsufficientLiquidityError: (
        expect: Chai.ExpectStatic,
        functionWhichTriggersError: () => void,
        expectedAmountAvailableToFill: BigNumber,
    ): void => {
        let errorThrown = false;
        try {
            functionWhichTriggersError();
        } catch (e) {
            errorThrown = true;
            expect(e).to.be.instanceOf(InsufficientAssetLiquidityError);
            expect(e.amountAvailableToFill).to.be.bignumber.equal(expectedAmountAvailableToFill);
        }

        expect(errorThrown).to.be.true();
    },
};
