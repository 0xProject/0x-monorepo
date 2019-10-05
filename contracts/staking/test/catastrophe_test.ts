import { ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { blockchainTests, describe, expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { StakingProxyReadOnlyModeSetEventArgs } from '../src';

import { deployAndConfigureContractsAsync, StakingApiWrapper } from './utils/api_wrapper';
import { toBaseUnitAmount } from './utils/number_utils';
import { StakeStatus } from './utils/types';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets('Catastrophe Tests', env => {
    // constants
    const ZERO = new BigNumber(0);
    // tokens & addresses
    let accounts: string[];
    let owner: string;
    let actors: string[];
    // wrappers
    let stakingApiWrapper: StakingApiWrapper;
    let erc20Wrapper: ERC20Wrapper;
    // tests
    before(async () => {
        // create accounts
        accounts = await env.web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        actors = accounts.slice(2, 5);
        // set up ERC20Wrapper
        erc20Wrapper = new ERC20Wrapper(env.provider, accounts, owner);
        // deploy staking contracts
        stakingApiWrapper = await deployAndConfigureContractsAsync(env, owner, erc20Wrapper);
    });

    describe('Read-Only Mode', () => {
        it('should be able to change state by default', async () => {
            // stake some zrx and assert the balance
            const amountToStake = toBaseUnitAmount(10);
            await stakingApiWrapper.stakingContract.stake.awaitTransactionSuccessAsync(amountToStake, {
                from: actors[0],
            });
            const activeStakeBalance = await stakingApiWrapper.stakingContract.getOwnerStakeByStatus.callAsync(
                actors[0],
                StakeStatus.Active,
            );
            expect(activeStakeBalance.currentEpochBalance).to.be.bignumber.equal(amountToStake);
        });
        it('should not change state when in read-only mode', async () => {
            // set to read-only mode
            await stakingApiWrapper.stakingProxyContract.setReadOnlyMode.awaitTransactionSuccessAsync(true);
            // try to stake
            const amountToStake = toBaseUnitAmount(10);
            await stakingApiWrapper.stakingContract.stake.awaitTransactionSuccessAsync(amountToStake, {
                from: actors[0],
            });
            const activeStakeBalance = await stakingApiWrapper.stakingContract.getOwnerStakeByStatus.callAsync(
                actors[0],
                StakeStatus.Active,
            );
            expect(activeStakeBalance.currentEpochBalance).to.be.bignumber.equal(ZERO);
        });
        it('should read values correctly when in read-only mode', async () => {
            // stake some zrx
            const amountToStake = toBaseUnitAmount(10);
            await stakingApiWrapper.stakingContract.stake.awaitTransactionSuccessAsync(amountToStake, {
                from: actors[0],
            });
            // set to read-only mode
            await stakingApiWrapper.stakingProxyContract.setReadOnlyMode.awaitTransactionSuccessAsync(true);
            // read stake balance in read-only mode
            const activeStakeBalanceReadOnly = await stakingApiWrapper.stakingContract.getOwnerStakeByStatus.callAsync(
                actors[0],
                StakeStatus.Active,
            );
            expect(activeStakeBalanceReadOnly.currentEpochBalance).to.be.bignumber.equal(amountToStake);
        });
        it('should exit read-only mode', async () => {
            // set to read-only mode
            await stakingApiWrapper.stakingProxyContract.setReadOnlyMode.awaitTransactionSuccessAsync(true);
            await stakingApiWrapper.stakingProxyContract.setReadOnlyMode.awaitTransactionSuccessAsync(false);
            // try to stake
            const amountToStake = toBaseUnitAmount(10);
            await stakingApiWrapper.stakingContract.stake.awaitTransactionSuccessAsync(amountToStake, {
                from: actors[0],
            });
            const activeStakeBalance = await stakingApiWrapper.stakingContract.getOwnerStakeByStatus.callAsync(
                actors[0],
                StakeStatus.Active,
            );
            expect(activeStakeBalance.currentEpochBalance).to.be.bignumber.equal(amountToStake);
        });
        it('should emit event when setting read-only mode', async () => {
            // set to read-only mode
            const txReceipt = await stakingApiWrapper.stakingProxyContract.setReadOnlyMode.awaitTransactionSuccessAsync(
                true,
            );
            expect(txReceipt.logs.length).to.be.equal(1);
            const trueLog = txReceipt.logs[0] as LogWithDecodedArgs<StakingProxyReadOnlyModeSetEventArgs>;
            expect(trueLog.args.readOnlyMode).to.be.true();
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
