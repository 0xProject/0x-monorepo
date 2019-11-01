import { ERC1155ProxyWrapper, ERC20Wrapper, ERC721Wrapper } from '@0x/contracts-asset-proxy';
import { constants, ERC1155HoldingsByOwner, expect, OrderStatus } from '@0x/contracts-test-utils';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { AssetProxyId, BatchMatchedFillResults, FillResults, MatchedFillResults, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { LogWithDecodedArgs, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { ExchangeWrapper } from './exchange_wrapper';

const ZERO = new BigNumber(0);

export interface IndividualERC1155Holdings {
    fungible: {
        [tokenId: string]: BigNumber;
    };
    nonFungible: BigNumber[];
}

export interface FillEventArgs {
    orderHash: string;
    makerAddress: string;
    takerAddress: string;
    makerAssetFilledAmount: BigNumber;
    takerAssetFilledAmount: BigNumber;
    makerFeePaid: BigNumber;
    takerFeePaid: BigNumber;
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
}

export interface MatchResults {
    orders: MatchedOrders;
    fills: FillEventArgs[];
    balances: TokenBalances;
}

export interface BatchMatchResults {
    matches: MatchResults[];
    filledAmounts: Array<[SignedOrder, BigNumber, string]>;
    leftFilledResults: FillEventArgs[];
    rightFilledResults: FillEventArgs[];
}

export interface ERC1155Holdings {
    [owner: string]: {
        [contract: string]: {
            fungible: {
                [tokenId: string]: BigNumber;
            };
            nonFungible: BigNumber[];
        };
    };
}

export interface TokenBalances {
    erc20: {
        [owner: string]: {
            [contract: string]: BigNumber;
        };
    };
    erc721: {
        [owner: string]: {
            [contract: string]: BigNumber[];
        };
    };
    erc1155: ERC1155Holdings;
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

export type BatchMatchOrdersAsyncCall = (
    leftOrders: SignedOrder[],
    rightOrders: SignedOrder[],
    takerAddress: string,
) => Promise<TransactionReceiptWithDecodedLogs>;

export type MatchOrdersAsyncCall = (
    leftOrder: SignedOrder,
    rightOrder: SignedOrder,
    takerAddress: string,
) => Promise<TransactionReceiptWithDecodedLogs>;

export class MatchOrderTester {
    public exchangeWrapper: ExchangeWrapper;
    public erc20Wrapper: ERC20Wrapper;
    public erc721Wrapper: ERC721Wrapper;
    public erc1155ProxyWrapper: ERC1155ProxyWrapper;
    public batchMatchOrdersCallAsync?: BatchMatchOrdersAsyncCall;
    public batchMatchOrdersWithMaximalFillCallAsync?: BatchMatchOrdersAsyncCall;
    public matchOrdersCallAsync?: MatchOrdersAsyncCall;
    public matchOrdersWithMaximalFillCallAsync?: MatchOrdersAsyncCall;
    private readonly _initialTokenBalancesPromise: Promise<TokenBalances>;

    /**
     * Constructs new MatchOrderTester.
     * @param exchangeWrapper Used to call to the Exchange.
     * @param erc20Wrapper Used to fetch ERC20 balances.
     * @param erc721Wrapper Used to fetch ERC721 token owners.
     * @param erc1155Wrapper Used to fetch ERC1155 token owners.
     * @param batchMatchOrdersCallAsync Optional, custom caller for
     *                             `ExchangeWrapper.batchMatchOrdersAsync()`.
     * @param batchMatchOrdersWithMaximalFillCallAsync Optional, custom caller for
     *                             `ExchangeWrapper.batchMatchOrdersAsync()`.
     * @param matchOrdersCallAsync Optional, custom caller for
     *                             `ExchangeWrapper.matchOrdersAsync()`.
     * @param matchOrdersWithMaximalFillCallAsync Optional, custom caller for
     *                             `ExchangeWrapper.matchOrdersAsync()`.
     */
    constructor(
        exchangeWrapper: ExchangeWrapper,
        erc20Wrapper: ERC20Wrapper,
        erc721Wrapper: ERC721Wrapper,
        erc1155ProxyWrapper: ERC1155ProxyWrapper,
        batchMatchOrdersCallAsync?: BatchMatchOrdersAsyncCall,
        batchMatchOrdersWithMaximalFillCallAsync?: BatchMatchOrdersAsyncCall,
        matchOrdersCallAsync?: MatchOrdersAsyncCall,
        matchOrdersWithMaximalFillCallAsync?: MatchOrdersAsyncCall,
    ) {
        this.exchangeWrapper = exchangeWrapper;
        this.erc20Wrapper = erc20Wrapper;
        this.erc721Wrapper = erc721Wrapper;
        this.erc1155ProxyWrapper = erc1155ProxyWrapper;
        this.batchMatchOrdersCallAsync = batchMatchOrdersCallAsync;
        this.batchMatchOrdersWithMaximalFillCallAsync = batchMatchOrdersWithMaximalFillCallAsync;
        this.matchOrdersCallAsync = matchOrdersCallAsync;
        this.matchOrdersWithMaximalFillCallAsync = matchOrdersWithMaximalFillCallAsync;
        this._initialTokenBalancesPromise = this.getBalancesAsync();
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
        matchPairs: Array<[number, number]>,
        expectedTransferAmounts: Array<Partial<MatchTransferAmounts>>,
        withMaximalFill: boolean,
        initialTokenBalances?: TokenBalances,
    ): Promise<BatchMatchResults> {
        // Ensure that the provided input is valid.
        expect(matchPairs.length).to.be.eq(expectedTransferAmounts.length);
        expect(orders.leftOrders.length).to.be.eq(orders.leftOrdersTakerAssetFilledAmounts.length);
        expect(orders.rightOrders.length).to.be.eq(orders.rightOrdersTakerAssetFilledAmounts.length);
        // Ensure that the exchange is in the expected state.
        await assertBatchOrderStatesAsync(orders, this.exchangeWrapper);
        // Get the token balances before executing `batchMatchOrders()`.
        const _initialTokenBalances = initialTokenBalances
            ? initialTokenBalances
            : await this._initialTokenBalancesPromise;
        // Execute `batchMatchOrders()`
        let actualBatchMatchResults;
        let transactionReceipt;
        if (withMaximalFill) {
            actualBatchMatchResults = await this.exchangeWrapper.getBatchMatchOrdersWithMaximalFillResultsAsync(
                orders.leftOrders,
                orders.rightOrders,
                takerAddress,
            );
            transactionReceipt = await this._executeBatchMatchOrdersWithMaximalFillAsync(
                orders.leftOrders,
                orders.rightOrders,
                takerAddress,
            );
        } else {
            actualBatchMatchResults = await this.exchangeWrapper.getBatchMatchOrdersResultsAsync(
                orders.leftOrders,
                orders.rightOrders,
                takerAddress,
            );
            transactionReceipt = await this._executeBatchMatchOrdersAsync(
                orders.leftOrders,
                orders.rightOrders,
                takerAddress,
            );
        }
        // Simulate the batch order match.
        const expectedBatchMatchResults = simulateBatchMatchOrders(
            orders,
            takerAddress,
            _initialTokenBalances,
            matchPairs,
            expectedTransferAmounts,
        );
        const expectedResults = convertToBatchMatchResults(expectedBatchMatchResults);
        expect(actualBatchMatchResults).to.be.eql(expectedResults);
        // Validate the simulation against reality.
        await assertBatchMatchResultsAsync(
            expectedBatchMatchResults,
            transactionReceipt,
            await this.getBalancesAsync(),
            _initialTokenBalances,
            this.exchangeWrapper,
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
        takerAddress: string,
        expectedTransferAmounts: Partial<MatchTransferAmounts>,
        withMaximalFill: boolean,
        initialTokenBalances?: TokenBalances,
    ): Promise<MatchResults> {
        await assertInitialOrderStatesAsync(orders, this.exchangeWrapper);
        // Get the token balances before executing `matchOrders()`.
        const _initialTokenBalances = initialTokenBalances
            ? initialTokenBalances
            : await this._initialTokenBalancesPromise;
        // Execute `matchOrders()`
        let actualMatchResults;
        let transactionReceipt;
        if (withMaximalFill) {
            actualMatchResults = await this.exchangeWrapper.getMatchOrdersWithMaximalFillResultsAsync(
                orders.leftOrder,
                orders.rightOrder,
                takerAddress,
                {},
            );
            transactionReceipt = await this._executeMatchOrdersWithMaximalFillAsync(
                orders.leftOrder,
                orders.rightOrder,
                takerAddress,
            );
        } else {
            actualMatchResults = await this.exchangeWrapper.getMatchOrdersResultsAsync(
                orders.leftOrder,
                orders.rightOrder,
                takerAddress,
            );
            transactionReceipt = await this._executeMatchOrdersAsync(orders.leftOrder, orders.rightOrder, takerAddress);
        }
        // Simulate the fill.
        const expectedMatchResults = simulateMatchOrders(
            orders,
            takerAddress,
            _initialTokenBalances,
            toFullMatchTransferAmounts(expectedTransferAmounts),
        );
        const expectedResults = convertToMatchResults(expectedMatchResults);
        expect(actualMatchResults).to.be.eql(expectedResults);
        // Validate the simulation against reality.
        await assertMatchResultsAsync(
            expectedMatchResults,
            transactionReceipt,
            await this.getBalancesAsync(),
            this.exchangeWrapper,
        );
        return expectedMatchResults;
    }

    /**
     * Fetch the current token balances of all known accounts.
     */
    public async getBalancesAsync(): Promise<TokenBalances> {
        return getTokenBalancesAsync(this.erc20Wrapper, this.erc721Wrapper, this.erc1155ProxyWrapper);
    }

    private async _executeBatchMatchOrdersAsync(
        leftOrders: SignedOrder[],
        rightOrders: SignedOrder[],
        takerAddress: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const caller =
            this.batchMatchOrdersCallAsync ||
            (async (_leftOrders: SignedOrder[], _rightOrders: SignedOrder[], _takerAddress: string) =>
                this.exchangeWrapper.batchMatchOrdersAsync(_leftOrders, _rightOrders, _takerAddress));
        return caller(leftOrders, rightOrders, takerAddress);
    }

    private async _executeBatchMatchOrdersWithMaximalFillAsync(
        leftOrders: SignedOrder[],
        rightOrders: SignedOrder[],
        takerAddress: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const caller =
            this.batchMatchOrdersWithMaximalFillCallAsync ||
            (async (_leftOrders: SignedOrder[], _rightOrders: SignedOrder[], _takerAddress: string) =>
                this.exchangeWrapper.batchMatchOrdersWithMaximalFillAsync(_leftOrders, _rightOrders, _takerAddress));
        return caller(leftOrders, rightOrders, takerAddress);
    }

    private async _executeMatchOrdersAsync(
        leftOrder: SignedOrder,
        rightOrder: SignedOrder,
        takerAddress: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const caller =
            this.matchOrdersCallAsync ||
            (async (_leftOrder: SignedOrder, _rightOrder: SignedOrder, _takerAddress: string) =>
                this.exchangeWrapper.matchOrdersAsync(_leftOrder, _rightOrder, _takerAddress));
        return caller(leftOrder, rightOrder, takerAddress);
    }

    private async _executeMatchOrdersWithMaximalFillAsync(
        leftOrder: SignedOrder,
        rightOrder: SignedOrder,
        takerAddress: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const caller =
            this.matchOrdersWithMaximalFillCallAsync ||
            (async (_leftOrder: SignedOrder, _rightOrder: SignedOrder, _takerAddress: string) =>
                this.exchangeWrapper.matchOrdersWithMaximalFillAsync(_leftOrder, _rightOrder, _takerAddress));
        return caller(leftOrder, rightOrder, takerAddress);
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
        leftMakerAssetBoughtByRightMakerAmount:
            partial.leftMakerAssetBoughtByRightMakerAmount ||
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
function simulateBatchMatchOrders(
    orders: BatchMatchedOrders,
    takerAddress: string,
    tokenBalances: TokenBalances,
    matchPairs: Array<[number, number]>,
    transferAmounts: Array<Partial<MatchTransferAmounts>>,
): BatchMatchResults {
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

        // Add the latest match to the batch match results
        batchMatchResults.matches.push(
            simulateMatchOrders(
                matchedOrders,
                takerAddress,
                tokenBalances,
                toFullMatchTransferAmounts(transferAmounts[i]),
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

/**
 * Simulates matching two orders by transferring amounts defined in
 * `transferAmounts` and returns the results.
 * @param orders The orders being matched and their filled states.
 * @param takerAddress Address of taker (the address who matched the two orders)
 * @param tokenBalances Current token balances.
 * @param transferAmounts Amounts to transfer during the simulation.
 * @return The new account balances and fill events that occurred during the match.
 */
function simulateMatchOrders(
    orders: MatchedOrders,
    takerAddress: string,
    tokenBalances: TokenBalances,
    transferAmounts: MatchTransferAmounts,
): MatchResults {
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
        balances: _.cloneDeep(tokenBalances),
    };
    // Right maker asset -> left maker
    transferAsset(
        orders.rightOrder.makerAddress,
        orders.leftOrder.makerAddress,
        transferAmounts.rightMakerAssetBoughtByLeftMakerAmount,
        orders.rightOrder.makerAssetData,
        matchResults,
    );
    if (orders.leftOrder.makerAddress !== orders.leftOrder.feeRecipientAddress) {
        // Left maker fees
        transferAsset(
            orders.leftOrder.makerAddress,
            orders.leftOrder.feeRecipientAddress,
            transferAmounts.leftMakerFeeAssetPaidByLeftMakerAmount,
            orders.leftOrder.makerFeeAssetData,
            matchResults,
        );
    }
    // Left maker asset -> right maker
    transferAsset(
        orders.leftOrder.makerAddress,
        orders.rightOrder.makerAddress,
        transferAmounts.leftMakerAssetBoughtByRightMakerAmount,
        orders.leftOrder.makerAssetData,
        matchResults,
    );
    if (orders.rightOrder.makerAddress !== orders.rightOrder.feeRecipientAddress) {
        // Right maker fees
        transferAsset(
            orders.rightOrder.makerAddress,
            orders.rightOrder.feeRecipientAddress,
            transferAmounts.rightMakerFeeAssetPaidByRightMakerAmount,
            orders.rightOrder.makerFeeAssetData,
            matchResults,
        );
    }
    // Left taker profit
    transferAsset(
        orders.leftOrder.makerAddress,
        takerAddress,
        transferAmounts.leftMakerAssetReceivedByTakerAmount,
        orders.leftOrder.makerAssetData,
        matchResults,
    );
    // Right taker profit
    transferAsset(
        orders.rightOrder.makerAddress,
        takerAddress,
        transferAmounts.rightMakerAssetReceivedByTakerAmount,
        orders.rightOrder.makerAssetData,
        matchResults,
    );
    // Left taker fees
    transferAsset(
        takerAddress,
        orders.leftOrder.feeRecipientAddress,
        transferAmounts.leftTakerFeeAssetPaidByTakerAmount,
        orders.leftOrder.takerFeeAssetData,
        matchResults,
    );
    // Right taker fees
    transferAsset(
        takerAddress,
        orders.rightOrder.feeRecipientAddress,
        transferAmounts.rightTakerFeeAssetPaidByTakerAmount,
        orders.rightOrder.takerFeeAssetData,
        matchResults,
    );

    return matchResults;
}

/**
 * Simulates a transfer of assets from `fromAddress` to `toAddress`
 *       by updating `matchResults`.
 */
function transferAsset(
    fromAddress: string,
    toAddress: string,
    amount: BigNumber,
    assetData: string,
    matchResults: MatchResults,
): void {
    const assetProxyId = assetDataUtils.decodeAssetProxyId(assetData);
    switch (assetProxyId) {
        case AssetProxyId.ERC20: {
            const erc20AssetData = assetDataUtils.decodeERC20AssetData(assetData);
            const assetAddress = erc20AssetData.tokenAddress;
            const fromBalances = matchResults.balances.erc20[fromAddress];
            const toBalances = matchResults.balances.erc20[toAddress];
            fromBalances[assetAddress] = fromBalances[assetAddress].minus(amount);
            toBalances[assetAddress] = toBalances[assetAddress].plus(amount);
            break;
        }
        case AssetProxyId.ERC721: {
            const erc721AssetData = assetDataUtils.decodeERC721AssetData(assetData);
            const assetAddress = erc721AssetData.tokenAddress;
            const tokenId = erc721AssetData.tokenId;
            const fromTokens = matchResults.balances.erc721[fromAddress][assetAddress];
            const toTokens = matchResults.balances.erc721[toAddress][assetAddress];
            if (amount.gte(1)) {
                const tokenIndex = _.findIndex(fromTokens, t => t.eq(tokenId));
                if (tokenIndex !== -1) {
                    fromTokens.splice(tokenIndex, 1);
                    toTokens.push(tokenId);
                }
            }
            break;
        }
        case AssetProxyId.ERC1155: {
            const erc1155AssetData = assetDataUtils.decodeERC1155AssetData(assetData);
            const assetAddress = erc1155AssetData.tokenAddress;
            const fromBalances = matchResults.balances.erc1155[fromAddress][assetAddress];
            const toBalances = matchResults.balances.erc1155[toAddress][assetAddress];
            for (const i of _.times(erc1155AssetData.tokenIds.length)) {
                const tokenId = erc1155AssetData.tokenIds[i];
                const tokenValue = erc1155AssetData.tokenValues[i];
                const tokenAmount = amount.times(tokenValue);
                if (tokenAmount.gt(0)) {
                    const tokenIndex = _.findIndex(fromBalances.nonFungible, t => t.eq(tokenId));
                    if (tokenIndex !== -1) {
                        // Transfer a non-fungible.
                        fromBalances.nonFungible.splice(tokenIndex, 1);
                        toBalances.nonFungible.push(tokenId);
                    } else {
                        // Transfer a fungible.
                        const _tokenId = tokenId.toString(10);
                        fromBalances.fungible[_tokenId] = fromBalances.fungible[_tokenId].minus(tokenAmount);
                        toBalances.fungible[_tokenId] = toBalances.fungible[_tokenId].plus(tokenAmount);
                    }
                }
            }
            break;
        }
        case AssetProxyId.MultiAsset: {
            const multiAssetData = assetDataUtils.decodeMultiAssetData(assetData);
            for (const i of _.times(multiAssetData.amounts.length)) {
                const nestedAmount = amount.times(multiAssetData.amounts[i]);
                const nestedAssetData = multiAssetData.nestedAssetData[i];
                transferAsset(fromAddress, toAddress, nestedAmount, nestedAssetData, matchResults);
            }
            break;
        }
        default:
            throw new Error(`Unhandled asset proxy ID: ${assetProxyId}`);
    }
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
    actualTokenBalances: TokenBalances,
    initialTokenBalances: TokenBalances,
    exchangeWrapper: ExchangeWrapper,
): Promise<void> {
    // Ensure that the batchMatchResults contain at least one match
    expect(batchMatchResults.matches.length).to.be.gt(0);
    // Check the fill events.
    assertFillEvents(
        batchMatchResults.matches.map(match => match.fills).reduce((total, fills) => total.concat(fills)),
        transactionReceipt,
    );
    // Check the token balances.
    const newBalances = getUpdatedBalances(batchMatchResults, initialTokenBalances);
    assertBalances(newBalances, actualTokenBalances);
    // Check the Exchange state.
    await assertPostBatchExchangeStateAsync(batchMatchResults, exchangeWrapper);
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
    actualTokenBalances: TokenBalances,
    exchangeWrapper: ExchangeWrapper,
): Promise<void> {
    // Check the fill events.
    assertFillEvents(matchResults.fills, transactionReceipt);
    // Check the token balances.
    assertBalances(matchResults.balances, actualTokenBalances);
    // Check the Exchange state.
    await assertPostExchangeStateAsync(matchResults, exchangeWrapper);
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
    }));
}

/**
 * Asserts that all expected token holdings match the actual holdings.
 * @param expectedBalances Expected balances.
 * @param actualBalances Actual balances.
 */
function assertBalances(expectedBalances: TokenBalances, actualBalances: TokenBalances): void {
    expect(encodeTokenBalances(actualBalances)).to.deep.equal(encodeTokenBalances(expectedBalances));
}

/**
 * Asserts the initial exchange state for batch matched orders.
 * @param orders Batch matched orders with intial filled amounts.
 * @param exchangeWrapper ExchangeWrapper instance.
 */
async function assertBatchOrderStatesAsync(
    orders: BatchMatchedOrders,
    exchangeWrapper: ExchangeWrapper,
): Promise<void> {
    for (let i = 0; i < orders.leftOrders.length; i++) {
        await assertOrderFilledAmountAsync(
            orders.leftOrders[i],
            orders.leftOrdersTakerAssetFilledAmounts[i],
            'left',
            exchangeWrapper,
        );
    }
    for (let i = 0; i < orders.rightOrders.length; i++) {
        await assertOrderFilledAmountAsync(
            orders.rightOrders[i],
            orders.rightOrdersTakerAssetFilledAmounts[i],
            'right',
            exchangeWrapper,
        );
    }
}

/**
 * Asserts the initial exchange state for matched orders.
 * @param orders Matched orders with intial filled amounts.
 * @param exchangeWrapper ExchangeWrapper instance.
 */
async function assertInitialOrderStatesAsync(orders: MatchedOrders, exchangeWrapper: ExchangeWrapper): Promise<void> {
    const pairs = [
        [orders.leftOrder, orders.leftOrderTakerAssetFilledAmount || ZERO],
        [orders.rightOrder, orders.rightOrderTakerAssetFilledAmount || ZERO],
    ] as Array<[SignedOrder, BigNumber]>;
    await Promise.all(
        pairs.map(async ([order, expectedFilledAmount]) => {
            const side = order === orders.leftOrder ? 'left' : 'right';
            await assertOrderFilledAmountAsync(order, expectedFilledAmount, side, exchangeWrapper);
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
    exchangeWrapper: ExchangeWrapper,
): Promise<void> {
    await assertTriplesExchangeStateAsync(batchMatchResults.filledAmounts, exchangeWrapper);
}

/**
 * Asserts the exchange state after a call to `matchOrders()`.
 * @param matchResults Results from a call to `simulateMatchOrders()`.
 * @param exchangeWrapper The ExchangeWrapper instance.
 */
async function assertPostExchangeStateAsync(
    matchResults: MatchResults,
    exchangeWrapper: ExchangeWrapper,
): Promise<void> {
    const triples = [
        [matchResults.orders.leftOrder, matchResults.orders.leftOrderTakerAssetFilledAmount, 'left'],
        [matchResults.orders.rightOrder, matchResults.orders.rightOrderTakerAssetFilledAmount, 'right'],
    ] as Array<[SignedOrder, BigNumber, string]>;
    await assertTriplesExchangeStateAsync(triples, exchangeWrapper);
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
    exchangeWrapper: ExchangeWrapper,
): Promise<void> {
    await Promise.all(
        triples.map(async ([order, expectedFilledAmount, side]) => {
            expect(['left', 'right']).to.include(side);
            await assertOrderFilledAmountAsync(order, expectedFilledAmount, side, exchangeWrapper);
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
 * @param exchangeWrapper The ExchangeWrapper instance.
 */
async function assertOrderFilledAmountAsync(
    order: SignedOrder,
    expectedFilledAmount: BigNumber,
    side: string,
    exchangeWrapper: ExchangeWrapper,
): Promise<void> {
    const orderInfo = await exchangeWrapper.getOrderInfoAsync(order);
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
 * Retrieve the current token balances of all known addresses.
 * @param erc20Wrapper The ERC20Wrapper instance.
 * @param erc721Wrapper The ERC721Wrapper instance.
 * @param erc1155Wrapper The ERC1155ProxyWrapper instance.
 * @return A promise that resolves to a `TokenBalances`.
 */
export async function getTokenBalancesAsync(
    erc20Wrapper: ERC20Wrapper,
    erc721Wrapper: ERC721Wrapper,
    erc1155ProxyWrapper: ERC1155ProxyWrapper,
): Promise<TokenBalances> {
    const [erc20, erc721, erc1155] = await Promise.all([
        erc20Wrapper.getBalancesAsync(),
        erc721Wrapper.getBalancesAsync(),
        erc1155ProxyWrapper.getBalancesAsync(),
    ]);
    return {
        erc20,
        erc721,
        erc1155: transformERC1155Holdings(erc1155),
    };
}

/**
 * Restructures `ERC1155HoldingsByOwner` to be compatible with `TokenBalances.erc1155`.
 * @param erc1155HoldingsByOwner Holdings returned by `ERC1155ProxyWrapper.getBalancesAsync()`.
 */
function transformERC1155Holdings(erc1155HoldingsByOwner: ERC1155HoldingsByOwner): ERC1155Holdings {
    const result = {};
    for (const owner of _.keys(erc1155HoldingsByOwner.fungible)) {
        for (const contract of _.keys(erc1155HoldingsByOwner.fungible[owner])) {
            _.set(result as any, [owner, contract, 'fungible'], erc1155HoldingsByOwner.fungible[owner][contract]);
        }
    }
    for (const owner of _.keys(erc1155HoldingsByOwner.nonFungible)) {
        for (const contract of _.keys(erc1155HoldingsByOwner.nonFungible[owner])) {
            const tokenIds = _.flatten(_.values(erc1155HoldingsByOwner.nonFungible[owner][contract]));
            _.set(result as any, [owner, contract, 'nonFungible'], _.uniqBy(tokenIds, v => v.toString(10)));
        }
    }
    return result;
}

function encodeTokenBalances(obj: any): any {
    if (!_.isPlainObject(obj)) {
        if (BigNumber.isBigNumber(obj)) {
            return obj.toString(10);
        }
        if (_.isArray(obj)) {
            return _.sortBy(obj, v => encodeTokenBalances(v));
        }
        return obj;
    }
    const keys = _.keys(obj).sort();
    return _.zip(keys, keys.map(k => encodeTokenBalances(obj[k])));
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
 * Get the token balances
 * @param batchMatchResults The results of a batch order match
 * @return The token balances results from after the batch
 */
function getUpdatedBalances(batchMatchResults: BatchMatchResults, initialTokenBalances: TokenBalances): TokenBalances {
    return batchMatchResults.matches
        .map(match => match.balances)
        .reduce((totalBalances, balances) => aggregateBalances(totalBalances, balances, initialTokenBalances));
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
}

/**
 * Takes a `totalBalances`, a `balances`, and an `initialBalances`, subtracts the `initialBalances
 * from the `balances`, and then adds the result to `totalBalances`.
 * @param totalBalances A set of balances to be updated with new results.
 * @param balances A new set of results that deviate from the `initialBalances` by one matched
 *                 order. Subtracting away the `initialBalances` leaves behind a diff of the
 *                 matched orders effect on the `initialBalances`.
 * @param initialBalances The token balances from before the call to `batchMatchOrders()`.
 * @return The updated total balances using the derived balance difference.
 */
function aggregateBalances(
    totalBalances: TokenBalances,
    balances: TokenBalances,
    initialBalances: TokenBalances,
): TokenBalances {
    // ERC20
    for (const owner of _.keys(totalBalances.erc20)) {
        for (const contract of _.keys(totalBalances.erc20[owner])) {
            const difference = balances.erc20[owner][contract].minus(initialBalances.erc20[owner][contract]);
            totalBalances.erc20[owner][contract] = totalBalances.erc20[owner][contract].plus(difference);
        }
    }
    // ERC721
    for (const owner of _.keys(totalBalances.erc721)) {
        for (const contract of _.keys(totalBalances.erc721[owner])) {
            totalBalances.erc721[owner][contract] = _.zipWith(
                totalBalances.erc721[owner][contract],
                balances.erc721[owner][contract],
                initialBalances.erc721[owner][contract],
                (a: BigNumber, b: BigNumber, c: BigNumber) => a.plus(b.minus(c)),
            );
        }
    }
    // ERC1155
    for (const owner of _.keys(totalBalances.erc1155)) {
        for (const contract of _.keys(totalBalances.erc1155[owner])) {
            // Fungible
            for (const tokenId of _.keys(totalBalances.erc1155[owner][contract].fungible)) {
                const difference = balances.erc1155[owner][contract].fungible[tokenId].minus(
                    initialBalances.erc1155[owner][contract].fungible[tokenId],
                );
                totalBalances.erc1155[owner][contract].fungible[tokenId] = totalBalances.erc1155[owner][
                    contract
                ].fungible[tokenId].plus(difference);
            }

            // Nonfungible
            let isDuplicate = false;
            for (const value of balances.erc1155[owner][contract].nonFungible) {
                // If the value is in the initial balances or the total balances, skip the
                // value since it will already be added.
                for (const val of totalBalances.erc1155[owner][contract].nonFungible) {
                    if (value.isEqualTo(val)) {
                        isDuplicate = true;
                    }
                }

                if (!isDuplicate) {
                    for (const val of initialBalances.erc1155[owner][contract].nonFungible) {
                        if (value.isEqualTo(val)) {
                            isDuplicate = true;
                        }
                    }
                }

                if (!isDuplicate) {
                    totalBalances.erc1155[owner][contract].nonFungible.push(value);
                }
                isDuplicate = false;
            }
        }
    }
    return totalBalances;
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
            protocolFeePaid: constants.ZERO_AMOUNT,
        },
        right: {
            makerAssetFilledAmount: result.fills[1].makerAssetFilledAmount,
            takerAssetFilledAmount: result.fills[1].takerAssetFilledAmount,
            makerFeePaid: result.fills[1].makerFeePaid,
            takerFeePaid: result.fills[1].takerFeePaid,
            protocolFeePaid: constants.ZERO_AMOUNT,
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
        protocolFeePaid: constants.ZERO_AMOUNT,
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
        makerAssetFilledAmount: new BigNumber(0),
        takerAssetFilledAmount: new BigNumber(0),
        makerFeePaid: new BigNumber(0),
        takerFeePaid: new BigNumber(0),
    };
    return empty;
}
// tslint:disable-line:max-file-line-count
