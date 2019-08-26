import { expect } from '@0x/contracts-test-utils';
import { BigNumber, RevertError } from '@0x/utils';
import * as _ from 'lodash';

import { StakingWrapper } from '../utils/staking_wrapper';
import { StakerBalances } from '../utils/types';

import { BaseActor } from './base_actor';

export class StakerActor extends BaseActor {
    /*
    constructor(owner: string, stakingWrapper: StakingWrapper) {
        super(owner, stakingWrapper);
    }
    public async depositZrxAndMintDeactivatedStakeAsync(amount: BigNumber, revertError?: RevertError): Promise<void> {
        await this._stakingWrapper.depositZrxAndMintDeactivatedStakeAsync(this._owner, amount);
        throw new Error('Checks Unimplemented');
    }
    public async depositZrxAndMintActivatedStakeAsync(amount: BigNumber, revertError?: RevertError): Promise<void> {
        // query init balances
        const initZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVaultAsync();
        const initStakerBalances = await this.getBalancesAsync();
        // deposit stake
        const txReceiptPromise = this._stakingWrapper.depositZrxAndMintActivatedStakeAsync(this._owner, amount);
        if (revertError !== undefined) {
            await expect(txReceiptPromise).to.revertWith(revertError);
            return;
        }
        await txReceiptPromise;
        // @TODO check receipt logs and return value via eth_call
        // check balances
        const expectedStakerBalances = initStakerBalances;
        expectedStakerBalances.zrxBalance = initStakerBalances.zrxBalance.minus(amount);
        expectedStakerBalances.stakeBalance = initStakerBalances.stakeBalance.plus(amount);
        expectedStakerBalances.stakeBalanceInVault = initStakerBalances.stakeBalanceInVault.plus(amount);
        expectedStakerBalances.activatedStakeBalance = initStakerBalances.activatedStakeBalance.plus(amount);
        await this.assertBalancesAsync(expectedStakerBalances);
        // check zrx balance of vault
        const finalZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVaultAsync();
        expect(finalZrxBalanceOfVault).to.be.bignumber.equal(initZrxBalanceOfVault.plus(amount));
    }
    public async activateStakeAsync(amount: BigNumber, revertError?: RevertError): Promise<void> {
        // query init balances
        const initStakerBalances = await this.getBalancesAsync();
        // activate stake
        const txReceiptPromise = this._stakingWrapper.activateStakeAsync(this._owner, amount);
        if (revertError !== undefined) {
            await expect(txReceiptPromise).to.revertWith(revertError);
            return;
        }
        await txReceiptPromise;
        // @TODO check receipt logs and return value via eth_call
        // check balances
        const expectedStakerBalances = initStakerBalances;
        expectedStakerBalances.withdrawableStakeBalance = initStakerBalances.withdrawableStakeBalance.minus(amount);
        expectedStakerBalances.activatableStakeBalance = initStakerBalances.activatableStakeBalance.minus(amount);
        expectedStakerBalances.activatedStakeBalance = initStakerBalances.activatedStakeBalance.plus(amount);
        expectedStakerBalances.deactivatedStakeBalance = initStakerBalances.deactivatedStakeBalance.minus(amount);
        await this.assertBalancesAsync(expectedStakerBalances);
    }
    public async deactivateAndTimeLockStakeAsync(amount: BigNumber, revertError?: RevertError): Promise<void> {
        // query init balances
        const initStakerBalances = await this.getBalancesAsync();
        // deactivate and timeLock stake
        const txReceiptPromise = this._stakingWrapper.deactivateAndTimeLockStakeAsync(this._owner, amount);
        if (revertError !== undefined) {
            await expect(txReceiptPromise).to.revertWith(revertError);
            return;
        }
        await txReceiptPromise;
        // @TODO check receipt logs and return value via eth_call
        // check balances
        const expectedStakerBalances = initStakerBalances;
        expectedStakerBalances.activatedStakeBalance = initStakerBalances.activatedStakeBalance.minus(amount);
        expectedStakerBalances.timeLockedStakeBalance = initStakerBalances.timeLockedStakeBalance.plus(amount);
        expectedStakerBalances.deactivatedStakeBalance = initStakerBalances.deactivatedStakeBalance.plus(amount);
        await this.assertBalancesAsync(expectedStakerBalances);
    }
    public async burnDeactivatedStakeAndWithdrawZrxAsync(amount: BigNumber, revertError?: RevertError): Promise<void> {
        // query init balances
        const initZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVaultAsync();
        const initStakerBalances = await this.getBalancesAsync();
        // withdraw stake
        const txReceiptPromise = this._stakingWrapper.burnDeactivatedStakeAndWithdrawZrxAsync(this._owner, amount);
        if (revertError !== undefined) {
            await expect(txReceiptPromise).to.revertWith(revertError);
            return;
        }
        await txReceiptPromise;
        // @TODO check receipt logs and return value via eth_call
        // check balances
        const expectedStakerBalances = initStakerBalances;
        expectedStakerBalances.zrxBalance = initStakerBalances.zrxBalance.plus(amount);
        expectedStakerBalances.stakeBalance = initStakerBalances.stakeBalance.minus(amount);
        expectedStakerBalances.stakeBalanceInVault = initStakerBalances.stakeBalanceInVault.minus(amount);
        expectedStakerBalances.withdrawableStakeBalance = initStakerBalances.withdrawableStakeBalance.minus(amount);
        expectedStakerBalances.activatableStakeBalance = initStakerBalances.activatableStakeBalance.minus(amount);
        expectedStakerBalances.deactivatedStakeBalance = initStakerBalances.deactivatedStakeBalance.minus(amount);
        await this.assertBalancesAsync(expectedStakerBalances);
        // check zrx balance of vault
        const finalZrxBalanceOfVault = await this._stakingWrapper.getZrxTokenBalanceOfZrxVaultAsync();
        expect(finalZrxBalanceOfVault).to.be.bignumber.equal(initZrxBalanceOfVault.minus(amount));
    }
    public async getBalancesAsync(): Promise<StakerBalances> {
        const stakerBalances = {
            zrxBalance: await this._stakingWrapper.getZrxTokenBalanceAsync(this._owner),
            stakeBalance: await this._stakingWrapper.getTotalStakeAsync(this._owner),
            stakeBalanceInVault: await this._stakingWrapper.getZrxVaultBalanceAsync(this._owner),
            withdrawableStakeBalance: await this._stakingWrapper.getWithdrawableStakeAsync(this._owner),
            activatableStakeBalance: await this._stakingWrapper.getActivatableStakeAsync(this._owner),
            activatedStakeBalance: await this._stakingWrapper.getActivatedStakeAsync(this._owner),
            timeLockedStakeBalance: await this._stakingWrapper.getTimeLockedStakeAsync(this._owner),
            deactivatedStakeBalance: await this._stakingWrapper.getDeactivatedStakeAsync(this._owner),
        };
        return stakerBalances;
    }
    public async assertBalancesAsync(expectedBalances: StakerBalances): Promise<void> {
        const balances = await this.getBalancesAsync();
        expect(balances.zrxBalance, 'zrx balance').to.be.bignumber.equal(expectedBalances.zrxBalance);
        expect(balances.stakeBalance, 'stake balance').to.be.bignumber.equal(expectedBalances.stakeBalance);
        expect(balances.stakeBalanceInVault, 'stake balance, recorded in vault').to.be.bignumber.equal(
            expectedBalances.stakeBalanceInVault,
        );
        expect(balances.withdrawableStakeBalance, 'withdrawable stake balance').to.be.bignumber.equal(
            expectedBalances.withdrawableStakeBalance,
        );
        expect(balances.activatableStakeBalance, 'activatable stake balance').to.be.bignumber.equal(
            expectedBalances.activatableStakeBalance,
        );
        expect(balances.activatedStakeBalance, 'activated stake balance').to.be.bignumber.equal(
            expectedBalances.activatedStakeBalance,
        );
        expect(balances.timeLockedStakeBalance, 'timeLocked stake balance').to.be.bignumber.equal(
            expectedBalances.timeLockedStakeBalance,
        );
        expect(balances.deactivatedStakeBalance, 'deactivated stake balance').to.be.bignumber.equal(
            expectedBalances.deactivatedStakeBalance,
        );
    }
    public async forceBalanceSyncAsync(): Promise<void> {
        const initBalances = await this.getBalancesAsync();
        await this._stakingWrapper.stakeAsync(this._owner, new BigNumber(0));
        await this.assertBalancesAsync(initBalances);
    }
    */
}
