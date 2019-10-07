import { expect } from '@0x/contracts-test-utils';
import { RevertError } from '@0x/utils';
import * as _ from 'lodash';

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
            const poolIdOfMaker = await this._stakingApiWrapper.stakingContract.poolIdByMaker.callAsync(this._owner);
            expect(poolIdOfMaker, 'pool id of maker').to.be.equal(poolId);
        }
        return poolId;
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
        const pool = await this._stakingApiWrapper.stakingContract.getStakingPool.callAsync(poolId);
        expect(pool.operatorShare, 'updated operator share').to.be.bignumber.equal(newOperatorShare);
    }
}
