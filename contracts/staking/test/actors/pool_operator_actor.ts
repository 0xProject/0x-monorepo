import {
    chaiSetup,
    constants,
    expectTransactionFailedAsync,
    provider,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
import { RevertReason } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import * as _ from 'lodash';

import { StakingWrapper } from '../utils/staking_wrapper';
import { DelegatorBalances, StakerBalances } from '../utils/types';

import { BaseActor } from './base_actor';
import { constants as stakingConstants } from '../utils/constants';

const expect = chai.expect;

export class PoolOperatorActor extends BaseActor {
    constructor(owner: string, stakingWrapper: StakingWrapper) {
        super(owner, stakingWrapper);
    }

    public async createPoolAsync(operatorShare: number, revertReason?: RevertReason): Promise<string> {
        // query next pool id
        const nextPoolId = await this._stakingWrapper.getNextPoolIdAsync();
        // create pool
        const poolIdPromise = this._stakingWrapper.createPoolAsync(this._owner, operatorShare);
        if (revertReason !== undefined) {
            await expectTransactionFailedAsync(poolIdPromise, revertReason);
            return '';
        }
        const poolId = await poolIdPromise;
        // validate pool id
        expect(poolId, 'pool id').to.be.bignumber.equal(nextPoolId);
        return poolId;
    }
    public async addMakerToPoolAsync(
        poolId: string,
        makerAddress: string,
        makerSignature: string,
        revertReason?: RevertReason,
    ): Promise<void> {
        // add maker
        const txReceiptPromise = this._stakingWrapper.addMakerToPoolAsync(
            poolId,
            makerAddress,
            makerSignature,
            this._owner,
        );
        if (revertReason !== undefined) {
            await expectTransactionFailedAsync(txReceiptPromise, revertReason);
            return;
        }
        const txReceipt = await txReceiptPromise;
        // check the pool id of the maker
        const poolIdOfMaker = await this._stakingWrapper.getMakerPoolId(makerAddress);
        expect(poolIdOfMaker, 'pool id of maker').to.be.equal(poolId);
        // check the list of makers for the pool
        const makerAddressesForPool = await this._stakingWrapper.getMakerAddressesForPool(poolId);
        expect(makerAddressesForPool, 'maker addresses for pool').to.include(makerAddress);
    }
    public async removeMakerFromPoolAsync(
        poolId: string,
        makerAddress: string,
        revertReason?: RevertReason,
    ): Promise<void> {
        // remove maker
        const txReceiptPromise = this._stakingWrapper.removeMakerFromPoolAsync(poolId, makerAddress, this._owner);
        if (revertReason !== undefined) {
            await expectTransactionFailedAsync(txReceiptPromise, revertReason);
            return;
        }
        const txReceipt = await txReceiptPromise;
        // check the pool id of the maker
        const poolIdOfMakerAfterRemoving = await this._stakingWrapper.getMakerPoolId(makerAddress);
        expect(poolIdOfMakerAfterRemoving, 'pool id of maker').to.be.equal(stakingConstants.NIL_POOL_ID);
        // check the list of makers for the pool
        const makerAddressesForPoolAfterRemoving = await this._stakingWrapper.getMakerAddressesForPool(poolId);
        expect(makerAddressesForPoolAfterRemoving, 'maker addresses for pool').to.not.include(makerAddress);
    }
}
