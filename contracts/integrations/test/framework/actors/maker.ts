import { DummyERC20TokenContract } from '@0x/contracts-erc20';
import { constants, OrderFactory } from '@0x/contracts-test-utils';
import { Order, SignedOrder } from '@0x/types';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { AssertionResult } from '../assertions/function_assertion';
import { validJoinStakingPoolAssertion } from '../assertions/joinStakingPool';
import { Pseudorandom } from '../utils/pseudorandom';

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
    createFillableOrderAsync: (taker: Actor) => Promise<SignedOrder>;
    createMatchableOrdersAsync(taker: Actor): Promise<[SignedOrder, SignedOrder]>;
}

/**
 * This mixin encapsulates functionality associated with makers within the 0x ecosystem.
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
            this.actor.mixins.push('Maker');

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

        public async createFillableOrderAsync(taker: Actor): Promise<SignedOrder> {
            const { actors, balanceStore } = this.actor.simulationEnvironment!;
            await balanceStore.updateErc20BalancesAsync();

            // Choose the assets for the order
            const [makerToken, makerFeeToken, takerToken, takerFeeToken] = Pseudorandom.sampleSize(
                this.actor.deployment.tokens.erc20,
                4, // tslint:disable-line:custom-no-magic-numbers
            );

            // Maker and taker set balances/allowances to guarantee that the fill succeeds.
            // Amounts are chosen to be within each actor's balance (divided by 8, in case
            // e.g. makerAsset = makerFeeAsset)
            const [makerAssetAmount, makerFee, takerAssetAmount, takerFee] = await Promise.all(
                [
                    [this.actor, makerToken],
                    [this.actor, makerFeeToken],
                    [taker, takerToken],
                    [taker, takerFeeToken],
                ].map(async ([owner, token]) => {
                    let balance = balanceStore.balances.erc20[owner.address][token.address];
                    await (owner as Actor).configureERC20TokenAsync(token as DummyERC20TokenContract);
                    balance = balanceStore.balances.erc20[owner.address][token.address] =
                        constants.INITIAL_ERC20_BALANCE;
                    return Pseudorandom.integer(0, balance.dividedToIntegerBy(2));
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
            return this.signOrderAsync({
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
        }

        public async createMatchableOrdersAsync(taker: Actor): Promise<[SignedOrder, SignedOrder]> {
            const { actors, balanceStore } = this.actor.simulationEnvironment!;
            await balanceStore.updateErc20BalancesAsync();

            // Choose the assets for the orders
            const [leftMakerToken, leftTakerToken, makerFeeToken, takerFeeToken] = Pseudorandom.sampleSize(
                this.actor.deployment.tokens.erc20,
                4, // tslint:disable-line:custom-no-magic-numbers
            );
            const rightMakerToken = leftTakerToken;
            const rightTakerToken = leftMakerToken;

            // Maker and taker set balances/allowances to guarantee that the fill succeeds.
            // Amounts are chosen to be within each actor's balance (divided by 2, in case
            // e.g. makerAsset = makerFeeAsset)
            const [leftMakerAssetAmount, makerFee, leftTakerAssetAmount, takerFee] = await Promise.all(
                [
                    [this.actor, leftMakerToken],
                    [this.actor, rightMakerToken],
                    [this.actor, makerFeeToken],
                    [taker, takerFeeToken],
                ].map(async ([owner, token]) => {
                    let balance = balanceStore.balances.erc20[owner.address][token.address];
                    await (owner as Actor).configureERC20TokenAsync(token as DummyERC20TokenContract);
                    balance = balanceStore.balances.erc20[owner.address][token.address] =
                        constants.INITIAL_ERC20_BALANCE;
                    return Pseudorandom.integer(0, balance.dividedToIntegerBy(8));
                }),
            );

            // Select random amounts for the right order. The only constraint is that the slope
            // of the left price curve is greater or equal to the inverse right price curve.
            //   leftMakerAssetAmount/leftTakerAssetAmount >= rightTakerAssetAmount/rightMakerAssetAmount.
            // We set the `rightMakerAssetAmount` equal to the `leftTakerAssetAmount` with probability 1/10,
            // otherwise this scenario will never occur.
            const shouldSetRightMakerEqualToLeftTakerAmount = Pseudorandom.integer(1, 10).eq(1);
            const rightMakerAssetAmount = shouldSetRightMakerEqualToLeftTakerAmount
                ? leftTakerAssetAmount
                : Pseudorandom.integer(1, constants.INITIAL_ERC20_BALANCE.dividedToIntegerBy(8));
            const rightTakerAssetAmount = Pseudorandom.integer(
                1,
                rightMakerAssetAmount.times(leftMakerAssetAmount).dividedToIntegerBy(leftTakerAssetAmount),
            );

            // Encode asset data
            const [
                leftMakerAssetData,
                leftTakerAssetData,
                rightMakerAssetData,
                rightTakerAssetData,
                makerFeeAssetData,
                takerFeeAssetData,
            ] = [leftMakerToken, leftTakerToken, rightMakerToken, rightTakerToken, makerFeeToken, takerFeeToken].map(
                token =>
                    this.actor.deployment.assetDataEncoder.ERC20Token(token.address).getABIEncodedTransactionData(),
            );

            // Construct and sign the left order
            const leftOrder = await this.signOrderAsync({
                makerAssetData: leftMakerAssetData,
                takerAssetData: leftTakerAssetData,
                makerFeeAssetData,
                takerFeeAssetData,
                makerAssetAmount: leftMakerAssetAmount,
                takerAssetAmount: leftTakerAssetAmount,
                makerFee,
                takerFee,
                feeRecipientAddress: Pseudorandom.sample(actors)!.address,
            });

            // Construct and sign the right order
            const rightOrder = await this.signOrderAsync({
                makerAssetData: rightMakerAssetData,
                takerAssetData: rightTakerAssetData,
                makerFeeAssetData,
                takerFeeAssetData,
                makerAssetAmount: rightMakerAssetAmount,
                takerAssetAmount: rightTakerAssetAmount,
                makerFee,
                takerFee,
                feeRecipientAddress: Pseudorandom.sample(actors)!.address,
            });

            return [leftOrder, rightOrder];
        }

        private async *_validJoinStakingPool(): AsyncIterableIterator<AssertionResult | void> {
            const { stakingPools } = this.actor.simulationEnvironment!;
            const assertion = validJoinStakingPoolAssertion(this.actor.deployment);
            while (true) {
                const poolId = Pseudorandom.sample(Object.keys(stakingPools));
                if (poolId === undefined) {
                    yield;
                } else {
                    this.makerPoolId = poolId;
                    yield assertion.executeAsync([poolId], { from: this.actor.address });
                }
            }
        }
    };
}

export class Maker extends MakerMixin(Actor) {}
