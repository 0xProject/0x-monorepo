import { constants, OrderFactory } from '@0x/contracts-test-utils';
import { Order, SignedOrder } from '@0x/types';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { AssertionResult } from '../assertions/function_assertion';
import { validJoinStakingPoolAssertion } from '../assertions/joinStakingPool';

import { Actor, ActorConfig, Constructor } from './base';

interface MakerConfig extends ActorConfig {
    orderConfig: Partial<Order>;
}

export interface MakerInterface {
    makerPoolId?: string;
    orderFactory: OrderFactory;
    signOrderAsync: (customOrderParams?: Partial<Order>) => Promise<SignedOrder>;
    cancelOrderAsync: (order: SignedOrder) => Promise<TransactionReceiptWithDecodedLogs>;
    joinStakingPoolAsync: (poolId: string) => Promise<TransactionReceiptWithDecodedLogs>;
}

/**
 * This mixin encapsulates functionaltiy associated with makers within the 0x ecosystem.
 * This includes signing and canceling orders, as well as joining a staking pool as a maker.
 */
export function MakerMixin<TBase extends Constructor>(Base: TBase): TBase & Constructor<MakerInterface> {
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
            // tslint:disable-next-line:no-inferred-empty-object-type
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

            // Register this mixin's assertion generators
            this.actor.simulationActions = {
                ...this.actor.simulationActions,
                validJoinStakingPool: this._validJoinStakingPool(),
            };
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
            return this.actor.deployment.exchange.cancelOrder(order).awaitTransactionSuccessAsync({
                from: this.actor.address,
            });
        }

        /**
         * Joins the staking pool specified by the given ID.
         */
        public async joinStakingPoolAsync(poolId: string): Promise<TransactionReceiptWithDecodedLogs> {
            const stakingContract = this.actor.deployment.staking.stakingWrapper;
            this.makerPoolId = poolId;
            return stakingContract.joinStakingPoolAsMaker(poolId).awaitTransactionSuccessAsync({
                from: this.actor.address,
            });
        }

        private async *_validJoinStakingPool(): AsyncIterableIterator<AssertionResult | void> {
            const { stakingPools } = this.actor.simulationEnvironment!;
            const assertion = validJoinStakingPoolAssertion(this.actor.deployment);
            while (true) {
                const poolId = _.sample(Object.keys(stakingPools));
                if (poolId === undefined) {
                    yield undefined;
                } else {
                    yield assertion.executeAsync([poolId], { from: this.actor.address });
                }
            }
        }
    };
}

export class Maker extends MakerMixin(Actor) {}
