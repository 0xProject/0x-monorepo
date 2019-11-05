import { constants as testConstants } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

const TEN_DAYS = 10 * 24 * 60 * 60;
const PPM = 10 ** 6;
export const constants = {
    TOKEN_MULTIPLIER: testConstants.DUMMY_TOKEN_DECIMALS,
    INITIAL_POOL_ID: '0x0000000000000000000000000000000000000000000000000000000000000001',
    SECOND_POOL_ID: '0x0000000000000000000000000000000000000000000000000000000000000002',
    NIL_POOL_ID: '0x0000000000000000000000000000000000000000000000000000000000000000',
    NIL_ADDRESS: '0x0000000000000000000000000000000000000000',
    INITIAL_EPOCH: new BigNumber(1),
    DEFAULT_PARAMS: {
        epochDurationInSeconds: new BigNumber(TEN_DAYS),
        rewardDelegatedStakeWeight: new BigNumber(PPM * 0.9),
        minimumPoolStake: new BigNumber(10).pow(testConstants.DUMMY_TOKEN_DECIMALS).times(100),
        cobbDouglasAlphaNumerator: new BigNumber(2),
        cobbDouglasAlphaDenominator: new BigNumber(3),
    },
    PPM,
};
