import { ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { blockchainTests, describe, expect } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { StakingProxyReadOnlyModeSetEventArgs } from '../src';

import { StakingWrapper } from './utils/staking_wrapper';

// tslint:disable:no-unnecessary-type-assertion
blockchainTests.resets('Catastrophe Tests', env => {
    // constants
    const ZRX_TOKEN_DECIMALS = new BigNumber(18);
    const ZERO = new BigNumber(0);
    // tokens & addresses
    let accounts: string[];
    let owner: string;
    let actors: string[];
    let zrxTokenContract: DummyERC20TokenContract;
    let erc20ProxyContract: ERC20ProxyContract;
    // wrappers
    let stakingWrapper: StakingWrapper;
    let erc20Wrapper: ERC20Wrapper;
    // tests
    before(async () => {
        // create accounts
        accounts = await env.web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        actors = accounts.slice(2, 5);
        // deploy erc20 proxy
        erc20Wrapper = new ERC20Wrapper(env.provider, accounts, owner);
        erc20ProxyContract = await erc20Wrapper.deployProxyAsync();
        // deploy zrx token
        [zrxTokenContract] = await erc20Wrapper.deployDummyTokensAsync(1, ZRX_TOKEN_DECIMALS);
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        // deploy staking contracts
        stakingWrapper = new StakingWrapper(env.provider, owner, erc20ProxyContract, zrxTokenContract, accounts);
        await stakingWrapper.deployAndConfigureContractsAsync();
    });

    describe('Read-Only Mode', () => {
        it('should be able to change state by default', async () => {
            // stake some zrx and assert the balance
            const amountToStake = StakingWrapper.toBaseUnitAmount(10);
            await stakingWrapper.stakeAsync(actors[0], amountToStake);
            const activeStakeBalance = await stakingWrapper.getActiveStakeAsync(actors[0]);
            expect(activeStakeBalance.currentEpochBalance).to.be.bignumber.equal(amountToStake);
        });
        it('should not change state when in read-only mode', async () => {
            // set to read-only mode
            await stakingWrapper.setReadOnlyModeAsync(true);
            // try to stake
            const amountToStake = StakingWrapper.toBaseUnitAmount(10);
            await stakingWrapper.stakeAsync(actors[0], amountToStake);
            const activeStakeBalance = await stakingWrapper.getActiveStakeAsync(actors[0]);
            expect(activeStakeBalance.currentEpochBalance).to.be.bignumber.equal(ZERO);
        });
        it('should read values correctly when in read-only mode', async () => {
            // stake some zrx
            const amountToStake = StakingWrapper.toBaseUnitAmount(10);
            await stakingWrapper.stakeAsync(actors[0], amountToStake);
            // set to read-only mode
            await stakingWrapper.setReadOnlyModeAsync(true);
            // read stake balance in read-only mode
            const activeStakeBalanceReadOnly = await stakingWrapper.getActiveStakeAsync(actors[0]);
            expect(activeStakeBalanceReadOnly.currentEpochBalance).to.be.bignumber.equal(amountToStake);
        });
        it('should exit read-only mode', async () => {
            // set to read-only mode
            await stakingWrapper.setReadOnlyModeAsync(true);
            await stakingWrapper.setReadOnlyModeAsync(false);
            // try to stake
            const amountToStake = StakingWrapper.toBaseUnitAmount(10);
            await stakingWrapper.stakeAsync(actors[0], amountToStake);
            const activeStakeBalance = await stakingWrapper.getActiveStakeAsync(actors[0]);
            expect(activeStakeBalance.currentEpochBalance).to.be.bignumber.equal(amountToStake);
        });
        it('should emit event when setting read-only mode', async () => {
            // set to read-only mode
            const txReceipt = await stakingWrapper.setReadOnlyModeAsync(true);
            expect(txReceipt.logs.length).to.be.equal(1);
            const trueLog = txReceipt.logs[0] as LogWithDecodedArgs<StakingProxyReadOnlyModeSetEventArgs>;
            expect(trueLog.args.readOnlyMode).to.be.true();
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
