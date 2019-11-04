import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { BlockchainBalanceStore, ExchangeContract, LocalBalanceStore } from '@0x/contracts-exchange';
import { constants, expect, OrderStatus } from '@0x/contracts-test-utils';
import { orderHashUtils } from '@0x/order-utils';
import { BatchMatchedFillResults, FillResults, MatchedFillResults, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { LogWithDecodedArgs, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { DeploymentManager } from './deployment_manager';

const ZERO = new BigNumber(0);

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
    leftProtocolFeePaidByTakerAmount: BigNumber; // 0 if omitted
    rightProtocolFeePaidByTakerAmount: BigNumber; // 0 if omitted
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

export class MatchOrderTester {
    private readonly _devUtils: DevUtilsContract;
    private readonly _deployment: DeploymentManager;
    private readonly _blockchainBalanceStore: BlockchainBalanceStore;

    constructor(
        deployment: DeploymentManager,
        devUtils: DevUtilsContract,
        blockchainBalanceStore: BlockchainBalanceStore,
    ) {
        this._deployment = deployment;
        this._devUtils = devUtils;
        this._blockchainBalanceStore = blockchainBalanceStore;
    }

    /**
     * Performs batch order matching on a set of complementary orders and asserts results.
     * @param orders The list of orders and filled states
     * @param matchPairs An array of left and right indices that will be used to perform
     *                   the expected simulation.
     * @param takerAddress Address of taker (the address who matched the two orders)
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
        await assertBatchOrderStatesAsync(orders, this._deployment.exchange);

        // Update the blockchain balance store and create a new local balance store
        // with the same initial balances.
        await this._blockchainBalanceStore.updateBalancesAsync();
        const localBalanceStore = LocalBalanceStore.create(this._blockchainBalanceStore);

        // Execute `batchMatchOrders()`
        let actualBatchMatchResults;
        let transactionReceipt;
        if (withMaximalFill) {
            actualBatchMatchResults = await this._deployment.exchange.batchMatchOrdersWithMaximalFill.callAsync(
                orders.leftOrders,
                orders.rightOrders,
                orders.leftOrders.map(order => order.signature),
                orders.rightOrders.map(order => order.signature),
                { from: takerAddress, gasPrice: constants.DEFAULT_GAS_PRICE, value },
            );
            transactionReceipt = await this._deployment.exchange.batchMatchOrdersWithMaximalFill.awaitTransactionSuccessAsync(
                orders.leftOrders,
                orders.rightOrders,
                orders.leftOrders.map(order => order.signature),
                orders.rightOrders.map(order => order.signature),
                { from: takerAddress, gasPrice: constants.DEFAULT_GAS_PRICE, value },
            );
        } else {
            actualBatchMatchResults = await this._deployment.exchange.batchMatchOrders.callAsync(
                orders.leftOrders,
                orders.rightOrders,
                orders.leftOrders.map(order => order.signature),
                orders.rightOrders.map(order => order.signature),
                { from: takerAddress, gasPrice: constants.DEFAULT_GAS_PRICE, value },
            );
            transactionReceipt = await this._deployment.exchange.batchMatchOrders.awaitTransactionSuccessAsync(
                orders.leftOrders,
                orders.rightOrders,
                orders.leftOrders.map(order => order.signature),
                orders.rightOrders.map(order => order.signature),
                { from: takerAddress, gasPrice: constants.DEFAULT_GAS_PRICE, value },
            );
        }
        localBalanceStore.burnGas(takerAddress, constants.DEFAULT_GAS_PRICE * transactionReceipt.gasUsed);

        // Simulate the batch order match.
        const expectedBatchMatchResults = await simulateBatchMatchOrdersAsync(
            orders,
            takerAddress,
            this._deployment.staking.stakingProxy.address,
            this._blockchainBalanceStore,
            localBalanceStore,
            matchPairs,
            expectedTransferAmounts,
            this._devUtils,
        );
        const expectedResults = convertToBatchMatchResults(expectedBatchMatchResults);
        expect(actualBatchMatchResults).to.be.eql(expectedResults);

        // Validate the simulation against reality.
        await assertBatchMatchResultsAsync(
            expectedBatchMatchResults,
            transactionReceipt,
            this._blockchainBalanceStore,
            localBalanceStore,
            this._deployment.exchange,
        );
        return expectedBatchMatchResults;
    }

    /**
     * Matches two complementary orders and asserts results.
     * @param orders The matched orders and filled states.
     * @param takerAddress Address of taker (the address who matched the two orders)
     * @param expectedTransferAmounts Expected amounts transferred as a result of order matching.
     *                                Omitted fields are either set to 0 or their complementary
     *                                field.
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
        await assertInitialOrderStatesAsync(orders, this._deployment.exchange);

        // Update the blockchain balance store and create a new local balance store
        // with the same initial balances.
        await this._blockchainBalanceStore.updateBalancesAsync();
        const localBalanceStore = LocalBalanceStore.create(this._blockchainBalanceStore);

        // Execute `matchOrders()`
        let actualMatchResults;
        let transactionReceipt;
        if (withMaximalFill) {
            actualMatchResults = await this._deployment.exchange.matchOrdersWithMaximalFill.callAsync(
                orders.leftOrder,
                orders.rightOrder,
                orders.leftOrder.signature,
                orders.rightOrder.signature,
                { from: takerAddress, gasPrice: constants.DEFAULT_GAS_PRICE, value },
            );
            transactionReceipt = await this._deployment.exchange.matchOrdersWithMaximalFill.awaitTransactionSuccessAsync(
                orders.leftOrder,
                orders.rightOrder,
                orders.leftOrder.signature,
                orders.rightOrder.signature,
                { from: takerAddress, gasPrice: constants.DEFAULT_GAS_PRICE, value },
            );
        } else {
            actualMatchResults = await this._deployment.exchange.matchOrders.callAsync(
                orders.leftOrder,
                orders.rightOrder,
                orders.leftOrder.signature,
                orders.rightOrder.signature,
                { from: takerAddress, gasPrice: constants.DEFAULT_GAS_PRICE, value },
            );
            transactionReceipt = await this._deployment.exchange.matchOrders.awaitTransactionSuccessAsync(
                orders.leftOrder,
                orders.rightOrder,
                orders.leftOrder.signature,
                orders.rightOrder.signature,
                { from: takerAddress, gasPrice: constants.DEFAULT_GAS_PRICE, value },
            );
        }
        localBalanceStore.burnGas(takerAddress, constants.DEFAULT_GAS_PRICE * transactionReceipt.gasUsed);

        // Simulate the fill.
        const expectedMatchResults = await simulateMatchOrdersAsync(
            orders,
            takerAddress,
            this._deployment.staking.stakingProxy.address,
            this._blockchainBalanceStore,
            toFullMatchTransferAmounts(expectedTransferAmounts),
            this._devUtils,
            localBalanceStore,
        );
        const expectedResults = convertToMatchResults(expectedMatchResults);
        expect(actualMatchResults).to.be.eql(expectedResults);

        // Validate the simulation against reality.
        await assertMatchResultsAsync(
            expectedMatchResults,
            transactionReceipt,
            localBalanceStore,
            this._blockchainBalanceStore,
            this._deployment.exchange,
        );
        return expectedMatchResults;
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
            ZERO,
        rightMakerAssetSoldByRightMakerAmount:
            partial.rightMakerAssetSoldByRightMakerAmount ||
            partial.rightMakerAssetBoughtByLeftMakerAmount ||
            ZERO,
        rightMakerAssetBoughtByLeftMakerAmount:
            partial.rightMakerAssetBoughtByLeftMakerAmount ||
            partial.rightMakerAssetSoldByRightMakerAmount ||
            ZERO,
        leftMakerAssetBoughtByRightMakerAmount: partial.leftMakerAssetBoughtByRightMakerAmount ||
            partial.leftMakerAssetSoldByLeftMakerAmount ||
            ZERO,
        leftMakerFeeAssetPaidByLeftMakerAmount:
            partial.leftMakerFeeAssetPaidByLeftMakerAmount || ZERO,
        rightMakerFeeAssetPaidByRightMakerAmount:
            partial.rightMakerFeeAssetPaidByRightMakerAmount || ZERO,
        leftMakerAssetReceivedByTakerAmount:
            partial.leftMakerAssetReceivedByTakerAmount || ZERO,
        rightMakerAssetReceivedByTakerAmount:
            partial.rightMakerAssetReceivedByTakerAmount || ZERO,
        leftTakerFeeAssetPaidByTakerAmount:
            partial.leftTakerFeeAssetPaidByTakerAmount || ZERO,
        rightTakerFeeAssetPaidByTakerAmount:
            partial.rightTakerFeeAssetPaidByTakerAmount || ZERO,
        leftProtocolFeePaidByTakerAmount:
            partial.leftProtocolFeePaidByTakerAmount || ZERO,
        rightProtocolFeePaidByTakerAmount:
            partial.rightProtocolFeePaidByTakerAmount || ZERO,
    };
}

/**
 * Simulates matching a batch of orders by transferring amounts defined in
 * `transferAmounts` and returns the results.
 * @param orders The orders being batch matched and their filled states.
 * @param takerAddress Address of taker (the address who matched the two orders)
 * @param tokenBalances Current token balances.
 * @param transferAmounts Amounts to transfer during the simulation.
 * @return The new account balances and fill events that occurred during the match.
 */
async function simulateBatchMatchOrdersAsync(
    orders: BatchMatchedOrders,
    takerAddress: string,
    stakingProxyAddress: string,
    blockchainBalanceStore: BlockchainBalanceStore,
    localBalanceStore: LocalBalanceStore,
    matchPairs: Array<[number, number]>,
    transferAmounts: Array<Partial<MatchTransferAmounts>>,
    devUtils: DevUtilsContract,
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
                    getLastMatch(batchMatchResults).orders.leftOrderTakerAssetFilledAmount || ZERO,
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
                    getLastMatch(batchMatchResults).orders.rightOrderTakerAssetFilledAmount || ZERO,
                    'right',
                ]);
            }
        }

        // FIXME - These arguments should be reordered
        // Add the latest match to the batch match results
        batchMatchResults.matches.push(
            await simulateMatchOrdersAsync(
                matchedOrders,
                takerAddress,
                stakingProxyAddress,
                blockchainBalanceStore,
                toFullMatchTransferAmounts(transferAmounts[i]),
                devUtils,
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
            addFillResults(batchMatchResults.rightFilledResults[rightIdx], getLastMatch(batchMatchResults).fills[1]);
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
        getLastMatch(batchMatchResults).orders.leftOrderTakerAssetFilledAmount || ZERO,
        'left',
    ]);
    batchMatchResults.filledAmounts.push([
        orders.rightOrders[lastRightIdx],
        getLastMatch(batchMatchResults).orders.rightOrderTakerAssetFilledAmount || ZERO,
        'right',
    ]);

    // Return the batch match results
    return batchMatchResults;
}

