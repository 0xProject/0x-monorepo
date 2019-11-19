import { BlockchainTestsEnvironment, constants, expect, orderHashUtils, OrderStatus } from '@0x/contracts-test-utils';
import { BatchMatchedFillResults, FillResults, MatchedFillResults, Order, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { LogWithDecodedArgs, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { Maker } from '../framework/actors/maker';
import { BlockchainBalanceStore } from '../framework/balances/blockchain_balance_store';
import { LocalBalanceStore } from '../framework/balances/local_balance_store';
import { DeploymentManager } from '../framework/deployment_manager';

export interface FillEventArgs {
    orderHash: string;
    makerAddress: string;
    takerAddress: string;
    makerAssetFilledAmount: BigNumber;
    takerAssetFilledAmount: BigNumber;
    makerFeePaid: BigNumber;
    takerFeePaid: BigNumber;
    protocolFeePaid: BigNumber;
}

export interface MatchTransferAmounts {
    // Assets being traded.
    leftMakerAssetSoldByLeftMakerAmount: BigNumber; // leftMakerAssetBoughtByRightMakerAmount if omitted.
    rightMakerAssetSoldByRightMakerAmount: BigNumber; // rightMakerAssetBoughtByLeftMakerAmount if omitted.
    rightMakerAssetBoughtByLeftMakerAmount: BigNumber; // rightMakerAssetSoldByRightMakerAmount if omitted.
    leftMakerAssetBoughtByRightMakerAmount: BigNumber; // leftMakerAssetSoldByLeftMakerAmount if omitted.
    // Taker profit.
    leftMakerAssetReceivedByTakerAmount: BigNumber; // 0 if omitted.
    rightMakerAssetReceivedByTakerAmount: BigNumber; // 0 if omitted.
    // Maker fees.
    leftMakerFeeAssetPaidByLeftMakerAmount: BigNumber; // 0 if omitted.
    rightMakerFeeAssetPaidByRightMakerAmount: BigNumber; // 0 if omitted.
    // Taker fees.
    leftTakerFeeAssetPaidByTakerAmount: BigNumber; // 0 if omitted.
    rightTakerFeeAssetPaidByTakerAmount: BigNumber; // 0 if omitted.
    // Protocol fees.
    leftProtocolFeePaidByTakerInEthAmount: BigNumber; // 0 if omitted
    leftProtocolFeePaidByTakerInWethAmount: BigNumber; // 0 if omitted
    rightProtocolFeePaidByTakerInWethAmount: BigNumber; // 0 if omitted
    rightProtocolFeePaidByTakerInEthAmount: BigNumber; // 0 if omitted
}

export interface MatchResults {
    orders: MatchedOrders;
    fills: FillEventArgs[];
}

export interface BatchMatchResults {
    matches: MatchResults[];
    filledAmounts: Array<[SignedOrder, BigNumber, string]>;
    leftFilledResults: FillEventArgs[];
    rightFilledResults: FillEventArgs[];
}

export interface BatchMatchedOrders {
    leftOrders: SignedOrder[];
    rightOrders: SignedOrder[];
    leftOrdersTakerAssetFilledAmounts: BigNumber[];
    rightOrdersTakerAssetFilledAmounts: BigNumber[];
}

export interface MatchedOrders {
    leftOrder: SignedOrder;
    rightOrder: SignedOrder;
    leftOrderTakerAssetFilledAmount?: BigNumber;
    rightOrderTakerAssetFilledAmount?: BigNumber;
}

export interface TestMatchOrdersArgs {
    env: BlockchainTestsEnvironment;
    matchOrderTester: MatchOrderTester;
    leftOrder: Partial<Order>;
    rightOrder: Partial<Order>;
    makerLeft: Maker;
    makerRight: Maker;
    expectedTransferAmounts: Partial<MatchTransferAmounts>;
    withMaximalFill: boolean;
    matcherAddress: string;
}

/**
 * Tests an order matching scenario with both eth and weth protocol fees.
 */
export async function testMatchOrdersAsync(args: TestMatchOrdersArgs): Promise<void> {
    // Create orders to match.
    const signedOrderLeft = await args.makerLeft.signOrderAsync(args.leftOrder);
    const signedOrderRight = await args.makerRight.signOrderAsync(args.rightOrder);

    await args.matchOrderTester.matchOrdersAndAssertEffectsAsync(
        {
            leftOrder: signedOrderLeft,
            rightOrder: signedOrderRight,
        },
        {
            ...args.expectedTransferAmounts,
            leftProtocolFeePaidByTakerInEthAmount: DeploymentManager.protocolFee,
            rightProtocolFeePaidByTakerInEthAmount: DeploymentManager.protocolFee,
            leftProtocolFeePaidByTakerInWethAmount: constants.ZERO_AMOUNT,
            rightProtocolFeePaidByTakerInWethAmount: constants.ZERO_AMOUNT,
        },
        args.matcherAddress,
        DeploymentManager.protocolFee.times(2),
        args.withMaximalFill,
    );

    await args.env.blockchainLifecycle.revertAsync();
    await args.env.blockchainLifecycle.startAsync();

    await args.matchOrderTester.matchOrdersAndAssertEffectsAsync(
        {
            leftOrder: signedOrderLeft,
            rightOrder: signedOrderRight,
        },
        {
            ...args.expectedTransferAmounts,
            leftProtocolFeePaidByTakerInEthAmount: constants.ZERO_AMOUNT,
            rightProtocolFeePaidByTakerInEthAmount: constants.ZERO_AMOUNT,
            leftProtocolFeePaidByTakerInWethAmount: DeploymentManager.protocolFee,
            rightProtocolFeePaidByTakerInWethAmount: DeploymentManager.protocolFee,
        },
        args.matcherAddress,
        constants.ZERO_AMOUNT,
        args.withMaximalFill,
    );
}

export class MatchOrderTester {
    /**
     * Constructs new MatchOrderTester.
     */
    constructor(
        protected readonly _deployment: DeploymentManager,
        protected readonly _blockchainBalanceStore: BlockchainBalanceStore,
    ) {}

    /**
     * Performs batch order matching on a set of complementary orders and asserts results.
     * @param orders The list of orders and filled states
     * @param takerAddress Address of taker (the address who matched the two orders)
     * @param value The amount of value that should be sent in the contract call.
     * @param matchPairs An array of left and right indices that will be used to perform
     *                   the expected simulation.
     * @param expectedTransferAmounts Expected amounts transferred as a result of each round of
     *                                order matching. Omitted fields are either set to 0 or their
     *                                complementary field.
     * @param withMaximalFill A boolean that indicates whether the "maximal fill" order matching
     *                        strategy should be used.
     * @return Results of `batchMatchOrders()`.
     */
    public async batchMatchOrdersAndAssertEffectsAsync(
        orders: BatchMatchedOrders,
        takerAddress: string,
        value: BigNumber,
        matchPairs: Array<[number, number]>,
        expectedTransferAmounts: Array<Partial<MatchTransferAmounts>>,
        withMaximalFill: boolean,
    ): Promise<BatchMatchResults> {
        // Ensure that the provided input is valid.
        expect(matchPairs.length).to.be.eq(expectedTransferAmounts.length);
        expect(orders.leftOrders.length).to.be.eq(orders.leftOrdersTakerAssetFilledAmounts.length);
        expect(orders.rightOrders.length).to.be.eq(orders.rightOrdersTakerAssetFilledAmounts.length);

        // Ensure that the exchange is in the expected state.
        await this._assertBatchOrderStatesAsync(orders);

        // Update the blockchain balance store and create a new local balance store
        // with the same initial balances.
        await this._blockchainBalanceStore.updateBalancesAsync();
        const localBalanceStore = LocalBalanceStore.create(this._deployment.devUtils, this._blockchainBalanceStore);

        // Execute `batchMatchOrders()`
        let actualBatchMatchResults;
        let transactionReceipt;
        if (withMaximalFill) {
            const tx = this._deployment.exchange.batchMatchOrdersWithMaximalFill(
                orders.leftOrders,
                orders.rightOrders,
                orders.leftOrders.map(order => order.signature),
                orders.rightOrders.map(order => order.signature),
            );
            actualBatchMatchResults = await tx.callAsync({
                from: takerAddress,
                gasPrice: DeploymentManager.gasPrice,
                value,
            });
            transactionReceipt = await tx.awaitTransactionSuccessAsync({
                from: takerAddress,
                gasPrice: DeploymentManager.gasPrice,
                value,
            });
        } else {
            const tx = this._deployment.exchange.batchMatchOrders(
                orders.leftOrders,
                orders.rightOrders,
                orders.leftOrders.map(order => order.signature),
                orders.rightOrders.map(order => order.signature),
            );
            actualBatchMatchResults = await tx.callAsync({
                from: takerAddress,
                gasPrice: DeploymentManager.gasPrice,
                value,
            });
            transactionReceipt = await tx.awaitTransactionSuccessAsync({
                from: takerAddress,
                gasPrice: DeploymentManager.gasPrice,
                value,
            });
        }

        // Burn the gas used to execute the transaction in the local balance store.
        localBalanceStore.burnGas(takerAddress, DeploymentManager.gasPrice.times(transactionReceipt.gasUsed));

        // Simulate the batch order match.
        const expectedBatchMatchResults = await this._simulateBatchMatchOrdersAsync(
            orders,
            takerAddress,
            matchPairs,
            expectedTransferAmounts,
            localBalanceStore,
        );

        const expectedResults = convertToBatchMatchResults(expectedBatchMatchResults);
        expect(actualBatchMatchResults).to.be.eql(expectedResults);

        // Validate the simulation against reality.
        await this._assertBatchMatchResultsAsync(expectedBatchMatchResults, transactionReceipt, localBalanceStore);
        return expectedBatchMatchResults;
    }

    /**
     * Matches two complementary orders and asserts results.
     * @param orders The matched orders and filled states.
     * @param expectedTransferAmounts Expected amounts transferred as a result of order matching.
     *                                Omitted fields are either set to 0 or their complementary
     *                                field.
     * @param takerAddress Address of taker (the address who matched the two orders)
     * @param value The amount of value that should be sent in the contract call.
     * @param withMaximalFill A boolean that indicates whether the "maximal fill" order matching
     *                        strategy should be used.
     * @return Results of `matchOrders()`.
     */
    public async matchOrdersAndAssertEffectsAsync(
        orders: MatchedOrders,
        expectedTransferAmounts: Partial<MatchTransferAmounts>,
        takerAddress: string,
        value: BigNumber,
        withMaximalFill: boolean,
    ): Promise<MatchResults> {
        await this._assertInitialOrderStatesAsync(orders);

        // Update the blockchain balance store and create a new local balance store
        // with the same initial balances.
        await this._blockchainBalanceStore.updateBalancesAsync();
        const localBalanceStore = LocalBalanceStore.create(this._deployment.devUtils, this._blockchainBalanceStore);

        // Execute `matchOrders()`
        let actualMatchResults;
        let transactionReceipt;
        if (withMaximalFill) {
            const tx = this._deployment.exchange.matchOrdersWithMaximalFill(
                orders.leftOrder,
                orders.rightOrder,
                orders.leftOrder.signature,
                orders.rightOrder.signature,
            );
            actualMatchResults = await tx.callAsync({
                from: takerAddress,
                gasPrice: DeploymentManager.gasPrice,
                value,
            });
            transactionReceipt = await tx.awaitTransactionSuccessAsync({
                from: takerAddress,
                gasPrice: DeploymentManager.gasPrice,
                value,
            });
        } else {
            const tx = this._deployment.exchange.matchOrders(
                orders.leftOrder,
                orders.rightOrder,
                orders.leftOrder.signature,
                orders.rightOrder.signature,
            );
            actualMatchResults = await tx.callAsync({
                from: takerAddress,
                gasPrice: DeploymentManager.gasPrice,
                value,
            });
            transactionReceipt = await tx.awaitTransactionSuccessAsync({
                from: takerAddress,
                gasPrice: DeploymentManager.gasPrice,
                value,
            });
        }
        localBalanceStore.burnGas(takerAddress, DeploymentManager.gasPrice.times(transactionReceipt.gasUsed));

        // Simulate the fill.
        const expectedMatchResults = await this._simulateMatchOrdersAsync(
            orders,
            takerAddress,
            toFullMatchTransferAmounts(expectedTransferAmounts),
            localBalanceStore,
        );
        const expectedResults = convertToMatchResults(expectedMatchResults);
        expect(actualMatchResults).to.be.eql(expectedResults);

        // Validate the simulation against reality.
        await this._assertMatchResultsAsync(expectedMatchResults, transactionReceipt, localBalanceStore);
        return expectedMatchResults;
    }

    /**
     * Simulates matching two orders by transferring amounts defined in
     * `transferAmounts` and returns the results.
     * @param orders The orders being matched and their filled states.
     * @param takerAddress Address of taker (the address who matched the two orders)
     * @param transferAmounts Amounts to transfer during the simulation.
     * @param localBalanceStore The balance store to use for the simulation.
     * @return The new account balances and fill events that occurred during the match.
     */
    protected async _simulateMatchOrdersAsync(
        orders: MatchedOrders,
        takerAddress: string,
        transferAmounts: MatchTransferAmounts,
        localBalanceStore: LocalBalanceStore,
    ): Promise<MatchResults> {
        // prettier-ignore
        const matchResults = {
        orders: {
            leftOrder: orders.leftOrder,
            leftOrderTakerAssetFilledAmount:
                (orders.leftOrderTakerAssetFilledAmount || constants.ZERO_AMOUNT).plus(
                    transferAmounts.rightMakerAssetBoughtByLeftMakerAmount,
                ),
            rightOrder: orders.rightOrder,
            rightOrderTakerAssetFilledAmount:
                (orders.rightOrderTakerAssetFilledAmount || constants.ZERO_AMOUNT).plus(
                    transferAmounts.leftMakerAssetBoughtByRightMakerAmount,
                ),
        },
        fills: simulateFillEvents(orders, takerAddress, transferAmounts),
    };

        // Right maker asset -> left maker
        await localBalanceStore.transferAssetAsync(
            orders.rightOrder.makerAddress,
            orders.leftOrder.makerAddress,
            transferAmounts.rightMakerAssetBoughtByLeftMakerAmount,
            orders.rightOrder.makerAssetData,
        );

        if (orders.leftOrder.makerAddress !== orders.leftOrder.feeRecipientAddress) {
            // Left maker fees
            await localBalanceStore.transferAssetAsync(
                orders.leftOrder.makerAddress,
                orders.leftOrder.feeRecipientAddress,
                transferAmounts.leftMakerFeeAssetPaidByLeftMakerAmount,
                orders.leftOrder.makerFeeAssetData,
            );
        }

        // Left maker asset -> right maker
        await localBalanceStore.transferAssetAsync(
            orders.leftOrder.makerAddress,
            orders.rightOrder.makerAddress,
            transferAmounts.leftMakerAssetBoughtByRightMakerAmount,
            orders.leftOrder.makerAssetData,
        );

        if (orders.rightOrder.makerAddress !== orders.rightOrder.feeRecipientAddress) {
            // Right maker fees
            await localBalanceStore.transferAssetAsync(
                orders.rightOrder.makerAddress,
                orders.rightOrder.feeRecipientAddress,
                transferAmounts.rightMakerFeeAssetPaidByRightMakerAmount,
                orders.rightOrder.makerFeeAssetData,
            );
        }

        // Left taker profit
        await localBalanceStore.transferAssetAsync(
            orders.leftOrder.makerAddress,
            takerAddress,
            transferAmounts.leftMakerAssetReceivedByTakerAmount,
            orders.leftOrder.makerAssetData,
        );

        // Right taker profit
        await localBalanceStore.transferAssetAsync(
            orders.rightOrder.makerAddress,
            takerAddress,
            transferAmounts.rightMakerAssetReceivedByTakerAmount,
            orders.rightOrder.makerAssetData,
        );

        // Left taker fees
        await localBalanceStore.transferAssetAsync(
            takerAddress,
            orders.leftOrder.feeRecipientAddress,
            transferAmounts.leftTakerFeeAssetPaidByTakerAmount,
            orders.leftOrder.takerFeeAssetData,
        );

        // Right taker fees
        await localBalanceStore.transferAssetAsync(
            takerAddress,
            orders.rightOrder.feeRecipientAddress,
            transferAmounts.rightTakerFeeAssetPaidByTakerAmount,
            orders.rightOrder.takerFeeAssetData,
        );

        // Protocol Fee
        const wethAssetData = this._deployment.assetDataEncoder
            .ERC20Token(this._deployment.tokens.weth.address)
            .getABIEncodedTransactionData();
        localBalanceStore.sendEth(
            takerAddress,
            this._deployment.staking.stakingProxy.address,
            transferAmounts.leftProtocolFeePaidByTakerInEthAmount,
        );
        localBalanceStore.sendEth(
            takerAddress,
            this._deployment.staking.stakingProxy.address,
            transferAmounts.rightProtocolFeePaidByTakerInEthAmount,
        );
        await localBalanceStore.transferAssetAsync(
            takerAddress,
            this._deployment.staking.stakingProxy.address,
            transferAmounts.leftProtocolFeePaidByTakerInWethAmount,
            wethAssetData,
        );
        await localBalanceStore.transferAssetAsync(
            takerAddress,
            this._deployment.staking.stakingProxy.address,
            transferAmounts.rightProtocolFeePaidByTakerInWethAmount,
            wethAssetData,
        );

        return matchResults;
    }

    /**
     * Simulates matching a batch of orders by transferring amounts defined in
     * `transferAmounts` and returns the results.
     * @param orders The orders being batch matched and their filled states.
     * @param takerAddress Address of taker (the address who matched the two orders)
     * @param matchPairs The pairs of orders that are expected to be matched.
     * @param transferAmounts Amounts to transfer during the simulation.
     * @param localBalanceStore The balance store to use for the simulation.
     * @return The new account balances and fill events that occurred during the match.
     */
    protected async _simulateBatchMatchOrdersAsync(
        orders: BatchMatchedOrders,
        takerAddress: string,
        matchPairs: Array<[number, number]>,
        transferAmounts: Array<Partial<MatchTransferAmounts>>,
        localBalanceStore: LocalBalanceStore,
    ): Promise<BatchMatchResults> {
        // Initialize variables
        let leftIdx = 0;
        let rightIdx = 0;
        let lastLeftIdx = -1;
        let lastRightIdx = -1;
        let matchedOrders: MatchedOrders;
        const batchMatchResults: BatchMatchResults = {
            matches: [],
            filledAmounts: [],
            leftFilledResults: [],
            rightFilledResults: [],
        };

        // Loop over all of the matched pairs from the round
        for (let i = 0; i < matchPairs.length; i++) {
            leftIdx = matchPairs[i][0];
            rightIdx = matchPairs[i][1];

            // Construct a matched order out of the current left and right orders
            matchedOrders = {
                leftOrder: orders.leftOrders[leftIdx],
                rightOrder: orders.rightOrders[rightIdx],
                leftOrderTakerAssetFilledAmount: orders.leftOrdersTakerAssetFilledAmounts[leftIdx],
                rightOrderTakerAssetFilledAmount: orders.rightOrdersTakerAssetFilledAmounts[rightIdx],
            };

            // If there has been a match recorded and one or both of the side indices have not changed,
            // replace the side's taker asset filled amount
            if (batchMatchResults.matches.length > 0) {
                if (lastLeftIdx === leftIdx) {
                    matchedOrders.leftOrderTakerAssetFilledAmount = getLastMatch(
                        batchMatchResults,
                    ).orders.leftOrderTakerAssetFilledAmount;
                } else {
                    batchMatchResults.filledAmounts.push([
                        orders.leftOrders[lastLeftIdx],
                        getLastMatch(batchMatchResults).orders.leftOrderTakerAssetFilledAmount || constants.ZERO_AMOUNT,
                        'left',
                    ]);
                }
                if (lastRightIdx === rightIdx) {
                    matchedOrders.rightOrderTakerAssetFilledAmount = getLastMatch(
                        batchMatchResults,
                    ).orders.rightOrderTakerAssetFilledAmount;
                } else {
                    batchMatchResults.filledAmounts.push([
                        orders.rightOrders[lastRightIdx],
                        getLastMatch(batchMatchResults).orders.rightOrderTakerAssetFilledAmount ||
                            constants.ZERO_AMOUNT,
                        'right',
                    ]);
                }
            }

            // Add the latest match to the batch match results
            batchMatchResults.matches.push(
                await this._simulateMatchOrdersAsync(
                    matchedOrders,
                    takerAddress,
                    toFullMatchTransferAmounts(transferAmounts[i]),
                    localBalanceStore,
                ),
            );

            // Update the left and right fill results
            if (lastLeftIdx === leftIdx) {
                addFillResults(batchMatchResults.leftFilledResults[leftIdx], getLastMatch(batchMatchResults).fills[0]);
            } else {
                batchMatchResults.leftFilledResults.push({ ...getLastMatch(batchMatchResults).fills[0] });
            }
            if (lastRightIdx === rightIdx) {
                addFillResults(
                    batchMatchResults.rightFilledResults[rightIdx],
                    getLastMatch(batchMatchResults).fills[1],
                );
            } else {
                batchMatchResults.rightFilledResults.push({ ...getLastMatch(batchMatchResults).fills[1] });
            }

            lastLeftIdx = leftIdx;
            lastRightIdx = rightIdx;
        }

        for (let i = leftIdx + 1; i < orders.leftOrders.length; i++) {
            batchMatchResults.leftFilledResults.push(emptyFillEventArgs());
        }

        for (let i = rightIdx + 1; i < orders.rightOrders.length; i++) {
            batchMatchResults.rightFilledResults.push(emptyFillEventArgs());
        }

        // The two orders indexed by lastLeftIdx and lastRightIdx were potentially
        // filled; however, the TakerAssetFilledAmounts that pertain to these orders
        // will not have been added to batchMatchResults, so we need to write them
        // here.
        batchMatchResults.filledAmounts.push([
            orders.leftOrders[lastLeftIdx],
            getLastMatch(batchMatchResults).orders.leftOrderTakerAssetFilledAmount || constants.ZERO_AMOUNT,
            'left',
        ]);
        batchMatchResults.filledAmounts.push([
            orders.rightOrders[lastRightIdx],
            getLastMatch(batchMatchResults).orders.rightOrderTakerAssetFilledAmount || constants.ZERO_AMOUNT,
            'right',
        ]);

        // Return the batch match results
        return batchMatchResults;
    }
    /**
     * Checks that the results of `simulateBatchMatchOrders()` agrees with reality.
     * @param batchMatchResults The results of a `simulateBatchMatchOrders()`.
     * @param transactionReceipt The transaction receipt of a call to `matchOrders()`.
     * @param localBalanceStore The balance store to use during the simulation.
     */
    protected async _assertBatchMatchResultsAsync(
        batchMatchResults: BatchMatchResults,
        transactionReceipt: TransactionReceiptWithDecodedLogs,
        localBalanceStore: LocalBalanceStore,
    ): Promise<void> {
        // Ensure that the batchMatchResults contain at least one match
        expect(batchMatchResults.matches.length).to.be.gt(0);

        // Check the fill events.
        assertFillEvents(
            batchMatchResults.matches.map(match => match.fills).reduce((total, fills) => total.concat(fills)),
            transactionReceipt,
        );

        // Update the blockchain balance store balances.
        await this._blockchainBalanceStore.updateBalancesAsync();

        // Ensure that the actual and expected token balances are equivalent.
        localBalanceStore.assertEquals(this._blockchainBalanceStore);

        // Check the Exchange state.
        await this._assertPostBatchExchangeStateAsync(batchMatchResults);
    }

    /**
     * Checks that the results of `simulateMatchOrders()` agrees with reality.
     * @param matchResults The results of a `simulateMatchOrders()`.
     * @param transactionReceipt The transaction receipt of a call to `matchOrders()`.
     * @param localBalanceStore The balance store to use during the simulation.
     */
    protected async _assertMatchResultsAsync(
        matchResults: MatchResults,
        transactionReceipt: TransactionReceiptWithDecodedLogs,
        localBalanceStore: LocalBalanceStore,
    ): Promise<void> {
        // Check the fill events.
        assertFillEvents(matchResults.fills, transactionReceipt);

        // Update the blockchain balance store balances.
        await this._blockchainBalanceStore.updateBalancesAsync();

        // Check the token balances.
        localBalanceStore.assertEquals(this._blockchainBalanceStore);

        // Check the Exchange state.
        await this._assertPostExchangeStateAsync(matchResults);
    }

    /**
     * Asserts the initial exchange state for batch matched orders.
     * @param orders Batch matched orders with intial filled amounts.
     */
    private async _assertBatchOrderStatesAsync(orders: BatchMatchedOrders): Promise<void> {
        for (let i = 0; i < orders.leftOrders.length; i++) {
            await this._assertOrderFilledAmountAsync(
                orders.leftOrders[i],
                orders.leftOrdersTakerAssetFilledAmounts[i],
                'left',
            );
        }
        for (let i = 0; i < orders.rightOrders.length; i++) {
            await this._assertOrderFilledAmountAsync(
                orders.rightOrders[i],
                orders.rightOrdersTakerAssetFilledAmounts[i],
                'right',
            );
        }
    }

    /**
     * Asserts the initial exchange state for matched orders.
     * @param orders Matched orders with intial filled amounts.
     */
    private async _assertInitialOrderStatesAsync(orders: MatchedOrders): Promise<void> {
        const pairs = [
            [orders.leftOrder, orders.leftOrderTakerAssetFilledAmount || constants.ZERO_AMOUNT],
            [orders.rightOrder, orders.rightOrderTakerAssetFilledAmount || constants.ZERO_AMOUNT],
        ] as Array<[SignedOrder, BigNumber]>;
        await Promise.all(
            pairs.map(async ([order, expectedFilledAmount]) => {
                const side = order === orders.leftOrder ? 'left' : 'right';
                await this._assertOrderFilledAmountAsync(order, expectedFilledAmount, side);
            }),
        );
    }

    /**
     * Asserts the exchange state after a call to `batchMatchOrders()`.
     * @param batchMatchResults Results from a call to `simulateBatchMatchOrders()`.
     */
    private async _assertPostBatchExchangeStateAsync(batchMatchResults: BatchMatchResults): Promise<void> {
        await this._assertTriplesExchangeStateAsync(batchMatchResults.filledAmounts);
    }

    /**
     * Asserts the exchange state after a call to `matchOrders()`.
     * @param matchResults Results from a call to `simulateMatchOrders()`.
     */
    private async _assertPostExchangeStateAsync(matchResults: MatchResults): Promise<void> {
        const triples = [
            [matchResults.orders.leftOrder, matchResults.orders.leftOrderTakerAssetFilledAmount, 'left'],
            [matchResults.orders.rightOrder, matchResults.orders.rightOrderTakerAssetFilledAmount, 'right'],
        ] as Array<[SignedOrder, BigNumber, string]>;
        await this._assertTriplesExchangeStateAsync(triples);
    }

    /**
     * Asserts the exchange state represented by provided sequence of triples.
     * @param triples The sequence of triples to verifiy. Each triple consists
     *                of an `order`, a `takerAssetFilledAmount`, and a `side`,
     *                which will be used to determine if the exchange's state
     *                is valid.
     */
    private async _assertTriplesExchangeStateAsync(triples: Array<[SignedOrder, BigNumber, string]>): Promise<void> {
        await Promise.all(
            triples.map(async ([order, expectedFilledAmount, side]) => {
                expect(['left', 'right']).to.include(side);
                await this._assertOrderFilledAmountAsync(order, expectedFilledAmount, side);
            }),
        );
    }

    /**
     * Asserts that the provided order's fill amount and order status
     * are the expected values.
     * @param order The order to verify for a correct state.
     * @param expectedFilledAmount The amount that the order should
     *                             have been filled.
     * @param side The side that the provided order should be matched on.
     */
    private async _assertOrderFilledAmountAsync(
        order: SignedOrder,
        expectedFilledAmount: BigNumber,
        side: string,
    ): Promise<void> {
        const orderInfo = await this._deployment.exchange.getOrderInfo(order).callAsync();
        // Check filled amount of order.
        const actualFilledAmount = orderInfo.orderTakerAssetFilledAmount;
        expect(actualFilledAmount, `${side} order final filled amount`).to.be.bignumber.equal(expectedFilledAmount);
        // Check status of order.
        const expectedStatus = expectedFilledAmount.isGreaterThanOrEqualTo(order.takerAssetAmount)
            ? OrderStatus.FullyFilled
            : OrderStatus.Fillable;
        const actualStatus = orderInfo.orderStatus;
        expect(actualStatus, `${side} order final status`).to.equal(expectedStatus);
    }
}

/**
 * Converts a `Partial<MatchTransferAmounts>` to a `MatchTransferAmounts` by
 *      filling in missing fields with zero.
 */
function toFullMatchTransferAmounts(partial: Partial<MatchTransferAmounts>): MatchTransferAmounts {
    // prettier-ignore
    return {
        leftMakerAssetSoldByLeftMakerAmount:
            partial.leftMakerAssetSoldByLeftMakerAmount ||
            partial.leftMakerAssetBoughtByRightMakerAmount ||
            constants.ZERO_AMOUNT,
        rightMakerAssetSoldByRightMakerAmount:
            partial.rightMakerAssetSoldByRightMakerAmount ||
            partial.rightMakerAssetBoughtByLeftMakerAmount ||
            constants.ZERO_AMOUNT,
        rightMakerAssetBoughtByLeftMakerAmount:
            partial.rightMakerAssetBoughtByLeftMakerAmount ||
            partial.rightMakerAssetSoldByRightMakerAmount ||
            constants.ZERO_AMOUNT,
        leftMakerAssetBoughtByRightMakerAmount: partial.leftMakerAssetBoughtByRightMakerAmount ||
            partial.leftMakerAssetSoldByLeftMakerAmount ||
            constants.ZERO_AMOUNT,
        leftMakerFeeAssetPaidByLeftMakerAmount:
            partial.leftMakerFeeAssetPaidByLeftMakerAmount || constants.ZERO_AMOUNT,
        rightMakerFeeAssetPaidByRightMakerAmount:
            partial.rightMakerFeeAssetPaidByRightMakerAmount || constants.ZERO_AMOUNT,
        leftMakerAssetReceivedByTakerAmount:
            partial.leftMakerAssetReceivedByTakerAmount || constants.ZERO_AMOUNT,
        rightMakerAssetReceivedByTakerAmount:
            partial.rightMakerAssetReceivedByTakerAmount || constants.ZERO_AMOUNT,
        leftTakerFeeAssetPaidByTakerAmount:
            partial.leftTakerFeeAssetPaidByTakerAmount || constants.ZERO_AMOUNT,
        rightTakerFeeAssetPaidByTakerAmount:
            partial.rightTakerFeeAssetPaidByTakerAmount || constants.ZERO_AMOUNT,
        leftProtocolFeePaidByTakerInEthAmount:
            partial.leftProtocolFeePaidByTakerInEthAmount || constants.ZERO_AMOUNT,
        leftProtocolFeePaidByTakerInWethAmount:
            partial.leftProtocolFeePaidByTakerInWethAmount || constants.ZERO_AMOUNT,
        rightProtocolFeePaidByTakerInEthAmount:
            partial.rightProtocolFeePaidByTakerInEthAmount || constants.ZERO_AMOUNT,
        rightProtocolFeePaidByTakerInWethAmount:
            partial.rightProtocolFeePaidByTakerInWethAmount || constants.ZERO_AMOUNT,
    };
}

/**
 * Checks values from the logs produced by Exchange.matchOrders against
 *      the expected transfer amounts.
 * @param orders The matched orders.
 * @param transactionReceipt Transaction receipt and logs produced by Exchange.matchOrders.
 */
function assertFillEvents(expectedFills: FillEventArgs[], transactionReceipt: TransactionReceiptWithDecodedLogs): void {
    // Extract the actual `Fill` events.
    const actualFills = extractFillEventsfromReceipt(transactionReceipt);
    expect(actualFills.length, 'wrong number of Fill events').to.be.equal(expectedFills.length);
    // Validate event arguments.
    const fillPairs = _.zip(expectedFills, actualFills) as Array<[FillEventArgs, FillEventArgs]>;
    for (const [expected, actual] of fillPairs) {
        const side = expected === expectedFills[0] ? 'Left' : 'Right';
        expect(actual.orderHash, `${side} order Fill event orderHash`).to.equal(expected.orderHash);
        expect(actual.makerAddress, `${side} order Fill event makerAddress`).to.equal(expected.makerAddress);
        expect(actual.takerAddress, `${side} order Fill event takerAddress`).to.equal(expected.takerAddress);
        expect(actual.makerAssetFilledAmount, `${side} order Fill event makerAssetFilledAmount`).to.bignumber.equal(
            expected.makerAssetFilledAmount,
        );
        expect(actual.takerAssetFilledAmount, `${side} order Fill event takerAssetFilledAmount`).to.bignumber.equal(
            expected.takerAssetFilledAmount,
        );
        expect(actual.makerFeePaid, `${side} order Fill event makerFeePaid`).to.bignumber.equal(expected.makerFeePaid);
        expect(actual.takerFeePaid, `${side} order Fill event takerFeePaid`).to.bignumber.equal(expected.takerFeePaid);
    }
}

/**
 *  Create a pair of `Fill` events for a simulated `matchOrder()`.
 */
function simulateFillEvents(
    orders: MatchedOrders,
    takerAddress: string,
    transferAmounts: MatchTransferAmounts,
): [FillEventArgs, FillEventArgs] {
    // prettier-ignore
    return [
        // Left order Fill
        {
            orderHash: orderHashUtils.getOrderHashHex(orders.leftOrder),
            makerAddress: orders.leftOrder.makerAddress,
            takerAddress,
            makerAssetFilledAmount: transferAmounts.leftMakerAssetSoldByLeftMakerAmount,
            takerAssetFilledAmount: transferAmounts.rightMakerAssetBoughtByLeftMakerAmount,
            makerFeePaid: transferAmounts.leftMakerFeeAssetPaidByLeftMakerAmount,
            takerFeePaid: transferAmounts.leftTakerFeeAssetPaidByTakerAmount,
            protocolFeePaid: transferAmounts.leftProtocolFeePaidByTakerInEthAmount.plus(
                transferAmounts.leftProtocolFeePaidByTakerInWethAmount,
            ),
        },
        // Right order Fill
        {
            orderHash: orderHashUtils.getOrderHashHex(orders.rightOrder),
            makerAddress: orders.rightOrder.makerAddress,
            takerAddress,
            makerAssetFilledAmount: transferAmounts.rightMakerAssetSoldByRightMakerAmount,
            takerAssetFilledAmount: transferAmounts.leftMakerAssetBoughtByRightMakerAmount,
            makerFeePaid: transferAmounts.rightMakerFeeAssetPaidByRightMakerAmount,
            takerFeePaid: transferAmounts.rightTakerFeeAssetPaidByTakerAmount,
            protocolFeePaid: transferAmounts.rightProtocolFeePaidByTakerInEthAmount.plus(
                transferAmounts.rightProtocolFeePaidByTakerInWethAmount,
            ),
        },
    ];
}

/**
 * Extract `Fill` events from a transaction receipt.
 */
function extractFillEventsfromReceipt(receipt: TransactionReceiptWithDecodedLogs): FillEventArgs[] {
    interface RawFillEventArgs {
        orderHash: string;
        makerAddress: string;
        takerAddress: string;
        makerAssetFilledAmount: string;
        takerAssetFilledAmount: string;
        makerFeePaid: string;
        takerFeePaid: string;
        protocolFeePaid: string;
    }
    const actualFills = (_.filter(receipt.logs, ['event', 'Fill']) as any) as Array<
        LogWithDecodedArgs<RawFillEventArgs>
    >;
    // Convert RawFillEventArgs to FillEventArgs.
    return actualFills.map(fill => ({
        orderHash: fill.args.orderHash,
        makerAddress: fill.args.makerAddress,
        takerAddress: fill.args.takerAddress,
        makerAssetFilledAmount: new BigNumber(fill.args.makerAssetFilledAmount),
        takerAssetFilledAmount: new BigNumber(fill.args.takerAssetFilledAmount),
        makerFeePaid: new BigNumber(fill.args.makerFeePaid),
        takerFeePaid: new BigNumber(fill.args.takerFeePaid),
        protocolFeePaid: new BigNumber(fill.args.protocolFeePaid),
    }));
}

/**
 * Gets the last match in a BatchMatchResults object.
 * @param batchMatchResults The BatchMatchResults object.
 * @return The last match of the results.
 */
function getLastMatch(batchMatchResults: BatchMatchResults): MatchResults {
    return batchMatchResults.matches[batchMatchResults.matches.length - 1];
}

/**
 * Add a new fill results object to a total fill results object destructively.
 * @param total The total fill results that should be updated.
 * @param fill The new fill results that should be used to accumulate.
 */
function addFillResults(total: FillEventArgs, fill: FillEventArgs): void {
    // Ensure that the total and fill are compatibe fill events
    expect(total.orderHash).to.be.eq(fill.orderHash);
    expect(total.makerAddress).to.be.eq(fill.makerAddress);
    expect(total.takerAddress).to.be.eq(fill.takerAddress);

    // Add the fill results together
    total.makerAssetFilledAmount = total.makerAssetFilledAmount.plus(fill.makerAssetFilledAmount);
    total.takerAssetFilledAmount = total.takerAssetFilledAmount.plus(fill.takerAssetFilledAmount);
    total.makerFeePaid = total.makerFeePaid.plus(fill.makerFeePaid);
    total.takerFeePaid = total.takerFeePaid.plus(fill.takerFeePaid);
    total.protocolFeePaid = total.protocolFeePaid.plus(fill.protocolFeePaid);
}

/**
 * Converts a BatchMatchResults object to the associated value that correspondes to a value that could be
 * returned by `batchMatchOrders` or `batchMatchOrdersWithMaximalFill`.
 * @param results The results object to convert
 * @return The associated object that can be compared to the return value of `batchMatchOrders`
 */
function convertToBatchMatchResults(results: BatchMatchResults): BatchMatchedFillResults {
    // Initialize the results object
    const batchMatchedFillResults: BatchMatchedFillResults = {
        left: [],
        right: [],
        profitInLeftMakerAsset: constants.ZERO_AMOUNT,
        profitInRightMakerAsset: constants.ZERO_AMOUNT,
    };
    for (const match of results.matches) {
        const leftSpread = match.fills[0].makerAssetFilledAmount.minus(match.fills[1].takerAssetFilledAmount);
        // If the left maker spread is positive for match, update the profitInLeftMakerAsset
        if (leftSpread.isGreaterThan(constants.ZERO_AMOUNT)) {
            batchMatchedFillResults.profitInLeftMakerAsset = batchMatchedFillResults.profitInLeftMakerAsset.plus(
                leftSpread,
            );
        }
        const rightSpread = match.fills[1].makerAssetFilledAmount.minus(match.fills[0].takerAssetFilledAmount);
        // If the right maker spread is positive for match, update the profitInRightMakerAsset
        if (rightSpread.isGreaterThan(constants.ZERO_AMOUNT)) {
            batchMatchedFillResults.profitInRightMakerAsset = batchMatchedFillResults.profitInRightMakerAsset.plus(
                rightSpread,
            );
        }
    }
    for (const fill of results.leftFilledResults) {
        batchMatchedFillResults.left.push(convertToFillResults(fill));
    }
    for (const fill of results.rightFilledResults) {
        batchMatchedFillResults.right.push(convertToFillResults(fill));
    }
    return batchMatchedFillResults;
}

/**
 * Converts a MatchResults object to the associated value that correspondes to a value that could be
 * returned by `matchOrders` or `matchOrdersWithMaximalFill`.
 * @param results The results object to convert
 * @return The associated object that can be compared to the return value of `matchOrders`
 */
function convertToMatchResults(result: MatchResults): MatchedFillResults {
    // If the left spread is negative, set it to zero
    let profitInLeftMakerAsset = result.fills[0].makerAssetFilledAmount.minus(result.fills[1].takerAssetFilledAmount);
    if (profitInLeftMakerAsset.isLessThanOrEqualTo(constants.ZERO_AMOUNT)) {
        profitInLeftMakerAsset = constants.ZERO_AMOUNT;
    }

    // If the right spread is negative, set it to zero
    let profitInRightMakerAsset = result.fills[1].makerAssetFilledAmount.minus(result.fills[0].takerAssetFilledAmount);
    if (profitInRightMakerAsset.isLessThanOrEqualTo(constants.ZERO_AMOUNT)) {
        profitInRightMakerAsset = constants.ZERO_AMOUNT;
    }

    const matchedFillResults: MatchedFillResults = {
        left: {
            makerAssetFilledAmount: result.fills[0].makerAssetFilledAmount,
            takerAssetFilledAmount: result.fills[0].takerAssetFilledAmount,
            makerFeePaid: result.fills[0].makerFeePaid,
            takerFeePaid: result.fills[0].takerFeePaid,
            protocolFeePaid: result.fills[0].protocolFeePaid,
        },
        right: {
            makerAssetFilledAmount: result.fills[1].makerAssetFilledAmount,
            takerAssetFilledAmount: result.fills[1].takerAssetFilledAmount,
            makerFeePaid: result.fills[1].makerFeePaid,
            takerFeePaid: result.fills[1].takerFeePaid,
            protocolFeePaid: result.fills[1].protocolFeePaid,
        },
        profitInLeftMakerAsset,
        profitInRightMakerAsset,
    };
    return matchedFillResults;
}

/**
 * Converts a fill event args object to the associated FillResults object.
 * @param result The result to be converted to a FillResults object.
 * @return The converted value.
 */
function convertToFillResults(result: FillEventArgs): FillResults {
    const fillResults: FillResults = {
        makerAssetFilledAmount: result.makerAssetFilledAmount,
        takerAssetFilledAmount: result.takerAssetFilledAmount,
        makerFeePaid: result.makerFeePaid,
        takerFeePaid: result.takerFeePaid,
        protocolFeePaid: result.protocolFeePaid,
    };
    return fillResults;
}

/**
 * Creates an empty FillEventArgs object.
 * @return The empty FillEventArgs object.
 */
function emptyFillEventArgs(): FillEventArgs {
    const empty: FillEventArgs = {
        orderHash: '',
        makerAddress: '',
        takerAddress: '',
        makerAssetFilledAmount: constants.ZERO_AMOUNT,
        takerAssetFilledAmount: constants.ZERO_AMOUNT,
        makerFeePaid: constants.ZERO_AMOUNT,
        takerFeePaid: constants.ZERO_AMOUNT,
        protocolFeePaid: constants.ZERO_AMOUNT,
    };
    return empty;
}
// tslint:disable-line:max-file-line-count
