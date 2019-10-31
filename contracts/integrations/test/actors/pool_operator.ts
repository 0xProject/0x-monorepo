import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { Actor, Constructor } from './base';

export interface OperatorShareByPoolId {
    [poolId: string]: number;
}

export function PoolOperatorMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base {
        public readonly operatorShares: OperatorShareByPoolId = {};
        public readonly actor: Actor;

        /**
         * The mixin pattern requires that this constructor uses `...args: any[]`, but this class
         * really expects a single `ActorConfig` parameter (assuming `Actor` is used as the
         * base class).
         */
        constructor(...args: any[]) {
            super(...args);
            this.actor = (this as any) as Actor;
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
    };
}

export class PoolOperator extends PoolOperatorMixin(Actor) {}
