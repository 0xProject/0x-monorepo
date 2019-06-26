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
    protected readonly _owner: string;
    protected readonly _stakingWrapper: StakingWrapper;

    constructor(owner: string, stakingWrapper: StakingWrapper) {
        this._owner = owner;
        this._stakingWrapper = stakingWrapper;
    }
    public async depositAsync(amount: BigNumber, revertReason?: RevertReason): Promise<void> {
        // query init balances
        const initZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVault();
        const initStakerBalances = await this.getBalancesAsync();
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
        // check balances
        let expectedStakerBalances = initStakerBalances;
        expectedStakerBalances.zrxBalance = initStakerBalances.zrxBalance.plus(amount);
        expectedStakerBalances.stakeBalance = initStakerBalances.stakeBalance.plus(amount);
        expectedStakerBalances.stakeBalanceInVault = initStakerBalances.stakeBalanceInVault.plus(amount);
        expectedStakerBalances.withdrawableStakeBalance = initStakerBalances.withdrawableStakeBalance.plus(amount);
        expectedStakerBalances.activatableStakeBalance = initStakerBalances.activatableStakeBalance.plus(amount);
        expectedStakerBalances.deactivatedStakeBalance = initStakerBalances.deactivatedStakeBalance.plus(amount);
        await this.assertBalancesAsync(expectedStakerBalances);
        // check zrx balance of vault
        const finalZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVault();
        expect(finalZrxBalanceOfVault).to.be.bignumber.equal(initZrxBalanceOfVault.minus(amount));
    }
    public async depositAndStakeAsync(amount: BigNumber, revertReason?: RevertReason): Promise<void> {
        // @TODO - Implement
        const txReceipt = this._stakingWrapper.depositAndStakeAsync(this._owner, amount);
    }
    public async activateStakeAsync(amount: BigNumber, revertReason?: RevertReason): Promise<void> {
        // query init balances
        const initStakerBalances = await this.getBalancesAsync();
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
        // check balances
        let expectedStakerBalances = initStakerBalances;
        expectedStakerBalances.withdrawableStakeBalance = initStakerBalances.withdrawableStakeBalance.minus(amount);
        expectedStakerBalances.activatableStakeBalance = initStakerBalances.activatableStakeBalance.minus(amount);
        expectedStakerBalances.activatedStakeBalance = initStakerBalances.activatedStakeBalance.plus(amount);
        expectedStakerBalances.deactivatedStakeBalance = initStakerBalances.deactivatedStakeBalance.minus(amount);
        await this.assertBalancesAsync(expectedStakerBalances);
    }
    public async deactivateAndTimelockStakeAsync(amount: BigNumber, revertReason?: RevertReason): Promise<void> {
        // query init balances
        const initStakerBalances = await this.getBalancesAsync();
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
        // check balances
        let expectedStakerBalances = initStakerBalances;
        expectedStakerBalances.activatedStakeBalance = initStakerBalances.activatedStakeBalance.minus(amount);
        expectedStakerBalances.timelockedStakeBalance = initStakerBalances.timelockedStakeBalance.plus(amount);
        expectedStakerBalances.deactivatedStakeBalance = initStakerBalances.deactivatedStakeBalance.plus(amount);
        await this.assertBalancesAsync(expectedStakerBalances);
    }
    public async withdrawAsync(amount: BigNumber, revertReason?: RevertReason): Promise<void> {
        // query init balances
        const initZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVault();
        const initStakerBalances = await this.getBalancesAsync();
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
        // check balances
        let expectedStakerBalances = initStakerBalances;
        expectedStakerBalances.zrxBalance = initStakerBalances.zrxBalance.plus(amount);
        expectedStakerBalances.stakeBalance = initStakerBalances.stakeBalance.minus(amount);
        expectedStakerBalances.stakeBalanceInVault = initStakerBalances.stakeBalanceInVault.minus(amount);
        expectedStakerBalances.withdrawableStakeBalance = initStakerBalances.withdrawableStakeBalance.minus(amount);
        expectedStakerBalances.activatableStakeBalance = initStakerBalances.activatableStakeBalance.minus(amount);
        expectedStakerBalances.deactivatedStakeBalance = initStakerBalances.deactivatedStakeBalance.minus(amount);
        await this.assertBalancesAsync(expectedStakerBalances);
        // check zrx balance of vault
        const finalZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVault();
        expect(finalZrxBalanceOfVault).to.be.bignumber.equal(initZrxBalanceOfVault.minus(amount));
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
    public async forceTimelockSyncAsync(): Promise<void> {
        const initBalances = await this.getBalancesAsync();
        await this._stakingWrapper.forceTimelockSyncAsync(this._owner);
        await this.assertBalancesAsync(initBalances);
    }
    public async skipToNextTimelockPeriodAsync(): Promise<void> {
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
