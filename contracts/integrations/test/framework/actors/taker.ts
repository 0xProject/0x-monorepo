import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { constants } from '@0x/contracts-test-utils';
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
            const { actors, balanceStore } = this.actor.simulationEnvironment!;
            const assertion = validFillOrderAssertion(this.actor.deployment, this.actor.simulationEnvironment!);
            while (true) {
                // Choose a maker to be the other side of the order
                const maker = Pseudorandom.sample(filterActorsByRole(actors, Maker));
                if (maker === undefined) {
                    yield;
                } else {
                    await balanceStore.updateErc20BalancesAsync();
                    // Choose the assets for the order
                    const [makerToken, makerFeeToken, takerToken, takerFeeToken] = Pseudorandom.sampleSize(
                        this.actor.deployment.tokens.erc20,
                        4, // tslint:disable-line:custom-no-magic-numbers
                    );

                    // Maker and taker set balances/allowances to guarantee that the fill succeeds.
                    // Amounts are chosen to be within each actor's balance (divided by 2, in case
                    // e.g. makerAsset = makerFeeAsset)
                    const [makerAssetAmount, makerFee, takerAssetAmount, takerFee] = await Promise.all(
                        [
                            [maker, makerToken],
                            [maker, makerFeeToken],
                            [this.actor, takerToken],
                            [this.actor, takerFeeToken],
                        ].map(async ([owner, token]) => {
                            let balance = balanceStore.balances.erc20[owner.address][token.address];
                            await (owner as Actor).configureERC20TokenAsync(token as DummyERC20TokenContract);
                            balance = balanceStore.balances.erc20[owner.address][token.address] =
                                constants.INITIAL_ERC20_BALANCE;
                            return Pseudorandom.integer(balance.dividedToIntegerBy(2));
                        }),
                    );
                    // Encode asset data
                    const [makerAssetData, makerFeeAssetData, takerAssetData, takerFeeAssetData] = [
                        makerToken,
                        makerFeeToken,
                        takerToken,
                        takerFeeToken,
                    ].map(token =>
                        this.actor.deployment.assetDataEncoder.ERC20Token(token.address).getABIEncodedTransactionData(),
                    );

                    // Maker signs the order
                    const order = await maker.signOrderAsync({
                        makerAssetData,
                        takerAssetData,
                        makerFeeAssetData,
                        takerFeeAssetData,
                        makerAssetAmount,
                        takerAssetAmount,
                        makerFee,
                        takerFee,
                        feeRecipientAddress: Pseudorandom.sample(actors)!.address,
                    });

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
