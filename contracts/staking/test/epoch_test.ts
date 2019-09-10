import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { blockchainTests, expect } from '@0x/contracts-test-utils';
import * as _ from 'lodash';

import { artifacts } from '../src';

import { deployAndConfigureContractsAsync, StakingApiWrapper } from './utils/api_wrapper';
import { constants as stakingConstants } from './utils/constants';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests('Epochs', env => {
    // tokens & addresses
    let accounts: string[];
    let owner: string;
    // wrappers
    let stakingApiWrapper: StakingApiWrapper;
    let erc20Wrapper: ERC20Wrapper;
    // tests
    before(async () => {
        // create accounts
        accounts = await env.getAccountAddressesAsync();
        owner = accounts[0];
        // set up ERC20Wrapper
        erc20Wrapper = new ERC20Wrapper(env.provider, accounts, owner);
        // deploy staking contracts
        stakingApiWrapper = await deployAndConfigureContractsAsync(env, owner, erc20Wrapper, artifacts.TestStaking);
    });
    describe('Epochs & TimeLocks', () => {
        it('basic epochs & timeLock periods', async () => {
            ///// 1/3 Validate Assumptions /////
            expect((await stakingApiWrapper.utils.getParamsAsync()).epochDurationInSeconds).to.be.bignumber.equal(
                stakingConstants.DEFAULT_PARAMS.epochDurationInSeconds,
            );
            ///// 2/3 Validate Initial Epoch & TimeLock Period /////
            {
                // epoch
                const currentEpoch = await stakingApiWrapper.stakingContract.getCurrentEpoch.callAsync();
                expect(currentEpoch).to.be.bignumber.equal(stakingConstants.INITIAL_EPOCH);
            }
            ///// 3/3 Increment Epoch (TimeLock Should Not Increment) /////
            await stakingApiWrapper.utils.skipToNextEpochAsync();
            {
                // epoch
                const currentEpoch = await stakingApiWrapper.stakingContract.getCurrentEpoch.callAsync();
                expect(currentEpoch).to.be.bignumber.equal(stakingConstants.INITIAL_EPOCH.plus(1));
            }
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
