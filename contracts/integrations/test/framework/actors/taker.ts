import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs, TxData } from 'ethereum-types';

import { validFillOrderAssertion } from '../assertions/fillOrder';
import { AssertionResult } from '../assertions/function_assertion';
import { validMatchOrdersAssertion } from '../assertions/matchOrders';
import { validMatchOrdersWithMaximalFillAssertion } from '../assertions/matchOrdersWithMaximalFill';
import { DeploymentManager } from '../deployment_manager';
import { Pseudorandom } from '../utils/pseudorandom';

import { Actor, Constructor } from './base';
import { Maker } from './maker';
import { filterActorsByRole } from './utils';

export interface TakerInterface {
    fillOrderAsync: (
        order: SignedOrder,
        fillAmount: BigNumber,
        txData?: Partial<TxData>,
    ) => Promise<TransactionReceiptWithDecodedLogs>;
}

/**
 * This mixin encapsulates functionality associated with takers within the 0x ecosystem.
 * As of writing, the only extra functionality provided is a utility wrapper around `fillOrder`,
 */
export function TakerMixin<TBase extends Constructor>(Base: TBase): TBase & Constructor<TakerInterface> {
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
            this.actor.mixins.push('Taker');

            // Register this mixin's assertion generators
            this.actor.simulationActions = {
                ...this.actor.simulationActions,
                validFillOrder: this._validFillOrder(),
                validMatchOrders: this._validMatchOrders(),
                validMatchOrdersWithMaximalFill: this._validMatchOrdersWithMaximalFill(),
            };
        }

        /**
         * Fills an order by the given `fillAmount`. Defaults to paying the protocol fee in ETH.
         */
        public async fillOrderAsync(
            order: SignedOrder,
            fillAmount: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<TransactionReceiptWithDecodedLogs> {
            return this.actor.deployment.exchange
                .fillOrder(order, fillAmount, order.signature)
                .awaitTransactionSuccessAsync({
                    from: this.actor.address,
                    gasPrice: DeploymentManager.gasPrice,
                    value: DeploymentManager.protocolFee,
                    ...txData,
                });
        }

        /**
         * Matches two orders using `matchOrders`. Defaults to paying the protocol fee in ETH.
         */
        public async matchOrdersAsync(
            leftOrder: SignedOrder,
            rightOrder: SignedOrder,
            txData: Partial<TxData> = {},
        ): Promise<TransactionReceiptWithDecodedLogs> {
            return this.actor.deployment.exchange
                .matchOrders(leftOrder, rightOrder, leftOrder.signature, rightOrder.signature)
                .awaitTransactionSuccessAsync({
                    from: this.actor.address,
                    gasPrice: DeploymentManager.gasPrice,
                    value: DeploymentManager.protocolFee,
                    ...txData,
                });
        }

        /**
         * Matches two orders using `matchOrdersWithMaximalFill`. Defaults to paying the protocol fee in ETH.
         */
        public async matchOrdersWithMaximalFillAsync(
            leftOrder: SignedOrder,
            rightOrder: SignedOrder,
            txData: Partial<TxData> = {},
        ): Promise<TransactionReceiptWithDecodedLogs> {
            return this.actor.deployment.exchange
                .matchOrdersWithMaximalFill(leftOrder, rightOrder, leftOrder.signature, rightOrder.signature)
                .awaitTransactionSuccessAsync({
                    from: this.actor.address,
                    gasPrice: DeploymentManager.gasPrice,
                    value: DeploymentManager.protocolFee,
                    ...txData,
                });
        }

        private async *_validFillOrder(): AsyncIterableIterator<AssertionResult | void> {
            const { actors } = this.actor.simulationEnvironment!;
            const assertion = validFillOrderAssertion(this.actor.deployment, this.actor.simulationEnvironment!);
            while (true) {
                // Choose a maker to be the other side of the order
                const maker = Pseudorandom.sample(filterActorsByRole(actors, Maker));
                if (maker === undefined) {
                    yield;
                } else {
                    // Maker creates and signs a fillable order
                    const order = await maker.createFillableOrderAsync(this.actor);
                    // Taker fills the order by a random amount (up to the order's takerAssetAmount)
                    const fillAmount = Pseudorandom.integer(0, order.takerAssetAmount);
                    // Taker executes the fill with a random msg.value, so that sometimes the
                    // protocol fee is paid in ETH and other times it's paid in WETH.
                    yield assertion.executeAsync([order, fillAmount, order.signature], {
                        from: this.actor.address,
                        value: Pseudorandom.integer(0, DeploymentManager.protocolFee.times(2)),
                    });
                }
            }
        }

        private async *_validMatchOrders(): AsyncIterableIterator<AssertionResult | void> {
            const { actors } = this.actor.simulationEnvironment!;
            const assertion = validMatchOrdersAssertion(this.actor.deployment, this.actor.simulationEnvironment!);
            while (true) {
                // Choose a maker to be the other side of the order
                const maker = Pseudorandom.sample(filterActorsByRole(actors, Maker));
                if (maker === undefined) {
                    yield;
                } else {
                    // Maker creates and signs matchable orders
                    const [leftOrder, rightOrder] = await maker.createMatchableOrdersAsync(this.actor);

                    // Taker executes the fill with a random msg.value, so that sometimes the
                    // protocol fee is paid in ETH and other times it's paid in WETH.
                    yield assertion.executeAsync([leftOrder, rightOrder, leftOrder.signature, rightOrder.signature], {
                        from: this.actor.address,
                        value: Pseudorandom.integer(0, DeploymentManager.protocolFee.times(2)),
                    });
                }
            }
        }

        private async *_validMatchOrdersWithMaximalFill(): AsyncIterableIterator<AssertionResult | void> {
            const { actors } = this.actor.simulationEnvironment!;
            const assertion = validMatchOrdersWithMaximalFillAssertion(
                this.actor.deployment,
                this.actor.simulationEnvironment!,
            );
            while (true) {
                // Choose a maker to be the other side of the order
                const maker = Pseudorandom.sample(filterActorsByRole(actors, Maker));
                if (maker === undefined) {
                    yield;
                } else {
                    // Maker creates and signs matchable orders
                    const [leftOrder, rightOrder] = await maker.createMatchableOrdersAsync(this.actor);

                    // Taker executes the fill with a random msg.value, so that sometimes the
                    // protocol fee is paid in ETH and other times it's paid in WETH.
                    yield assertion.executeAsync([leftOrder, rightOrder, leftOrder.signature, rightOrder.signature], {
                        from: this.actor.address,
                        value: Pseudorandom.integer(0, DeploymentManager.protocolFee.times(2)),
                    });
                }
            }
        }
    };
}

export class Taker extends TakerMixin(Actor) {}
