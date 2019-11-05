import { constants } from '@0x/contracts-staking';
import { getRandomInteger } from '@0x/contracts-test-utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import {
    validCreateStakingPoolAssertion,
    validDecreaseStakingPoolOperatorShareAssertion,
} from '../function-assertions';
import { AssertionResult } from '../utils/function_assertions';

import { Actor, Constructor } from './base';

interface OperatorShareByPoolId {
    [poolId: string]: number;
}

export interface PoolOperatorInterface {
    operatorShares: OperatorShareByPoolId;
    createStakingPoolAsync: (operatorShare: number, addOperatorAsMaker?: boolean) => Promise<string>;
    decreaseOperatorShareAsync: (
        poolId: string,
        newOperatorShare: number,
    ) => Promise<TransactionReceiptWithDecodedLogs>;
}

/**
 * This mixin encapsulates functionaltiy associated with pool operators within the 0x ecosystem.
 * This includes creating staking pools and decreasing the operator share of a pool.
 */
export function PoolOperatorMixin<TBase extends Constructor>(Base: TBase): TBase & Constructor<PoolOperatorInterface> {
    return class extends Base {
        public readonly operatorShares: OperatorShareByPoolId = {};
        public readonly actor: Actor;

        /**
         * The mixin pattern requires that this constructor uses `...args: any[]`, but this class
         * really expects a single `ActorConfig` parameter (assuming `Actor` is used as the
         * base class).
         */
        constructor(...args: any[]) {
            // tslint:disable-next-line:no-inferred-empty-object-type
            super(...args);
            this.actor = (this as any) as Actor;

            // Register this mixin's assertion generators
            if (this.actor.simulation !== undefined) {
                this.actor.simulationActions = {
                    ...this.actor.simulationActions,
                    validCreateStakingPool: this._validCreateStakingPool().next,
                    validDecreaseStakingPoolOperatorShare: this._validDecreaseStakingPoolOperatorShare().next,
                };
            }
        }

        /**
         * Creates a staking pool and returns the ID of the new pool.
         */
        public async createStakingPoolAsync(
            operatorShare: number,
            addOperatorAsMaker: boolean = false,
        ): Promise<string> {
            const stakingContract = this.actor.deployment.staking.stakingWrapper;
            const txReceipt = await stakingContract.createStakingPool.awaitTransactionSuccessAsync(
                operatorShare,
                addOperatorAsMaker,
                { from: this.actor.address },
            );

            const createStakingPoolLog = txReceipt.logs[0];
            const poolId = (createStakingPoolLog as any).args.poolId;
            this.operatorShares[poolId] = operatorShare;
            return poolId;
        }

        /**
         * Decreases the operator share of a specified staking pool.
         */
        public async decreaseOperatorShareAsync(
            poolId: string,
            newOperatorShare: number,
        ): Promise<TransactionReceiptWithDecodedLogs> {
            const stakingContract = this.actor.deployment.staking.stakingWrapper;
            this.operatorShares[poolId] = newOperatorShare;
            return stakingContract.decreaseStakingPoolOperatorShare.awaitTransactionSuccessAsync(
                poolId,
                newOperatorShare,
                { from: this.actor.address },
            );
        }

        private async *_validCreateStakingPool(): AsyncIterableIterator<AssertionResult> {
            const assertion = validCreateStakingPoolAssertion(this.actor.deployment, this);
            while (true) {
                const operatorShare = getRandomInteger(0, constants.PPM);
                yield assertion.executeAsync(operatorShare, false, { from: this.actor.address });
            }
        }

        private async *_validDecreaseStakingPoolOperatorShare(): AsyncIterableIterator<AssertionResult | void> {
            const assertion = validDecreaseStakingPoolOperatorShareAssertion(this.actor.deployment, this);
            while (true) {
                const poolId = _.sample(Object.keys(this.operatorShares));
                if (poolId === undefined) {
                    yield undefined;
                } else {
                    const operatorShare = getRandomInteger(0, this.operatorShares[poolId]);
                    yield assertion.executeAsync(poolId, operatorShare, { from: this.actor.address });
                }
            }
        }
    };
}

export class PoolOperator extends PoolOperatorMixin(Actor) {}
