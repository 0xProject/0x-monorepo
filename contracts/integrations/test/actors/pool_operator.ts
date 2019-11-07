import { constants } from '@0x/contracts-staking';
import { getRandomInteger } from '@0x/contracts-test-utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import {
    validCreateStakingPoolAssertion,
    validDecreaseStakingPoolOperatorShareAssertion,
} from '../function-assertions';
import { SimulationEnvironment } from '../simulation/simulation';
import { AssertionResult } from '../utils/function_assertions';

import { Actor, Constructor } from './base';

export interface PoolOperatorInterface {
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
            if (this.actor.simulationEnvironment !== undefined) {
                this.actor.simulationActions = {
                    ...this.actor.simulationActions,
                    validCreateStakingPool: this._validCreateStakingPool(this.actor.simulationEnvironment),
                    validDecreaseStakingPoolOperatorShare: this._validDecreaseStakingPoolOperatorShare(
                        this.actor.simulationEnvironment,
                    ),
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
            return stakingContract.decreaseStakingPoolOperatorShare.awaitTransactionSuccessAsync(
                poolId,
                newOperatorShare,
                { from: this.actor.address },
            );
        }

        private _getOperatorPoolIds(simulationEnvironment: SimulationEnvironment): string[] {
            const operatorPools = _.pickBy(
                simulationEnvironment.stakingPools,
                pool => pool.operator === this.actor.address,
            );
            return Object.keys(operatorPools);
        }

        private async *_validCreateStakingPool(
            simulationEnvironment: SimulationEnvironment,
        ): AsyncIterableIterator<AssertionResult> {
            const assertion = validCreateStakingPoolAssertion(
                this.actor.deployment,
                simulationEnvironment.stakingPools,
            );
            while (true) {
                const operatorShare = getRandomInteger(0, constants.PPM);
                yield assertion.executeAsync(operatorShare, false, { from: this.actor.address });
            }
        }

        private async *_validDecreaseStakingPoolOperatorShare(
            simulationEnvironment: SimulationEnvironment,
        ): AsyncIterableIterator<AssertionResult | void> {
            const assertion = validDecreaseStakingPoolOperatorShareAssertion(
                this.actor.deployment,
                simulationEnvironment.stakingPools,
            );
            while (true) {
                const poolId = _.sample(this._getOperatorPoolIds(simulationEnvironment));
                if (poolId === undefined) {
                    yield undefined;
                } else {
                    const operatorShare = getRandomInteger(0, simulationEnvironment.stakingPools[poolId].operatorShare);
                    yield assertion.executeAsync(poolId, operatorShare, { from: this.actor.address });
                }
            }
        }
    };
}

export class PoolOperator extends PoolOperatorMixin(Actor) {}
