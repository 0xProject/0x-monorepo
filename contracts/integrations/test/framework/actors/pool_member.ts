import { constants, getRandomInteger } from '@0x/contracts-test-utils';
import { TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { validFillOrderCompleteFillAssertion } from '../assertions/fillOrder';
import { AssertionResult } from '../assertions/function_assertion';
import { validJoinStakingPoolAssertion } from '../assertions/joinStakingPool';

import { Actor, Constructor } from './base';

interface PoolMemberInterface {
    joinStakingPoolAsync: (poolId: string) => Promise<TransactionReceiptWithDecodedLogs>;
}

/**
 * This mixin encapsulates functionaltiy associated with pool operators within the 0x ecosystem.
 * This includes creating staking pools and decreasing the operator share of a pool.
 */
export function PoolMemberMixin<TBase extends Constructor>(Base: TBase): TBase & Constructor<PoolMemberInterface> {
    return class extends Base {
        public readonly actor: Actor;

        /**
         * The mixin pattern requires that this constructor uses `...args: any[]`, but this class
         * really expects a single `ActorConfig` parameter (assuming `Actor` is used as the
         * base class).
         */
        constructor(...args: any[]) {
            // tslint:disable-next-line:no-inferred-empty-object-type
            super(...args);
            this.actor = (this as any) as Actor;

            // Register this mixin's assertion generators
            this.actor.simulationActions = {
                ...this.actor.simulationActions,
                validJoinStakingPool: this._validJoinStakingPool(),
                validFillOrderCompleteFill: this._validFillOrderCompleteFill(),
            };
        }

        /**
         * Joins a new staking pool.
         */
        public async joinStakingPoolAsync(poolId: string): Promise<TransactionReceiptWithDecodedLogs> {
            const stakingContract = this.actor.deployment.staking.stakingWrapper;
            return stakingContract
                .joinStakingPoolAsMaker(poolId)
                .awaitTransactionSuccessAsync({ from: this.actor.address });
        }

        private async *_validJoinStakingPool(): AsyncIterableIterator<AssertionResult | void> {
            const { stakingPools } = this.actor.simulationEnvironment!;
            const assertion = validJoinStakingPoolAssertion(this.actor.deployment);
            while (true) {
                const poolId = _.sample(Object.keys(stakingPools));
                if (poolId === undefined) {
                    yield undefined;
                } else {
                    yield assertion.executeAsync({ args: [poolId], txData: { from: this.actor.address } });
                }
            }
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
                    yield assertion.executeAsync({
                        args: [order, order.takerAssetAmount, order.signature],
                        txData: { from: this.actor.address },
                    });
                }
            }
        }
    };
}

export class PoolMember extends PoolMemberMixin(Actor) {}
