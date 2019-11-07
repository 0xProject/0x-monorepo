import { BigNumber } from '@0x/utils';

import { constants } from './constants';

export interface ConfigsByChain {
    zeroExGovernor: { owners: string[]; secondsTimeLocked: BigNumber; required: BigNumber };
    staking: {
        epochDurationInSeconds: BigNumber;
        rewardDelegatedStakeWeight: number;
        minimumPoolStake: BigNumber;
        cobbDouglasAlphaNumerator: number;
        cobbDouglasAlphaDenominator: number;
    };
}

// tslint:disable custom-no-magic-numbers
/**
 * Gets configs that correspond to the given chainId.
 * @param chainId Id of the netowrk.
 */
export function getConfigsByChainId(chainId: number): ConfigsByChain {
    const mainnetConfigs = {
        zeroExGovernor: {
            owners: [
                '0x257619b7155d247e43c8b6d90c8c17278ae481f0',
                '0x5ee2a00f8f01d099451844af7f894f26a57fcbf2',
                '0x894d623e0e0e8ed12c4a73dada999e275684a37d',
            ],
            secondsTimeLocked: constants.TWO_WEEKS_IN_SEC,
            required: new BigNumber(2),
        },
        staking: {
            epochDurationInSeconds: constants.TEN_DAYS_IN_SEC,
            rewardDelegatedStakeWeight: 10 ** 6 * 0.9,
            minimumPoolStake: new BigNumber(10).pow(18).times(100),
            cobbDouglasAlphaNumerator: 2,
            cobbDouglasAlphaDenominator: 3,
        },
    };
    const testnetConfigs = {
        zeroExGovernor: {
            owners: [
                '0x9df8137872ac09a8fee71d0da5c7539923fb9bf0',
                '0xcf34d44db312d188789f43a63d11cf2bebb4da15',
                '0x73fd50f2a6beac9cdac9fe87ef68a18edc415831',
            ],
            secondsTimeLocked: constants.ZERO_AMOUNT,
            required: new BigNumber(1),
        },
        staking: {
            epochDurationInSeconds: constants.TEN_DAYS_IN_SEC.dividedToIntegerBy(2),
            rewardDelegatedStakeWeight: 10 ** 6 * 0.9,
            minimumPoolStake: new BigNumber(10).pow(18).times(100),
            cobbDouglasAlphaNumerator: 2,
            cobbDouglasAlphaDenominator: 3,
        },
    };
    return chainId === constants.MAINNET_CHAIN_ID ? mainnetConfigs : testnetConfigs;
}