// FIXME - Is it possible to remove `transferAmounts`
/**
 * Simulates matching two orders by transferring amounts defined in
 * `transferAmounts` and returns the results.
 * @param orders The orders being matched and their filled states.
 * @param takerAddress Address of taker (the address who matched the two orders)
 * @param tokenBalances Current token balances.
 * @param transferAmounts Amounts to transfer during the simulation.
 * @return The new account balances and fill events that occurred during the match.
 */
async function simulateMatchOrdersAsync(
    orders: MatchedOrders,
    takerAddress: string,
    stakingProxyAddress: string,
    blockchainBalanceStore: BlockchainBalanceStore, // FIXME - Is this right?
    transferAmounts: MatchTransferAmounts,
    devUtils: DevUtilsContract,
    localBalanceStore: LocalBalanceStore,
): Promise<MatchResults> {
    // prettier-ignore
    const matchResults = {
        orders: {
            leftOrder: orders.leftOrder,
            leftOrderTakerAssetFilledAmount:
                (orders.leftOrderTakerAssetFilledAmount || ZERO).plus(
                    transferAmounts.rightMakerAssetBoughtByLeftMakerAmount,
                ),
            rightOrder: orders.rightOrder,
            rightOrderTakerAssetFilledAmount:
                (orders.rightOrderTakerAssetFilledAmount || ZERO).plus(
                    transferAmounts.leftMakerAssetBoughtByRightMakerAmount,
                ),
        },
        fills: simulateFillEvents(orders, takerAddress, transferAmounts),
    };

    // Right maker asset -> left maker
    localBalanceStore.transferAsset(
        orders.rightOrder.makerAddress,
        orders.leftOrder.makerAddress,
        transferAmounts.rightMakerAssetBoughtByLeftMakerAmount,
        orders.rightOrder.makerAssetData,
    );

    // FIXME - Is this a necessary condition?
    if (orders.leftOrder.makerAddress !== orders.leftOrder.feeRecipientAddress) {
        // Left maker fees
        localBalanceStore.transferAsset(
            orders.leftOrder.makerAddress,
            orders.leftOrder.feeRecipientAddress,
            transferAmounts.leftMakerFeeAssetPaidByLeftMakerAmount,
            orders.leftOrder.makerFeeAssetData,
        );
    }

    // FIXME - Is this a necessary condition?
    // Left maker asset -> right maker
    localBalanceStore.transferAsset(
        orders.leftOrder.makerAddress,
        orders.rightOrder.makerAddress,
        transferAmounts.leftMakerAssetBoughtByRightMakerAmount,
        orders.leftOrder.makerAssetData,
    );

    // FIXME - Is this a necessary condition?
    if (orders.rightOrder.makerAddress !== orders.rightOrder.feeRecipientAddress) {
        // Right maker fees
        localBalanceStore.transferAsset(
            orders.rightOrder.makerAddress,
            orders.rightOrder.feeRecipientAddress,
            transferAmounts.rightMakerFeeAssetPaidByRightMakerAmount,
            orders.rightOrder.makerFeeAssetData,
        );
    }

    // Left taker profit
    localBalanceStore.transferAsset(
        orders.leftOrder.makerAddress,
        takerAddress,
        transferAmounts.leftMakerAssetReceivedByTakerAmount,
        orders.leftOrder.makerAssetData,
    );

    // Right taker profit
    localBalanceStore.transferAsset(
        orders.rightOrder.makerAddress,
        takerAddress,
        transferAmounts.rightMakerAssetReceivedByTakerAmount,
        orders.rightOrder.makerAssetData,
    );

    // Left taker fees
    localBalanceStore.transferAsset(
        takerAddress,
        orders.leftOrder.feeRecipientAddress,
        transferAmounts.leftTakerFeeAssetPaidByTakerAmount,
        orders.leftOrder.takerFeeAssetData,
    );

    // Right taker fees
    localBalanceStore.transferAsset(
        takerAddress,
        orders.rightOrder.feeRecipientAddress,
        transferAmounts.rightTakerFeeAssetPaidByTakerAmount,
        orders.rightOrder.takerFeeAssetData,
    );

    // Protocol Fee
    localBalanceStore.sendEth(
        takerAddress,
        stakingProxyAddress,
        transferAmounts.leftProtocolFeePaidByTakerAmount.plus(transferAmounts.rightProtocolFeePaidByTakerAmount),
    );

    return matchResults;
}

