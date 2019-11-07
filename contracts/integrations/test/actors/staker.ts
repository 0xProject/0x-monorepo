import { OwnerStakeByStatus, StakeInfo, StakeStatus, StoredBalance } from '@0x/contracts-staking';
import { getRandomInteger } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { validMoveStakeAssertion, validStakeAssertion, validUnstakeAssertion } from '../function-assertions';
import { SimulationEnvironment } from '../simulation/simulation';
import { AssertionResult } from '../utils/function_assertions';

import { Actor, Constructor } from './base';

export interface StakerInterface {
    stakeAsync: (amount: BigNumber, poolId?: string) => Promise<void>;
}

/**
 * This mixin encapsulates functionaltiy associated with stakers within the 0x ecosystem.
 * This includes staking ZRX (and optionally delegating it to a specific pool).
 */
export function StakerMixin<TBase extends Constructor>(Base: TBase): TBase & Constructor<StakerInterface> {
    return class extends Base {
        public stake: OwnerStakeByStatus;
        public readonly actor: Actor;

        /**
         * The mixin pattern requires that this constructor uses `...args: any[]`, but this class
         * really expects a single `ActorConfig` parameter (assuming `Actor` is used as the base
         * class).
         */
        constructor(...args: any[]) {
            // tslint:disable-next-line:no-inferred-empty-object-type
            super(...args);
            this.actor = (this as any) as Actor;
            this.stake = {
                [StakeStatus.Undelegated]: new StoredBalance(),
                [StakeStatus.Delegated]: { total: new StoredBalance() },
            };

            // Register this mixin's assertion generators
            if (this.actor.simulationEnvironment !== undefined) {
                this.actor.simulationActions = {
                    ...this.actor.simulationActions,
                    validStake: this._validStake(this.actor.simulationEnvironment),
                    validUnstake: this._validUnstake(this.actor.simulationEnvironment),
                    validMoveStake: this._validMoveStake(this.actor.simulationEnvironment),
                };
            }
        }

        /**
         * Stakes the given amount of ZRX. If `poolId` is provided, subsequently delegates the newly
         * staked ZRX with that pool.
         */
        public async stakeAsync(amount: BigNumber, poolId?: string): Promise<void> {
            const { stakingWrapper } = this.actor.deployment.staking;
            await stakingWrapper.stake.awaitTransactionSuccessAsync(amount, {
                from: this.actor.address,
            });
            if (poolId !== undefined) {
                await stakingWrapper.moveStake.awaitTransactionSuccessAsync(
                    new StakeInfo(StakeStatus.Undelegated),
                    new StakeInfo(StakeStatus.Delegated, poolId),
                    amount,
                    { from: this.actor.address },
                );
            }
        }

        private async *_validStake(
            simulationEnvironment: SimulationEnvironment,
        ): AsyncIterableIterator<AssertionResult> {
            const { zrx } = this.actor.deployment.tokens;
            const { deployment, balanceStore, globalStake } = simulationEnvironment;
            const assertion = validStakeAssertion(deployment, balanceStore, globalStake, this.stake);

            while (true) {
                await simulationEnvironment.balanceStore.updateErc20BalancesAsync();
                const zrxBalance = simulationEnvironment.balanceStore.balances.erc20[this.actor.address][zrx.address];
                const amount = getRandomInteger(0, zrxBalance);
                yield assertion.executeAsync(amount, { from: this.actor.address });
            }
        }

        private async *_validUnstake(
            simulationEnvironment: SimulationEnvironment,
        ): AsyncIterableIterator<AssertionResult> {
            const { stakingWrapper } = this.actor.deployment.staking;
            const { deployment, balanceStore, globalStake } = simulationEnvironment;
            const assertion = validUnstakeAssertion(deployment, balanceStore, globalStake, this.stake);

            while (true) {
                await simulationEnvironment.balanceStore.updateErc20BalancesAsync();
                const undelegatedStake = await stakingWrapper.getOwnerStakeByStatus.callAsync(
                    this.actor.address,
                    StakeStatus.Undelegated,
                );
                const withdrawableStake = BigNumber.min(
                    undelegatedStake.currentEpochBalance,
                    undelegatedStake.nextEpochBalance,
                );
                const amount = getRandomInteger(0, withdrawableStake);
                yield assertion.executeAsync(amount, { from: this.actor.address });
            }
        }

        private async *_validMoveStake(
            simulationEnvironment: SimulationEnvironment,
        ): AsyncIterableIterator<AssertionResult> {
            const { deployment, globalStake } = simulationEnvironment;
            const assertion = validMoveStakeAssertion(
                deployment,
                globalStake,
                this.stake,
                simulationEnvironment.stakingPools,
            );

            while (true) {
                const fromPoolId = _.sample(Object.keys(_.omit(this.stake[StakeStatus.Delegated], ['total'])));
                const fromStatus =
                    fromPoolId === undefined
                        ? StakeStatus.Undelegated
                        : (_.sample([StakeStatus.Undelegated, StakeStatus.Delegated]) as StakeStatus);
                const from = new StakeInfo(fromStatus, fromPoolId);

                const toPoolId = _.sample(Object.keys(simulationEnvironment.stakingPools));
                const toStatus =
                    toPoolId === undefined
                        ? StakeStatus.Undelegated
                        : (_.sample([StakeStatus.Undelegated, StakeStatus.Delegated]) as StakeStatus);
                const to = new StakeInfo(toStatus, toPoolId);

                const moveableStake =
                    from.status === StakeStatus.Undelegated
                        ? this.stake[StakeStatus.Undelegated].nextEpochBalance
                        : this.stake[StakeStatus.Delegated][from.poolId].nextEpochBalance;
                const amount = getRandomInteger(0, moveableStake);

                yield assertion.executeAsync(from, to, amount, { from: this.actor.address });
            }
        }
    };
}

export class Staker extends StakerMixin(Actor) {}
