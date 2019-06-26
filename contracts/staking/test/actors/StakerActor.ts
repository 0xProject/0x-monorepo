import {
    chaiSetup,
    constants,
    expectTransactionFailedAsync,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils'
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { StakingWrapper } from '../utils/staking_wrapper';
import { StakerBalances } from '../utils/types';

const expect = chai.expect;

export class StakerActor {
    private readonly _owner: string;
    private readonly _stakingWrapper: StakingWrapper;

    constructor(owner: string, stakingWrapper: StakingWrapper) {
        this._owner = owner;
        this._stakingWrapper = stakingWrapper;
    }
    
    public async depositAsync(amount: BigNumber, revertReason?: RevertReason) {
        // query init balances
        const initZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVault();
        const initZrxBalanceOfOwner = await this._stakingWrapper.getZrxTokenBalance(this._owner);
        const initStakeBalanceOfOwner = await this._stakingWrapper.getTotalStakeAsync(this._owner);
        const initStakeBalanceOfOwnerInVault = await this._stakingWrapper.getZrxVaultBalance(this._owner);
        // deposit stake
        const txReceiptPromise = this._stakingWrapper.depositAsync(this._owner, amount);
        if (revertReason !== undefined) {
            await expectTransactionFailedAsync(
                txReceiptPromise,
                revertReason
            );
            return;
        }
        const txReceipt = await txReceiptPromise;
        // @TODO check receipt logs and return value via eth_call
        // query final balances
        const finalZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVault();
        const finalZrxBalanceOfOwner = await this._stakingWrapper.getZrxTokenBalance(this._owner);
        const finalStakeBalanceOfOwner = await this._stakingWrapper.getTotalStakeAsync(this._owner);
        const finalStakeBalanceOfOwnerInVault = await this._stakingWrapper.getZrxVaultBalance(this._owner);
        // validate final balances
        expect(finalZrxBalanceOfVault).to.be.bignumber.equal(initZrxBalanceOfVault.plus(amount));
        expect(finalZrxBalanceOfOwner).to.be.bignumber.equal(initZrxBalanceOfOwner.minus(amount));
        expect(finalStakeBalanceOfOwner).to.be.bignumber.equal(initStakeBalanceOfOwner.plus(amount));
        expect(finalStakeBalanceOfOwnerInVault).to.be.bignumber.equal(initStakeBalanceOfOwnerInVault.plus(amount));
    }
    public async depositAndStakeAsync(amount: BigNumber, revertReason?: RevertReason) {
        // @TODO - Implement
        const txReceipt = this._stakingWrapper.depositAndStakeAsync(this._owner, amount);


         

    }
    public async activateStakeAsync(amount: BigNumber, revertReason?: RevertReason) {
        // query init balances
        const initStakeBalanceOfOwner = await this._stakingWrapper.getTotalStakeAsync(this._owner);
        const initWithdrawableStakeBalance = await this._stakingWrapper.getWithdrawableStakeAsync(this._owner);
        const initActivatedStakeBalance = await this._stakingWrapper.getActivatedStakeAsync(this._owner);
        const initActivatableStakeBalance = await this._stakingWrapper.getActivatableStakeAsync(this._owner);
        const initDeactivatedStakeBalance = await this._stakingWrapper.getDeactivatedStakeAsync(this._owner);
        const initTimelockedStakeBalance = await this._stakingWrapper.getTimelockedStakeAsync(this._owner);
        // activate stake
        const txReceiptPromise = this._stakingWrapper.activateStakeAsync(this._owner, amount);
        if (revertReason !== undefined) {
            await expectTransactionFailedAsync(
                txReceiptPromise,
                revertReason
            );
            return;
        }
        const txReceipt = await txReceiptPromise;
        // @TODO check receipt logs and return value via eth_call
        // check total stake balance didn't change
        const stakeBalanceOfOwner = await this._stakingWrapper.getTotalStakeAsync(this._owner);
        expect(stakeBalanceOfOwner).to.be.bignumber.equal(initStakeBalanceOfOwner); 
        // check timelocked stake is no longer activated
        const activatedStakeBalance = await this._stakingWrapper.getActivatedStakeAsync(this._owner);
        expect(activatedStakeBalance).to.be.bignumber.equal(initActivatedStakeBalance.plus(amount)); 
        // check that timelocked stake is deactivated
        const deactivatedStakeBalance = await this._stakingWrapper.getDeactivatedStakeAsync(this._owner);
        expect(deactivatedStakeBalance).to.be.bignumber.equal(initDeactivatedStakeBalance.minus(amount)); 
        // check amount that is timelocked
        const timelockedStakeBalance = await this._stakingWrapper.getTimelockedStakeAsync(this._owner);
        expect(timelockedStakeBalance).to.be.bignumber.equal(initTimelockedStakeBalance);
        // check that timelocked stake cannot be withdrawn
        const withdrawableStakeBalance = await this._stakingWrapper.getWithdrawableStakeAsync(this._owner);
        expect(withdrawableStakeBalance).to.be.bignumber.equal(initWithdrawableStakeBalance.minus(amount));
        // check that timelocked stake cannot be reactivated
        const activatableStakeBalance = await this._stakingWrapper.getActivatableStakeAsync(this._owner);
        expect(activatableStakeBalance).to.be.bignumber.equal(initActivatableStakeBalance.minus(amount));
    }
    public async deactivateAndTimelockStakeAsync(amount: BigNumber, revertReason?: RevertReason) {
        // query init balances
        const initStakeBalanceOfOwner = await this._stakingWrapper.getTotalStakeAsync(this._owner);
        const initWithdrawableStakeBalance = await this._stakingWrapper.getWithdrawableStakeAsync(this._owner);
        const initActivatableStakeBalance = await this._stakingWrapper.getActivatableStakeAsync(this._owner);
        // deactivate and timelock stake
        const txReceiptPromise = this._stakingWrapper.deactivateAndTimelockStakeAsync(this._owner, amount);
        if (revertReason !== undefined) {
            await expectTransactionFailedAsync(
                txReceiptPromise,
                revertReason
            );
            return;
        }
        const txReceipt = await txReceiptPromise;
        // @TODO check receipt logs and return value via eth_call
        // check total stake balance didn't change
        const stakeBalanceOfOwner = await this._stakingWrapper.getTotalStakeAsync(this._owner);
        expect(stakeBalanceOfOwner).to.be.bignumber.equal(initStakeBalanceOfOwner); 
        // check timelocked stake is no longer activated
        const activatedStakeBalance = await this._stakingWrapper.getActivatedStakeAsync(this._owner);
        expect(activatedStakeBalance).to.be.bignumber.equal(initStakeBalanceOfOwner.minus(amount)); 
        // check that timelocked stake is deactivated
        const deactivatedStakeBalance = await this._stakingWrapper.getDeactivatedStakeAsync(this._owner);
        expect(deactivatedStakeBalance).to.be.bignumber.equal(amount); 
        // check amount that is timelocked
        const timelockedStakeBalance = await this._stakingWrapper.getTimelockedStakeAsync(this._owner);
        expect(timelockedStakeBalance).to.be.bignumber.equal(amount);
        // check that timelocked stake cannot be withdrawn
        const withdrawableStakeBalance = await this._stakingWrapper.getWithdrawableStakeAsync(this._owner);
        expect(withdrawableStakeBalance).to.be.bignumber.equal(initWithdrawableStakeBalance);
        // check that timelocked stake cannot be reactivated
        const activatableStakeBalance = await this._stakingWrapper.getActivatableStakeAsync(this._owner);
        expect(activatableStakeBalance).to.be.bignumber.equal(initActivatableStakeBalance);
    }
    public async withdrawAsync(amount: BigNumber, revertReason?: RevertReason) {
        const initZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVault();
        const initZrxBalanceOfOwner = await this._stakingWrapper.getZrxTokenBalance(this._owner);
        const initStakeBalanceOfOwner = await this._stakingWrapper.getTotalStakeAsync(this._owner);
        const initStakeBalanceOfOwnerInVault = await this._stakingWrapper.getZrxVaultBalance(this._owner);
        const initWithdrawableStakeBalance = await this._stakingWrapper.getWithdrawableStakeAsync(this._owner);
        const initActivatedStakeBalance = await this._stakingWrapper.getActivatedStakeAsync(this._owner);
        const initActivatableStakeBalance = await this._stakingWrapper.getActivatableStakeAsync(this._owner);
        const initDeactivatedStakeBalance = await this._stakingWrapper.getDeactivatedStakeAsync(this._owner);
        const initTimelockedStakeBalance = await this._stakingWrapper.getTimelockedStakeAsync(this._owner);
        // withdraw stake
        const txReceiptPromise = this._stakingWrapper.withdrawAsync(this._owner, amount);
        if (revertReason !== undefined) {
            await expectTransactionFailedAsync(
                txReceiptPromise,
                revertReason
            );
            return;
        }
        const txReceipt = await txReceiptPromise;
        // @TODO check receipt logs and return value via eth_call
        // check total stake balance
        const stakeBalanceOfOwner = await this._stakingWrapper.getTotalStakeAsync(this._owner);
        expect(stakeBalanceOfOwner).to.be.bignumber.equal(initStakeBalanceOfOwner.minus(amount)); 
        // check timelocked stake didn't change
        const activatedStakeBalance = await this._stakingWrapper.getActivatedStakeAsync(this._owner);
        expect(activatedStakeBalance).to.be.bignumber.equal(initActivatedStakeBalance); 
        // check deactivated stake
        const deactivatedStakeBalance = await this._stakingWrapper.getDeactivatedStakeAsync(this._owner);
        expect(deactivatedStakeBalance).to.be.bignumber.equal(initDeactivatedStakeBalance.minus(amount)); 
        // check amount that is timelocked
        const timelockedStakeBalance = await this._stakingWrapper.getTimelockedStakeAsync(this._owner);
        expect(timelockedStakeBalance).to.be.bignumber.equal(initTimelockedStakeBalance);
        // check that timelocked stake cannot be withdrawn
        const withdrawableStakeBalance = await this._stakingWrapper.getWithdrawableStakeAsync(this._owner);
        expect(withdrawableStakeBalance).to.be.bignumber.equal(initWithdrawableStakeBalance.minus(amount));
        // check that timelocked stake cannot be reactivated
        const activatableStakeBalance = await this._stakingWrapper.getActivatableStakeAsync(this._owner);
        expect(activatableStakeBalance).to.be.bignumber.equal(initActivatableStakeBalance.minus(amount));
        // check zrx balances
        const finalZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVault();
        const finalZrxBalanceOfOwner = await this._stakingWrapper.getZrxTokenBalance(this._owner);
        const finalStakeBalanceOfOwner = await this._stakingWrapper.getTotalStakeAsync(this._owner);
        const finalStakeBalanceOfOwnerInVault = await this._stakingWrapper.getZrxVaultBalance(this._owner);
        expect(finalZrxBalanceOfVault).to.be.bignumber.equal(initZrxBalanceOfVault.minus(amount));
        expect(finalZrxBalanceOfOwner).to.be.bignumber.equal(initZrxBalanceOfOwner.plus(amount));
        expect(finalStakeBalanceOfOwner).to.be.bignumber.equal(initStakeBalanceOfOwner.minus(amount));
        expect(finalStakeBalanceOfOwnerInVault).to.be.bignumber.equal(initStakeBalanceOfOwnerInVault.minus(amount));
    }

    public async getBalancesAsync(): Promise<StakerBalances> {
        const stakerBalances = {
            zrxBalance: await this._stakingWrapper.getZrxTokenBalance(this._owner),
            stakeBalance: await this._stakingWrapper.getTotalStakeAsync(this._owner),
            stakeBalanceInVault: await this._stakingWrapper.getZrxVaultBalance(this._owner),
            withdrawableStakeBalance: await this._stakingWrapper.getWithdrawableStakeAsync(this._owner),
            activatableStakeBalance: await this._stakingWrapper.getActivatableStakeAsync(this._owner),
            activatedStakeBalance: await this._stakingWrapper.getActivatedStakeAsync(this._owner),
            timelockedStakeBalance: await this._stakingWrapper.getTimelockedStakeAsync(this._owner),
            deactivatedStakeBalance: await this._stakingWrapper.getDeactivatedStakeAsync(this._owner),
        }
        return stakerBalances;
    }

    public async assertBalancesAsync(expectedBalances: StakerBalances): Promise<void> {
        const balances = await this.getBalancesAsync();
        expect(balances.zrxBalance, 'zrx balance').to.be.bignumber.equal(expectedBalances.zrxBalance);
        expect(balances.stakeBalance, 'stake balance').to.be.bignumber.equal(expectedBalances.stakeBalance);
        expect(balances.stakeBalanceInVault, 'stake balance, recorded in vault').to.be.bignumber.equal(expectedBalances.stakeBalanceInVault);
        expect(balances.withdrawableStakeBalance, 'withdrawable stake balance').to.be.bignumber.equal(expectedBalances.withdrawableStakeBalance);
        expect(balances.activatableStakeBalance, 'activatable stake balance').to.be.bignumber.equal(expectedBalances.activatableStakeBalance);
        expect(balances.activatedStakeBalance, 'activated stake balance').to.be.bignumber.equal(expectedBalances.activatedStakeBalance);
        expect(balances.timelockedStakeBalance, 'timelocked stake balance').to.be.bignumber.equal(expectedBalances.timelockedStakeBalance);
        expect(balances.deactivatedStakeBalance, 'deactivated stake balance').to.be.bignumber.equal(expectedBalances.deactivatedStakeBalance);
    }

    public async forceTimelockSyncAsync() {
        const initBalances = await this.getBalancesAsync();
        await this._stakingWrapper.forceTimelockSyncAsync(this._owner);
        await this.assertBalancesAsync(initBalances);
    }

    public async skipToNextTimelockPeriodAsync() {
        // query some initial values
        const initBalances = await this.getBalancesAsync();
        const timelockStart = await this._stakingWrapper.getTimelockStartAsync(this._owner);
        // skip to next period
        await this._stakingWrapper.skipToNextTimelockPeriodAsync();
        // validate new balances
        let expectedBalances = initBalances;
        const currentTimelockPeriod = await this._stakingWrapper.getCurrentTimelockPeriodAsync();
        if (currentTimelockPeriod.minus(timelockStart).isGreaterThan(1)) {
            expectedBalances.activatableStakeBalance = initBalances.activatableStakeBalance.plus(initBalances.timelockedStakeBalance);
            expectedBalances.withdrawableStakeBalance = expectedBalances.activatableStakeBalance;
            expectedBalances.timelockedStakeBalance = new BigNumber(0);
        }
        await this.assertBalancesAsync(expectedBalances);
    }
}