/**
 * Checks that the results of `simulateBatchMatchOrders()` agrees with reality.
 * @param batchMatchResults The results of a `simulateBatchMatchOrders()`.
 * @param transactionReceipt The transaction receipt of a call to `matchOrders()`.
 * @param actualTokenBalances The actual, on-chain token balances of known addresses.
 * @param exchangeWrapper The ExchangeWrapper instance.
 */
async function assertBatchMatchResultsAsync(
    batchMatchResults: BatchMatchResults,
    transactionReceipt: TransactionReceiptWithDecodedLogs,
    blockchainBalanceStore: BlockchainBalanceStore,
    localBalanceStore: LocalBalanceStore,
    exchange: ExchangeContract,
): Promise<void> {
    // Ensure that the batchMatchResults contain at least one match
    expect(batchMatchResults.matches.length).to.be.gt(0);

    // Check the fill events.
    assertFillEvents(
        batchMatchResults.matches.map(match => match.fills).reduce((total, fills) => total.concat(fills)),
        transactionReceipt,
    );

    // Update the blockchain balance store balances.
    await blockchainBalanceStore.updateBalancesAsync();

    // Ensure that the actual and expected token balances are equivalent.
    localBalanceStore.assertEquals(blockchainBalanceStore);

    // Check the Exchange state.
    await assertPostBatchExchangeStateAsync(batchMatchResults, exchange);
}

