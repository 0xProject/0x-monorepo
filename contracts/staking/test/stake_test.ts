import { ERC20ProxyContract, ERC20Wrapper } from '@0x/contracts-asset-proxy';
import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { chaiSetup, provider, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { DelegatorActor } from './actors/delegator_actor';
import { StakerActor } from './actors/staker_actor';
import { StakingWrapper } from './utils/staking_wrapper';

chaiSetup.configure();
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);
// tslint:disable:no-unnecessary-type-assertion
describe('Staking & Delegating', () => {
    // constants
    const ZRX_TOKEN_DECIMALS = new BigNumber(18);
    // tokens & addresses
    let accounts: string[];
    let owner: string;
    let stakers: string[];
    let zrxTokenContract: DummyERC20TokenContract;
    let erc20ProxyContract: ERC20ProxyContract;
    // wrappers
    let stakingWrapper: StakingWrapper;
    let erc20Wrapper: ERC20Wrapper;
    // tests
    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        // create accounts
        accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        stakers = accounts.slice(2, 5);
        // deploy erc20 proxy
        erc20Wrapper = new ERC20Wrapper(provider, accounts, owner);
        erc20ProxyContract = await erc20Wrapper.deployProxyAsync();
        // deploy zrx token
        [zrxTokenContract] = await erc20Wrapper.deployDummyTokensAsync(1, ZRX_TOKEN_DECIMALS);
        await erc20Wrapper.setBalancesAndAllowancesAsync();
        // deploy staking contracts
        stakingWrapper = new StakingWrapper(provider, owner, erc20ProxyContract, zrxTokenContract, accounts);
        await stakingWrapper.deployAndConfigureContractsAsync();
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('Staking', () => {
        it('basic staking/unstaking', async () => {
            // setup test parameters
            const amountToStake = StakingWrapper.toBaseUnitAmount(10);
            const amountToDeactivate = StakingWrapper.toBaseUnitAmount(4);
            const amountToReactivate = StakingWrapper.toBaseUnitAmount(1);
            const amountToWithdraw = StakingWrapper.toBaseUnitAmount(1.5);
            // run test - this actor will validate its own state
            const staker = new StakerActor(stakers[0], stakingWrapper);
            await staker.depositZrxAndMintActivatedStakeAsync(amountToStake);
            await staker.deactivateAndTimeLockStakeAsync(amountToDeactivate);
            // note - we cannot re-activate this timeLocked stake until at least one full timeLock period has passed.
            //        attempting to do so should revert.
            await staker.activateStakeAsync(amountToReactivate, RevertReason.InsufficientBalance);
            await staker.skipToNextTimeLockPeriodAsync();
            await staker.activateStakeAsync(amountToReactivate, RevertReason.InsufficientBalance);
            await staker.skipToNextTimeLockPeriodAsync();
            // this forces the internal state to update; it is not necessary to activate stake, but
            // allows us to check that state is updated correctly after a timeLock period rolls over.
            await staker.forceTimeLockSyncAsync();
            // now we can activate stake
            await staker.activateStakeAsync(amountToReactivate);
            await staker.burnDeactivatedStakeAndWithdrawZrxAsync(amountToWithdraw);
        });
    });

    describe('Delegating', () => {
        it('basic delegating/undelegating', async () => {
            // setup test parameters
            const amountToDelegate = StakingWrapper.toBaseUnitAmount(10);
            const amountToDeactivate = StakingWrapper.toBaseUnitAmount(4);
            const amountToReactivate = StakingWrapper.toBaseUnitAmount(1);
            const amountToWithdraw = StakingWrapper.toBaseUnitAmount(1.5);
            const poolOperator = stakers[1];
            const operatorShare = 39;
            const poolId = await stakingWrapper.createStakingPoolAsync(poolOperator, operatorShare);
            // run test
            const delegator = new DelegatorActor(stakers[0], stakingWrapper);
            await delegator.depositZrxAndDelegateToStakingPoolAsync(poolId, amountToDelegate);
            await delegator.deactivateAndTimeLockDelegatedStakeAsync(poolId, amountToDeactivate);
            // note - we cannot re-activate this timeLocked stake until at least one full timeLock period has passed.
            //        attempting to do so should revert.
            await delegator.activateStakeAsync(amountToReactivate, RevertReason.InsufficientBalance);
            await delegator.skipToNextTimeLockPeriodAsync();
            await delegator.activateStakeAsync(amountToReactivate, RevertReason.InsufficientBalance);
            await delegator.skipToNextTimeLockPeriodAsync();
            // this forces the internal state to update; it is not necessary to activate stake, but
            // allows us to check that state is updated correctly after a timeLock period rolls over.
            await delegator.forceTimeLockSyncAsync();
            // now we can activate stake
            await delegator.activateAndDelegateStakeAsync(poolId, amountToReactivate);
            await delegator.burnDeactivatedStakeAndWithdrawZrxAsync(amountToWithdraw);
        });
    });
});
// tslint:enable:no-unnecessary-type-assertion
