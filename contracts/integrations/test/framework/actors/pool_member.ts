import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { AssertionResult } from '../assertions/function_assertion';
import { validJoinStakingPoolAssertion } from '../assertions/joinStakingPool';

import { Actor, Constructor } from './base';
import { PoolOperatorMixin } from './pool_operator';

interface PoolMemberInterface {
    joinStakingPoolAsync: (poolId: string) => Promise<TransactionReceiptWithDecodedLogs>;
}

/**
 * This mixin encapsulates functionaltiy associated with pool operators within the 0x ecosystem.
 * This includes creating staking pools and decreasing the operator share of a pool.
 */
export function PoolMemberMixin<TBase extends Constructor>(Base: TBase): TBase & Constructor<PoolMemberInterface> {
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

            // Register this mixin's assertion generators
            this.actor.simulationActions = {
                ...this.actor.simulationActions,
                validJoinStakingPool: this._validJoinStakingPool(),
            };
        }

        /**
         * Joins a new staking pool.
         */
        public async joinStakingPoolAsync(poolId: string): Promise<TransactionReceiptWithDecodedLogs> {
            const stakingContract = this.actor.deployment.staking.stakingWrapper;
            return stakingContract
                .joinStakingPoolAsMaker(poolId)
                .awaitTransactionSuccessAsync({ from: this.actor.address });
        }

        // FIXME(jalextowle): I need to make sure that this is being sent from the actor's address
        private async *_validJoinStakingPool(): AsyncIterableIterator<AssertionResult | void> {
            const { stakingPools } = this.actor.simulationEnvironment!;
            const assertion = validJoinStakingPoolAssertion(this.actor.deployment);
            while (true) {
                const poolId = _.sample(Object.keys(stakingPools));
                if (poolId === undefined) {
                    yield undefined;
                } else {
                    console.log('Attempting to join pool');
                    yield assertion.executeAsync({ args: [poolId], txData: {} });
                }
            }
        }
    };
}

export class PoolMember extends PoolOperatorMixin(PoolMemberMixin(Actor)) {}
