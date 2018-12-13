import { BigNumber } from '@0x/utils';

import { InsufficientAssetLiquidityError } from '../../src/types';

export const testHelpers = {
    expectInsufficientLiquidityError: (
        expect: Chai.ExpectStatic,
        functionWhichTriggersError: () => void,
        expectedNumAvailable: BigNumber,
    ): void => {
        let errorThrown = false;
        try {
            functionWhichTriggersError();
        } catch (e) {
            errorThrown = true;
            expect(e).to.be.instanceOf(InsufficientAssetLiquidityError);
            expect(e.numAssetsAvailable).to.be.bignumber.equal(expectedNumAvailable);
        }

        expect(errorThrown).to.be.true();
    },
};
