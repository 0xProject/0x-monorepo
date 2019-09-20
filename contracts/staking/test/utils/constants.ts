import { constants as testConstants, randomAddress } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

const TWO_WEEKS = 14 * 24 * 60 * 60;
const PPM_90_PERCENT = 10 ** 6 * 0.9;
export const constants = {
    TOKEN_MULTIPLIER: testConstants.DUMMY_TOKEN_DECIMALS,
    INITIAL_POOL_ID: '0x0000000000000000000000000000000100000000000000000000000000000000',
    SECOND_POOL_ID: '0x0000000000000000000000000000000200000000000000000000000000000000',
    NIL_POOL_ID: '0x0000000000000000000000000000000000000000000000000000000000000000',
    NIL_ADDRESS: '0x0000000000000000000000000000000000000000',
    INITIAL_EPOCH: new BigNumber(0),
    DEFAULT_PARAMS: {
        epochDurationInSeconds: new BigNumber(TWO_WEEKS),
        rewardDelegatedStakeWeight: new BigNumber(PPM_90_PERCENT),
        minimumPoolStake: testConstants.DUMMY_TOKEN_DECIMALS.times(100),
        maximumMakersInPool: new BigNumber(10),
        cobbDouglasAlphaNumerator: new BigNumber(1),
        cobbDouglasAlphaDenominator: new BigNumber(2),
        wethProxyAddress: randomAddress(),
        ethVaultAddress: randomAddress(),
        rewardVaultAddress: randomAddress(),
        zrxVaultAddress: randomAddress(),
    },
};
