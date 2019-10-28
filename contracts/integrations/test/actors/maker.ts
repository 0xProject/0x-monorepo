import { constants, OrderFactory, orderUtils } from '@0x/contracts-test-utils';
import { Order, SignedOrder } from '@0x/types';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { Actor, ActorConfig, Constructor } from './base';

export interface MakerConfig extends ActorConfig {
    orderConfig: Partial<Order>;
}

export function MakerMixin<TBase extends Constructor>(Base: TBase) {
    return class extends Base {
        public makerPoolId?: string;
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
            this.orderFactory = new OrderFactory(this.actor.privateKey, defaultOrderParams);
        }

        /**
         * Signs an order (optionally, with custom parameters) as the maker.
         */
        public async signOrderAsync(customOrderParams: Partial<Order> = {}): Promise<SignedOrder> {
            return this.orderFactory.newSignedOrderAsync(customOrderParams);
        }

        /**
         * Cancels one of the maker's orders.
         */
        public async cancelOrderAsync(order: SignedOrder): Promise<TransactionReceiptWithDecodedLogs> {
            const params = orderUtils.createCancel(order);
            return this.actor.deployment.exchange.cancelOrder.awaitTransactionSuccessAsync(params.order, {
                from: this.actor.address,
            });
        }

        /**
         * Joins the staking pool specified by the given ID.
         */
        public async joinStakingPoolAsync(poolId: string): Promise<TransactionReceiptWithDecodedLogs> {
            const stakingContract = this.actor.deployment.staking.stakingWrapper;
            this.makerPoolId = poolId;
            return stakingContract.joinStakingPoolAsMaker.awaitTransactionSuccessAsync(poolId, {
                from: this.actor.address,
            });
        }
    };
}

export class Maker extends MakerMixin(Actor) {}
