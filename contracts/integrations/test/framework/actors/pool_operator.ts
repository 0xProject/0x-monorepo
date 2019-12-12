import { constants, StakingPoolById } from '@0x/contracts-staking';
import '@azure/core-asynciterator-polyfill';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { validCreateStakingPoolAssertion } from '../assertions/createStakingPool';
import { validDecreaseStakingPoolOperatorShareAssertion } from '../assertions/decreaseStakingPoolOperatorShare';
import { AssertionResult } from '../assertions/function_assertion';
import { Pseudorandom } from '../utils/pseudorandom';

import { Actor, Constructor } from './base';

export interface PoolOperatorInterface {
    createStakingPoolAsync: (operatorShare: number, addOperatorAsMaker?: boolean) => Promise<string>;
    decreaseOperatorShareAsync: (
        poolId: string,
        newOperatorShare: number,
    ) => Promise<TransactionReceiptWithDecodedLogs>;
}

/**
 * This mixin encapsulates functionality associated with pool operators within the 0x ecosystem.
 * This includes creating staking pools and decreasing the operator share of a pool.
 */
export function PoolOperatorMixin<TBase extends Constructor>(Base: TBase): TBase & Constructor<PoolOperatorInterface> {
    return class extends Base {
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
            this.actor.mixins.push('PoolOperator');

            // Register this mixin's assertion generators
            this.actor.simulationActions = {
                ...this.actor.simulationActions,
                validCreateStakingPool: this._validCreateStakingPool(),
                validDecreaseStakingPoolOperatorShare: this._validDecreaseStakingPoolOperatorShare(),
            };
        }

        /**
         * Creates a staking pool and returns the ID of the new pool.
         */
        public async createStakingPoolAsync(
            operatorShare: number,
            addOperatorAsMaker: boolean = false,
        ): Promise<string> {
            const stakingContract = this.actor.deployment.staking.stakingWrapper;
            const txReceipt = await stakingContract
                .createStakingPool(operatorShare, addOperatorAsMaker)
                .awaitTransactionSuccessAsync({ from: this.actor.address });

            const createStakingPoolLog = txReceipt.logs[0];
            const poolId = (createStakingPoolLog as any).args.poolId;
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
            return stakingContract
                .decreaseStakingPoolOperatorShare(poolId, newOperatorShare)
                .awaitTransactionSuccessAsync({ from: this.actor.address });
        }

        private _getOperatorPoolIds(stakingPools: StakingPoolById): string[] {
            const operatorPools = _.pickBy(stakingPools, pool => pool.operator === this.actor.address);
            return Object.keys(operatorPools);
        }

        private async *_validCreateStakingPool(): AsyncIterableIterator<AssertionResult> {
            const assertion = validCreateStakingPoolAssertion(this.actor.deployment, this.actor.simulationEnvironment!);
            while (true) {
                const operatorShare = Pseudorandom.integer(constants.PPM).toNumber();
                yield assertion.executeAsync([operatorShare, false], { from: this.actor.address });
            }
        }

        private async *_validDecreaseStakingPoolOperatorShare(): AsyncIterableIterator<AssertionResult | void> {
            const { stakingPools } = this.actor.simulationEnvironment!;
            const assertion = validDecreaseStakingPoolOperatorShareAssertion(this.actor.deployment, stakingPools);
            while (true) {
                const poolId = Pseudorandom.sample(this._getOperatorPoolIds(stakingPools));
                if (poolId === undefined) {
                    yield undefined;
                } else {
                    const operatorShare = Pseudorandom.integer(stakingPools[poolId].operatorShare).toNumber();
                    yield assertion.executeAsync([poolId, operatorShare], { from: this.actor.address });
                }
            }
        }
    };
}

export class PoolOperator extends PoolOperatorMixin(Actor) {}