/**
 * Checks that the results of `simulateMatchOrders()` agrees with reality.
 * @param matchResults The results of a `simulateMatchOrders()`.
 * @param transactionReceipt The transaction receipt of a call to `matchOrders()`.
 * @param actualTokenBalances The actual, on-chain token balances of known addresses.
 * @param exchangeWrapper The ExchangeWrapper instance.
 */
async function assertMatchResultsAsync(
    matchResults: MatchResults,
    transactionReceipt: TransactionReceiptWithDecodedLogs,
    localBalanceStore: LocalBalanceStore,
    blockchainBalanceStore: BlockchainBalanceStore,
    exchange: ExchangeContract,
): Promise<void> {
    // Check the fill events.
    assertFillEvents(matchResults.fills, transactionReceipt);

    // Update the blockchain balance store balances.
    await blockchainBalanceStore.updateBalancesAsync();

    // Check the token balances.
    localBalanceStore.assertEquals(blockchainBalanceStore);

    // Check the Exchange state.
    await assertPostExchangeStateAsync(matchResults, exchange);
}

/**
 * Checks values from the logs produced by Exchange.matchOrders against
 *      the expected transfer amounts.
 * @param orders The matched orders.
 * @param takerAddress Address of taker (account that called Exchange.matchOrders)
 * @param transactionReceipt Transaction receipt and logs produced by Exchange.matchOrders.
 * @param expectedTransferAmounts Expected amounts transferred as a result of order matching.
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
            protocolFeePaid: transferAmounts.leftProtocolFeePaidByTakerAmount,
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
            protocolFeePaid: transferAmounts.rightProtocolFeePaidByTakerAmount,
        },
    ];
}

// FIXME - Refactor this to use filterToLogsArguments
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
 * Asserts the initial exchange state for batch matched orders.
 * @param orders Batch matched orders with intial filled amounts.
 * @param exchangeWrapper ExchangeWrapper instance.
 */
