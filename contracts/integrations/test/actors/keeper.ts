import { IStakingEventsStakingPoolEarnedRewardsInEpochEventArgs, TestStakingEvents } from '@0x/contracts-staking';
import { filterLogsToArguments, web3Wrapper } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { BlockParamLiteral, TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { Actor, Constructor } from './base';

export interface KeeperInterface {
    endEpochAsync: (shouldFastForward?: boolean) => Promise<TransactionReceiptWithDecodedLogs>;
    finalizePoolsAsync: (poolIds?: string[]) => Promise<TransactionReceiptWithDecodedLogs[]>;
}

/**
 * This mixin encapsulates functionaltiy associated with keepers within the 0x ecosystem.
 * This includes ending epochs sand finalizing pools in the staking system.
 */
export function KeeperMixin<TBase extends Constructor>(Base: TBase): TBase & Constructor<KeeperInterface> {
    return class extends Base {
        public readonly actor: Actor;

        /**
         * The mixin pattern requires that this constructor uses `...args: any[]`, but this class
         * really expects a single `Actor` parameter (assuming `Actor` is used as the base
         * class).
         */
        constructor(...args: any[]) {
            // tslint:disable-next-line:no-inferred-empty-object-type
            super(...args);
            this.actor = (this as any) as Actor;
        }

        /**
         * Ends the current epoch, fast-forwarding to the end of the epoch by default.
         */
        public async endEpochAsync(shouldFastForward: boolean = true): Promise<TransactionReceiptWithDecodedLogs> {
            const { stakingWrapper } = this.actor.deployment.staking;
            if (shouldFastForward) {
                // increase timestamp of next block by how many seconds we need to
                // get to the next epoch.
                const epochEndTime = await stakingWrapper.getCurrentEpochEarliestEndTimeInSeconds.callAsync();
                const lastBlockTime = await web3Wrapper.getBlockTimestampAsync('latest');
                const dt = Math.max(0, epochEndTime.minus(lastBlockTime).toNumber());
                await web3Wrapper.increaseTimeAsync(dt);
                // mine next block
                await web3Wrapper.mineBlockAsync();
            }
            return stakingWrapper.endEpoch.awaitTransactionSuccessAsync({ from: this.actor.address });
        }

        /**
         * Finalizes staking pools corresponding to the given `poolIds`. If none are provided,
         * finalizes all pools that earned rewards in the previous epoch.
         */
        public async finalizePoolsAsync(poolIds: string[] = []): Promise<TransactionReceiptWithDecodedLogs[]> {
            const { stakingWrapper } = this.actor.deployment.staking;
            // If no poolIds provided, finalize all active pools from the previous epoch
            if (poolIds.length === 0) {
                const previousEpoch = (await stakingWrapper.currentEpoch.callAsync()).minus(1);
                const events = filterLogsToArguments<IStakingEventsStakingPoolEarnedRewardsInEpochEventArgs>(
                    await stakingWrapper.getLogsAsync(
                        TestStakingEvents.StakingPoolEarnedRewardsInEpoch,
                        { fromBlock: BlockParamLiteral.Earliest, toBlock: BlockParamLiteral.Latest },
                        { epoch: new BigNumber(previousEpoch) },
                    ),
                    TestStakingEvents.StakingPoolEarnedRewardsInEpoch,
                );
                poolIds.concat(events.map(event => event.poolId));
            }

            return Promise.all(
                poolIds.map(async poolId =>
                    stakingWrapper.finalizePool.awaitTransactionSuccessAsync(poolId, {
                        from: this.actor.address,
                    }),
                ),
            );
        }
    };
}

export class Keeper extends KeeperMixin(Actor) {}
