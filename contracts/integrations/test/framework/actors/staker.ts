import { OwnerStakeByStatus, StakeInfo, StakeStatus, StoredBalance } from '@0x/contracts-staking';
import { constants } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import '@azure/core-asynciterator-polyfill';
import * as _ from 'lodash';

import { AssertionResult } from '../assertions/function_assertion';
import { assetProxyTransferFailedAssertion } from '../assertions/generic_assertions';
import { moveStakeNonexistentPoolAssertion, validMoveStakeAssertion } from '../assertions/moveStake';
import { validStakeAssertion } from '../assertions/stake';
import { invalidUnstakeAssertion, validUnstakeAssertion } from '../assertions/unstake';
import {
    invalidWithdrawDelegatorRewardsAssertion,
    validWithdrawDelegatorRewardsAssertion,
} from '../assertions/withdrawDelegatorRewards';
import { Pseudorandom } from '../utils/pseudorandom';

import { Actor, Constructor } from './base';

export interface StakerInterface {
    stakeAsync: (amount: BigNumber, poolId?: string) => Promise<void>;
}

/**
 * This mixin encapsulates functionality associated with stakers within the 0x ecosystem.
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
            this.actor.mixins.push('Staker');

            this.stake = {
                [StakeStatus.Undelegated]: new StoredBalance(),
                [StakeStatus.Delegated]: { total: new StoredBalance() },
            };

            // Register this mixin's assertion generators
            this.actor.simulationActions = {
                ...this.actor.simulationActions,
                validStake: this._validStake(),
                invalidStake: this._invalidStake(),
                validUnstake: this._validUnstake(),
                invalidUnstake: this._invalidUnstake(),
                validMoveStake: this._validMoveStake(),
                moveStakeNonexistentPool: this._moveStakeNonexistentPool(),
                validWithdrawDelegatorRewards: this._validWithdrawDelegatorRewards(),
                invalidWithdrawDelegatorRewards: this._invalidWithdrawDelegatorRewards(),
            };
        }

        /**
         * Stakes the given amount of ZRX. If `poolId` is provided, subsequently delegates the newly
         * staked ZRX with that pool.
         */
        public async stakeAsync(amount: BigNumber, poolId?: string): Promise<void> {
            const { stakingWrapper } = this.actor.deployment.staking;
            await stakingWrapper.stake(amount).awaitTransactionSuccessAsync({
                from: this.actor.address,
            });
            if (poolId !== undefined) {
                await stakingWrapper
                    .moveStake(
                        new StakeInfo(StakeStatus.Undelegated),
                        new StakeInfo(StakeStatus.Delegated, poolId),
                        amount,
                    )
                    .awaitTransactionSuccessAsync({ from: this.actor.address });
            }
        }

        private async *_validStake(): AsyncIterableIterator<AssertionResult> {
            const { zrx } = this.actor.deployment.tokens;
            const { deployment, balanceStore } = this.actor.simulationEnvironment!;
            const assertion = validStakeAssertion(deployment, this.actor.simulationEnvironment!, this.stake);

            while (true) {
                await balanceStore.updateErc20BalancesAsync();
                const zrxBalance = balanceStore.balances.erc20[this.actor.address][zrx.address];
                const amount = Pseudorandom.integer(0, zrxBalance);
                yield assertion.executeAsync([amount], { from: this.actor.address });
            }
        }

        private async *_invalidStake(): AsyncIterableIterator<AssertionResult> {
            const { zrx } = this.actor.deployment.tokens;
            const { deployment, balanceStore } = this.actor.simulationEnvironment!;
            const assertion = assetProxyTransferFailedAssertion(deployment.staking.stakingWrapper, 'stake');

            while (true) {
                await balanceStore.updateErc20BalancesAsync();
                const zrxBalance = balanceStore.balances.erc20[this.actor.address][zrx.address];
                const amount = Pseudorandom.integer(zrxBalance.plus(1), constants.MAX_UINT256);
                yield assertion.executeAsync([amount], { from: this.actor.address });
            }
        }

        private async *_validUnstake(): AsyncIterableIterator<AssertionResult> {
            const { stakingWrapper } = this.actor.deployment.staking;
            const { deployment, balanceStore } = this.actor.simulationEnvironment!;
            const assertion = validUnstakeAssertion(deployment, this.actor.simulationEnvironment!, this.stake);

            while (true) {
                await balanceStore.updateErc20BalancesAsync();
                const undelegatedStake = await stakingWrapper
                    .getOwnerStakeByStatus(this.actor.address, StakeStatus.Undelegated)
                    .callAsync();
                const withdrawableStake = BigNumber.min(
                    undelegatedStake.currentEpochBalance,
                    undelegatedStake.nextEpochBalance,
                );
                const amount = Pseudorandom.integer(0, withdrawableStake);
                yield assertion.executeAsync([amount], { from: this.actor.address });
            }
        }

        private async *_invalidUnstake(): AsyncIterableIterator<AssertionResult> {
            const { stakingWrapper } = this.actor.deployment.staking;
            const { deployment, balanceStore } = this.actor.simulationEnvironment!;

            while (true) {
                await balanceStore.updateErc20BalancesAsync();
                const undelegatedStake = await stakingWrapper
                    .getOwnerStakeByStatus(this.actor.address, StakeStatus.Undelegated)
                    .callAsync();
                const withdrawableStake = BigNumber.min(
                    undelegatedStake.currentEpochBalance,
                    undelegatedStake.nextEpochBalance,
                );
                const assertion = invalidUnstakeAssertion(deployment, withdrawableStake);
                const amount = Pseudorandom.integer(withdrawableStake.plus(1), constants.MAX_UINT256);
                yield assertion.executeAsync([amount], { from: this.actor.address });
            }
        }

        private _validMoveParams(): [StakeInfo, StakeInfo, BigNumber] {
            const { stakingPools, currentEpoch } = this.actor.simulationEnvironment!;
            // Pick a random pool that this staker has delegated to (undefined if no such pools exist)
            const fromPoolId = Pseudorandom.sample(Object.keys(_.omit(this.stake[StakeStatus.Delegated], ['total'])));
            // The `from` status must be Undelegated if the staker isn't delegated to any pools
            // at the moment, or if the chosen pool is unfinalized
            const fromStatus =
                fromPoolId === undefined || stakingPools[fromPoolId].lastFinalized.isLessThan(currentEpoch.minus(1))
                    ? StakeStatus.Undelegated
                    : (Pseudorandom.sample(
                          [StakeStatus.Undelegated, StakeStatus.Delegated],
                          [0.2, 0.8], // 20% chance of `Undelegated`, 80% chance of `Delegated`
                      ) as StakeStatus);
            const from = new StakeInfo(fromStatus, fromPoolId);

            // Pick a random pool to move the stake to
            const toPoolId = Pseudorandom.sample(Object.keys(stakingPools));
            // The `from` status must be Undelegated if no pools exist in the simulation yet,
            // or if the chosen pool is unfinalized
            const toStatus =
                toPoolId === undefined || stakingPools[toPoolId].lastFinalized.isLessThan(currentEpoch.minus(1))
                    ? StakeStatus.Undelegated
                    : (Pseudorandom.sample(
                          [StakeStatus.Undelegated, StakeStatus.Delegated],
                          [0.2, 0.8], // 20% chance of `Undelegated`, 80% chance of `Delegated`
                      ) as StakeStatus);
            const to = new StakeInfo(toStatus, toPoolId);

            // The next epoch balance of the `from` stake is the amount that can be moved
            const moveableStake =
                from.status === StakeStatus.Undelegated
                    ? this.stake[StakeStatus.Undelegated].nextEpochBalance
                    : this.stake[StakeStatus.Delegated][from.poolId].nextEpochBalance;
            const amount = Pseudorandom.integer(0, moveableStake);

            return [from, to, amount];
        }

        private async *_validMoveStake(): AsyncIterableIterator<AssertionResult> {
            const assertion = validMoveStakeAssertion(
                this.actor.deployment,
                this.actor.simulationEnvironment!,
                this.stake,
            );

            while (true) {
                const [from, to, amount] = this._validMoveParams();
                yield assertion.executeAsync([from, to, amount], { from: this.actor.address });
            }
        }

        private async *_moveStakeNonexistentPool(): AsyncIterableIterator<AssertionResult> {
            while (true) {
                const [from, to, amount] = this._validMoveParams();

                // If there is 0 moveable stake for the sampled `to` pool, we need to mutate the
                // `from` info, otherwise `moveStake` will just noop
                if (amount.isZero()) {
                    from.poolId = Pseudorandom.hex();
                    // Status must be delegated and amount must be nonzero to trigger _assertStakingPoolExists
                    from.status = StakeStatus.Delegated;
                    const randomAmount = Pseudorandom.integer(1, constants.MAX_UINT256);
                    const assertion = moveStakeNonexistentPoolAssertion(this.actor.deployment, from.poolId);
                    yield assertion.executeAsync([from, to, randomAmount], { from: this.actor.address });
                } else {
                    // One or both of the `from` and `to` poolId are invalid
                    const infoToMutate = Pseudorandom.sample([[from], [to], [from, to]]);
                    let nonExistentPoolId;
                    for (const info of infoToMutate!) {
                        info.poolId = Pseudorandom.hex();
                        nonExistentPoolId = nonExistentPoolId || info.poolId;
                        // Status must be delegated and amount must be nonzero to trigger _assertStakingPoolExists
                        info.status = StakeStatus.Delegated;
                    }
                    const assertion = moveStakeNonexistentPoolAssertion(
                        this.actor.deployment,
                        nonExistentPoolId as string,
                    );
                    yield assertion.executeAsync([from, to, amount], { from: this.actor.address });
                }
            }
        }

        private async *_validWithdrawDelegatorRewards(): AsyncIterableIterator<AssertionResult | void> {
            const { stakingPools } = this.actor.simulationEnvironment!;
            const assertion = validWithdrawDelegatorRewardsAssertion(
                this.actor.deployment,
                this.actor.simulationEnvironment!,
            );
            while (true) {
                const prevEpoch = this.actor.simulationEnvironment!.currentEpoch.minus(1);
                // Pick a finalized pool
                const poolId = Pseudorandom.sample(
                    Object.keys(stakingPools).filter(id =>
                        stakingPools[id].lastFinalized.isGreaterThanOrEqualTo(prevEpoch),
                    ),
                );
                if (poolId === undefined) {
                    yield;
                } else {
                    yield assertion.executeAsync([poolId], { from: this.actor.address });
                }
            }
        }

        private async *_invalidWithdrawDelegatorRewards(): AsyncIterableIterator<AssertionResult | void> {
            const { stakingPools } = this.actor.simulationEnvironment!;
            const assertion = invalidWithdrawDelegatorRewardsAssertion(
                this.actor.deployment,
                this.actor.simulationEnvironment!,
            );
            while (true) {
                const prevEpoch = this.actor.simulationEnvironment!.currentEpoch.minus(1);
                // Pick an unfinalized pool
                const poolId = Pseudorandom.sample(
                    Object.keys(stakingPools).filter(id => stakingPools[id].lastFinalized.isLessThan(prevEpoch)),
                );
                if (poolId === undefined) {
                    yield;
                } else {
                    yield assertion.executeAsync([poolId], { from: this.actor.address });
                }
            }
        }
    };
}

export class Staker extends StakerMixin(Actor) {}