async function assertBatchOrderStatesAsync(orders: BatchMatchedOrders, exchange: ExchangeContract): Promise<void> {
    for (let i = 0; i < orders.leftOrders.length; i++) {
        await assertOrderFilledAmountAsync(
            orders.leftOrders[i],
            orders.leftOrdersTakerAssetFilledAmounts[i],
            'left',
            exchange,
        );
    }
    for (let i = 0; i < orders.rightOrders.length; i++) {
        await assertOrderFilledAmountAsync(
            orders.rightOrders[i],
            orders.rightOrdersTakerAssetFilledAmounts[i],
            'right',
            exchange,
        );
    }
}

/**
 * Asserts the initial exchange state for matched orders.
 * @param orders Matched orders with intial filled amounts.
 * @param exchangeWrapper ExchangeWrapper instance.
 */
async function assertInitialOrderStatesAsync(orders: MatchedOrders, exchange: ExchangeContract): Promise<void> {
    const pairs = [
        [orders.leftOrder, orders.leftOrderTakerAssetFilledAmount || ZERO],
        [orders.rightOrder, orders.rightOrderTakerAssetFilledAmount || ZERO],
    ] as Array<[SignedOrder, BigNumber]>;
    await Promise.all(
        pairs.map(async ([order, expectedFilledAmount]) => {
            const side = order === orders.leftOrder ? 'left' : 'right';
            await assertOrderFilledAmountAsync(order, expectedFilledAmount, side, exchange);
        }),
    );
}

