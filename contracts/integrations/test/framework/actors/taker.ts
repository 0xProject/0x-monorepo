import { constants, getRandomInteger } from '@0x/contracts-test-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { TransactionReceiptWithDecodedLogs, TxData } from 'ethereum-types';
import * as _ from 'lodash';

import { validFillOrderCompleteFillAssertion } from '../assertions/fillOrder';
import { AssertionResult } from '../assertions/function_assertion';
import { DeploymentManager } from '../deployment_manager';

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

            // Register this mixin's assertion generators
            this.actor.simulationActions = {
                ...this.actor.simulationActions,
                validFillOrderCompleteFill: this._validFillOrderCompleteFill(),
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

        private async *_validFillOrderCompleteFill(): AsyncIterableIterator<AssertionResult | void> {
            const { marketMakers } = this.actor.simulationEnvironment!;
            const assertion = validFillOrderCompleteFillAssertion(this.actor.deployment);
            while (true) {
                const maker = _.sample(marketMakers);
                if (maker === undefined) {
                    yield undefined;
                } else {
                    // Configure the maker's token balances so that the order will definitely be fillable.
                    await Promise.all([
                        ...this.actor.deployment.tokens.erc20.map(async token => maker.configureERC20TokenAsync(token)),
                        ...this.actor.deployment.tokens.erc20.map(async token =>
                            this.actor.configureERC20TokenAsync(token),
                        ),
                        this.actor.configureERC20TokenAsync(
                            this.actor.deployment.tokens.weth,
                            this.actor.deployment.staking.stakingProxy.address,
                        ),
                    ]);

                    const order = await maker.signOrderAsync({
                        makerAssetAmount: getRandomInteger(constants.ZERO_AMOUNT, constants.INITIAL_ERC20_BALANCE),
                        takerAssetAmount: getRandomInteger(constants.ZERO_AMOUNT, constants.INITIAL_ERC20_BALANCE),
                    });
                    yield assertion.executeAsync([order, order.takerAssetAmount, order.signature], {
                        from: this.actor.address,
                    });
                }
            }
        }
    };
}

export class Taker extends TakerMixin(Actor) {}
