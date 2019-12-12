import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs, TxData } from 'ethereum-types';

import { validFillOrderAssertion } from '../assertions/fillOrder';
import { AssertionResult } from '../assertions/function_assertion';
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
                    const fillAmount = Pseudorandom.integer(order.takerAssetAmount);
                    // Taker executes the fill with a random msg.value, so that sometimes the
                    // protocol fee is paid in ETH and other times it's paid in WETH.
                    yield assertion.executeAsync([order, fillAmount, order.signature], {
                        from: this.actor.address,
                        value: Pseudorandom.integer(DeploymentManager.protocolFee.times(2)),
                    });
                }
            }
        }
    };
}

export class Taker extends TakerMixin(Actor) {}
