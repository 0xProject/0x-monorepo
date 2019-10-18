import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { Actor, ActorConfig, Constructor } from './base';

export interface PoolOperatorConfig extends ActorConfig {
    operatorShare: number;
}

export function PoolOperator<TBase extends Constructor>(Base: TBase) {
    return class extends Base {
        public readonly operatorShare: number;
        public readonly poolIds: string[] = [];
        public readonly actor: Actor;

        constructor(...args: any[]) {
            super(...args);
            this.actor = (this as any) as Actor;

            const { operatorShare } = args[0] as PoolOperatorConfig;
            this.operatorShare = operatorShare;
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
            this.poolIds.push(poolId);
            return poolId;
        }

        /**
         * Joins the staking pool specified by the given ID.
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
    };
}

export const PoolOperatorActor = PoolOperator(Actor);
