import { expect } from '@0x/contracts-test-utils';
import { BigNumber, RevertError } from '@0x/utils';
import * as _ from 'lodash';

import { constants as stakingConstants } from '../utils/constants';

import { BaseActor } from './base_actor';

export class PoolOperatorActor extends BaseActor {
    public async createStakingPoolAsync(
        operatorShare: number,
        addOperatorAsMaker: boolean,
        revertError?: RevertError,
    ): Promise<string> {
        // query next pool id
        const nextPoolId = await this._stakingApiWrapper.stakingContract.nextPoolId.callAsync();
        // create pool
        const poolIdPromise = this._stakingApiWrapper.utils.createStakingPoolAsync(
            this._owner,
            operatorShare,
            addOperatorAsMaker,
        );
        if (revertError !== undefined) {
            await expect(poolIdPromise).to.revertWith(revertError);
            return '';
        }
        const poolId = await poolIdPromise;
        // validate pool id
        expect(poolId, 'pool id').to.be.bignumber.equal(nextPoolId);

        if (addOperatorAsMaker) {
            // check the pool id of the operator
            const poolIdOfMaker = await this._stakingApiWrapper.stakingContract.getStakingPoolIdOfMaker.callAsync(
                this._owner,
            );
            expect(poolIdOfMaker, 'pool id of maker').to.be.equal(poolId);
            // check the number of makers in the pool
            const numMakersAfterRemoving = await this._stakingApiWrapper.stakingContract.numMakersByPoolId.callAsync(
                poolId,
            );
            expect(numMakersAfterRemoving, 'number of makers in pool').to.be.bignumber.equal(1);
        }
        return poolId;
    }
    public async addMakerToStakingPoolAsync(
        poolId: string,
        makerAddress: string,
        revertError?: RevertError,
    ): Promise<void> {
        // add maker
        const txReceiptPromise = this._stakingApiWrapper.stakingContract.addMakerToStakingPool.awaitTransactionSuccessAsync(
            poolId,
            makerAddress,
            { from: this._owner },
        );
        if (revertError !== undefined) {
            await expect(txReceiptPromise).to.revertWith(revertError);
            return;
        }
        await txReceiptPromise;
        // check the pool id of the maker
        const poolIdOfMaker = await this._stakingApiWrapper.stakingContract.getStakingPoolIdOfMaker.callAsync(
            makerAddress,
        );
        expect(poolIdOfMaker, 'pool id of maker').to.be.equal(poolId);
    }
    public async removeMakerFromStakingPoolAsync(
        poolId: string,
        makerAddress: string,
        revertError?: RevertError,
    ): Promise<void> {
        // remove maker
        const txReceiptPromise = this._stakingApiWrapper.stakingContract.removeMakerFromStakingPool.awaitTransactionSuccessAsync(
            poolId,
            makerAddress,
            { from: this._owner },
        );
        if (revertError !== undefined) {
            await expect(txReceiptPromise).to.revertWith(revertError);
            return;
        }
        await txReceiptPromise;
        // check the pool id of the maker
        const poolIdOfMakerAfterRemoving = await this._stakingApiWrapper.stakingContract.getStakingPoolIdOfMaker.callAsync(
            makerAddress,
        );
        expect(poolIdOfMakerAfterRemoving, 'pool id of maker').to.be.equal(stakingConstants.NIL_POOL_ID);
    }
    public async decreaseStakingPoolOperatorShareAsync(
        poolId: string,
        newOperatorShare: number,
        revertError?: RevertError,
    ): Promise<void> {
        // decrease operator share
        const txReceiptPromise = this._stakingApiWrapper.stakingContract.decreaseStakingPoolOperatorShare.awaitTransactionSuccessAsync(
            poolId,
            newOperatorShare,
            { from: this._owner },
        );
        if (revertError !== undefined) {
            await expect(txReceiptPromise).to.revertWith(revertError);
            return;
        }
        await txReceiptPromise;
        // Check operator share
        const pool = await this._stakingApiWrapper.rewardVaultContract.poolById.callAsync(poolId);
        const decreasedOperatorShare = new BigNumber(pool[1]);
        expect(decreasedOperatorShare, 'updated operator share').to.be.bignumber.equal(newOperatorShare);
    }
}