/**
 * Asserts the exchange state after a call to `batchMatchOrders()`.
 * @param batchMatchResults Results from a call to `simulateBatchMatchOrders()`.
 * @param exchangeWrapper The ExchangeWrapper instance.
 */
async function assertPostBatchExchangeStateAsync(
    batchMatchResults: BatchMatchResults,
    exchange: ExchangeContract,
): Promise<void> {
    await assertTriplesExchangeStateAsync(batchMatchResults.filledAmounts, exchange);
}

/**
 * Asserts the exchange state after a call to `matchOrders()`.
 * @param matchResults Results from a call to `simulateMatchOrders()`.
 * @param exchangeWrapper The ExchangeWrapper instance.
 */
async function assertPostExchangeStateAsync(matchResults: MatchResults, exchange: ExchangeContract): Promise<void> {
    const triples = [
        [matchResults.orders.leftOrder, matchResults.orders.leftOrderTakerAssetFilledAmount, 'left'],
        [matchResults.orders.rightOrder, matchResults.orders.rightOrderTakerAssetFilledAmount, 'right'],
    ] as Array<[SignedOrder, BigNumber, string]>;
    await assertTriplesExchangeStateAsync(triples, exchange);
}

/**
 * Asserts the exchange state represented by provided sequence of triples.
 * @param triples The sequence of triples to verifiy. Each triple consists
 *                of an `order`, a `takerAssetFilledAmount`, and a `side`,
 *                which will be used to determine if the exchange's state
 *                is valid.
 * @param exchangeWrapper The ExchangeWrapper instance.
 */
async function assertTriplesExchangeStateAsync(
    triples: Array<[SignedOrder, BigNumber, string]>,
    exchange: ExchangeContract,
): Promise<void> {
    await Promise.all(
        triples.map(async ([order, expectedFilledAmount, side]) => {
            expect(['left', 'right']).to.include(side);
            await assertOrderFilledAmountAsync(order, expectedFilledAmount, side, exchange);
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
 * @param exchange The exchange contract that is in the current deployment.
 */
async function assertOrderFilledAmountAsync(
    order: SignedOrder,
    expectedFilledAmount: BigNumber,
    side: string,
    exchange: ExchangeContract,
): Promise<void> {
    const orderInfo = await exchange.getOrderInfo.callAsync(order);
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

/**
 * Gets the last match in a BatchMatchResults object.
 * @param batchMatchResults The BatchMatchResults object.
 * @return The last match of the results.
 */
function getLastMatch(batchMatchResults: BatchMatchResults): MatchResults {
    return batchMatchResults.matches[batchMatchResults.matches.length - 1];
}

// FIXME - This can probably be removed in favor of the reference functions.
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
        profitInLeftMakerAsset: ZERO,
        profitInRightMakerAsset: ZERO,
    };
    for (const match of results.matches) {
        const leftSpread = match.fills[0].makerAssetFilledAmount.minus(match.fills[1].takerAssetFilledAmount);
        // If the left maker spread is positive for match, update the profitInLeftMakerAsset
        if (leftSpread.isGreaterThan(ZERO)) {
            batchMatchedFillResults.profitInLeftMakerAsset = batchMatchedFillResults.profitInLeftMakerAsset.plus(
                leftSpread,
            );
        }
        const rightSpread = match.fills[1].makerAssetFilledAmount.minus(match.fills[0].takerAssetFilledAmount);
        // If the right maker spread is positive for match, update the profitInRightMakerAsset
        if (rightSpread.isGreaterThan(ZERO)) {
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
    if (profitInLeftMakerAsset.isLessThanOrEqualTo(ZERO)) {
        profitInLeftMakerAsset = ZERO;
    }

    // If the right spread is negative, set it to zero
    let profitInRightMakerAsset = result.fills[1].makerAssetFilledAmount.minus(result.fills[0].takerAssetFilledAmount);
    if (profitInRightMakerAsset.isLessThanOrEqualTo(ZERO)) {
        profitInRightMakerAsset = ZERO;
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
