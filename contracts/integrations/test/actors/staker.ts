import { StakeInfo, StakeStatus } from '@0x/contracts-staking';
import { BigNumber } from '@0x/utils';

import { Actor, Constructor } from './base';

export function StakerMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base {
        public readonly actor: Actor;

        /**
         * The mixin pattern requires that this constructor uses `...args: any[]`, but this class
         * really expects a single `ActorConfig` parameter (assuming `Actor` is used as the base
         * class).
         */
        constructor(...args: any[]) {
            super(...args);
            this.actor = (this as any) as Actor;
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
    };
}

export class Staker extends StakerMixin(Actor) {}
