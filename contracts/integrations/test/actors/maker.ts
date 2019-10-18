import { constants, OrderFactory } from '@0x/contracts-test-utils';
import { Order, SignedOrder } from '@0x/types';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { Actor, ActorConfig, Constructor } from './base';

export interface MakerConfig extends ActorConfig {
    orderConfig: Partial<Order>;
}

export function MakerMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base {
        public poolId?: string;
        public readonly actor: Actor;
        public readonly orderFactory: OrderFactory;

        /**
         * The mixin pattern requires that this constructor uses `...args: any[]`, but this class
         * really expects a single `MakerConfig` parameter (assuming `Actor` is used as the base
         * class).
         */
        constructor(...args: any[]) {
            super(...args);
            this.actor = (this as any) as Actor;

            const { orderConfig } = args[0] as MakerConfig;
            const defaultOrderParams = {
                ...constants.STATIC_ORDER_PARAMS,
                makerAddress: this.actor.address,
                exchangeAddress: this.actor.deployment.exchange.address,
                chainId: this.actor.deployment.chainId,
                ...orderConfig,
            };
            const privateKey =
                constants.TESTRPC_PRIVATE_KEYS[this.actor.deployment.accounts.indexOf(this.actor.address)];
            this.orderFactory = new OrderFactory(privateKey, defaultOrderParams);
        }

        /**
         * Signs an order (optionally, with custom parameters) as the maker.
         */
        public async signOrderAsync(customOrderParams: Partial<Order> = {}): Promise<SignedOrder> {
            return this.orderFactory.newSignedOrderAsync(customOrderParams);
        }

        /**
         * Joins the staking pool specified by the given ID.
         */
        public async joinStakingPoolAsync(poolId: string): Promise<TransactionReceiptWithDecodedLogs> {
            const stakingContract = this.actor.deployment.staking.stakingWrapper;
            this.poolId = poolId;
            return stakingContract.joinStakingPoolAsMaker.awaitTransactionSuccessAsync(poolId, {
                from: this.actor.address,
            });
        }
    };
}

export class Maker extends MakerMixin(Actor) {}
