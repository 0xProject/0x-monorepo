import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs, TxData } from 'ethereum-types';

import { DeploymentManager } from '../../src/deployment_manager';

import { Actor, Constructor } from './base';

export interface TakerInterface {
    fillOrderAsync: (
        order: SignedOrder,
        fillAmount: BigNumber,
        txData?: Partial<TxData>,
    ) => Promise<TransactionReceiptWithDecodedLogs>;
}

/**
 * This mixin encapsulates functionaltiy associated with takers within the 0x ecosystem.
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
        }

        /**
         * Fills an order by the given `fillAmount`. Defaults to paying the protocol fee in ETH.
         */
        public async fillOrderAsync(
            order: SignedOrder,
            fillAmount: BigNumber,
            txData: Partial<TxData> = {},
        ): Promise<TransactionReceiptWithDecodedLogs> {
            return this.actor.deployment.exchange.fillOrder.awaitTransactionSuccessAsync(
                order,
                fillAmount,
                order.signature,
                {
                    from: this.actor.address,
                    gasPrice: DeploymentManager.gasPrice,
                    value: DeploymentManager.protocolFee,
                    ...txData,
                },
            );
        }
    };
}

export class Taker extends TakerMixin(Actor) {}
