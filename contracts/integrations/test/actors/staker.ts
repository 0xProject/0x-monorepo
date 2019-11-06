import { BlockchainBalanceStore } from '@0x/contracts-exchange';
import { StakeInfo, StakeStatus } from '@0x/contracts-staking';
import { getRandomInteger } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';

import { validStakeAssertion, validUnstakeAssertion } from '../function-assertions';
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

            // Register this mixin's assertion generators
            if (this.actor.simulationEnvironment !== undefined) {
                const { balanceStore } = this.actor.simulationEnvironment;
                this.actor.simulationActions = {
                    ...this.actor.simulationActions,
                    validStake: this._validStake(balanceStore),
                    validUnstake: this._validUnstake(balanceStore),
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

        private async *_validStake(balanceStore: BlockchainBalanceStore): AsyncIterableIterator<AssertionResult> {
            const { zrx } = this.actor.deployment.tokens;
            const assertion = validStakeAssertion(this.actor.deployment, balanceStore);

            while (true) {
                await balanceStore.updateErc20BalancesAsync();
                const zrxBalance = balanceStore.balances.erc20[this.actor.address][zrx.address];
                const amount = getRandomInteger(0, zrxBalance);
                console.log(`stake(${amount})`);
                yield assertion.executeAsync(amount, { from: this.actor.address });
            }
        }

        private async *_validUnstake(balanceStore: BlockchainBalanceStore): AsyncIterableIterator<AssertionResult> {
            const { stakingWrapper } = this.actor.deployment.staking;
            const assertion = validUnstakeAssertion(this.actor.deployment, balanceStore);

            while (true) {
                await balanceStore.updateErc20BalancesAsync();
                const undelegatedStake = await stakingWrapper.getOwnerStakeByStatus.callAsync(
                    this.actor.address,
                    StakeStatus.Undelegated,
                );
                const withdrawableStake = BigNumber.min(
                    undelegatedStake.currentEpochBalance,
                    undelegatedStake.nextEpochBalance,
                );
                const amount = getRandomInteger(0, withdrawableStake);
                console.log(`unstake(${amount})`);
                yield assertion.executeAsync(amount, { from: this.actor.address });
            }
        }
    };
}

export class Staker extends StakerMixin(Actor) {}
