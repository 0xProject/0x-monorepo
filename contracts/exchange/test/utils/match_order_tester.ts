import { ERC20Wrapper, ERC721Wrapper } from '@0x/contracts-asset-proxy';
import {
    chaiSetup,
    OrderStatus,
    TokenBalancesByOwner,
} from '@0x/contracts-test-utils';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { AssetProxyId, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import {
    LogWithDecodedArgs,
    TransactionReceiptWithDecodedLogs,
} from 'ethereum-types';
import * as _ from 'lodash';

import { ExchangeWrapper } from './exchange_wrapper';

const ZERO = new BigNumber(0);

chaiSetup.configure();
const expect = chai.expect;

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
    leftMakerAssetReceivedByRightMakerAmount: BigNumber;
    rightMakerAssetReceivedByLeftMakerAmount: BigNumber;
    leftMakerFeeAssetPaidByLeftMakerAmount: BigNumber;
    rightMakerFeeAssetPaidByRightMakerAmount: BigNumber;
    leftMakerAssetReceivedByTakerAmount: BigNumber;
    rightMakerAssetReceivedByTakerAmount: BigNumber;
    leftTakerFeeAssetPaidByTakerAmount: BigNumber;
    rightTakerFeeAssetPaidByTakerAmount: BigNumber;
}

export interface MatchResults {
    orders: MatchedOrders;
    fills: FillEventArgs[];
    balances: TokenBalancesByOwner;
}

export interface MatchedOrders {
    leftOrder: SignedOrder;
    rightOrder: SignedOrder;
    leftOrderTakerAssetFilledAmount?: BigNumber;
    rightOrderTakerAssetFilledAmount?: BigNumber;
}

export type MatchOrdersAsyncCall =
    (leftOrder: SignedOrder, rightOrder: SignedOrder, takerAddress: string)
    => Promise<TransactionReceiptWithDecodedLogs>;

export class MatchOrderTester {
    public exchangeWrapper: ExchangeWrapper;
    public erc20Wrapper: ERC20Wrapper;
    public erc721Wrapper: ERC721Wrapper;
    public matchOrdersCallAsync?: MatchOrdersAsyncCall;

    /**
     * @dev Constructs new MatchOrderTester.
     * @param exchangeWrapper Used to call to the Exchange.
     * @param erc20Wrapper Used to fetch ERC20 balances.
     * @param erc721Wrapper Used to fetch ERC721 token owners.
     * @param matchOrdersCallAsync Optional, custom caller for
     *                             `ExchangeWrapper.matchOrdersAsync()`.
     */
    constructor(
        exchangeWrapper: ExchangeWrapper,
        erc20Wrapper: ERC20Wrapper,
        erc721Wrapper: ERC721Wrapper,
        matchOrdersCallAsync?: MatchOrdersAsyncCall,
    ) {
        this.exchangeWrapper = exchangeWrapper;
        this.erc20Wrapper = erc20Wrapper;
        this.erc721Wrapper = erc721Wrapper;
        this.matchOrdersCallAsync = matchOrdersCallAsync;
    }

    /**
     * @dev Matches two complementary orders and asserts results.
     * @param orders The matched orders and filled states.
     * @param takerAddress Address of taker (the address who matched the two orders)
     * @param expectedTransferAmounts Expected amounts transferred as a result of order matching.
     * @return Results of `matchOrders()`.
     */
    public async matchOrdersAndAssertEffectsAsync(
        orders: MatchedOrders,
        takerAddress: string,
        expectedTransferAmounts: Partial<MatchTransferAmounts>,
    ): Promise<MatchResults> {
        await assertInitialOrderStatesAsync(orders, this.exchangeWrapper);
        // Get the token balances before executing `matchOrders()`.
        const initialTokenBalances = await this._getBalancesAsync();
        // Execute `matchOrders()`
        const transactionReceipt = await this._executeMatchOrdersAsync(
            orders.leftOrder,
            orders.rightOrder,
            takerAddress,
        );
        // Simulate the fill.
        const matchResults = simulateMatchOrders(
            orders,
            takerAddress,
            initialTokenBalances,
            toFullMatchTransferAmounts(expectedTransferAmounts),
        );
        // Validate the simulation against realit.
        await assertMatchResultsAsync(
            matchResults,
            transactionReceipt,
            await this._getBalancesAsync(),
            this.exchangeWrapper,
        );
        return matchResults;
    }

    /**
     * @dev Fetch the current token balances of all known accounts.
     */
    private async _getBalancesAsync(): Promise<TokenBalancesByOwner> {
        const [ erc20, erc721 ] = await Promise.all([
            this.erc20Wrapper.getBalancesAsync(),
            this.erc721Wrapper.getBalancesAsync(),
        ]);
        return {
            erc20,
            erc721,
        };
    }

    private async _executeMatchOrdersAsync(
        leftOrder: SignedOrder,
        rightOrder: SignedOrder,
        takerAddress: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const caller = this.matchOrdersCallAsync ||
            ((_leftOrder: SignedOrder, _rightOrder: SignedOrder, _takerAddress: string) =>
                this.exchangeWrapper.matchOrdersAsync(
                    _leftOrder,
                    _rightOrder,
                    _takerAddress,
                )
            );
        return caller(leftOrder, rightOrder, takerAddress);
    }
}

/**
 * @dev Converts a `Partial<MatchTransferAmounts>` to a `MatchTransferAmounts` by
 *      filling in missing fields with zero.
 */
function toFullMatchTransferAmounts(
    partial: Partial<MatchTransferAmounts>,
): MatchTransferAmounts {
    return {
        leftMakerAssetReceivedByRightMakerAmount: partial.leftMakerAssetReceivedByRightMakerAmount || ZERO,
        rightMakerAssetReceivedByLeftMakerAmount: partial.rightMakerAssetReceivedByLeftMakerAmount || ZERO,
        leftMakerFeeAssetPaidByLeftMakerAmount: partial.leftMakerFeeAssetPaidByLeftMakerAmount || ZERO,
        rightMakerFeeAssetPaidByRightMakerAmount: partial.rightMakerFeeAssetPaidByRightMakerAmount || ZERO,
        leftMakerAssetReceivedByTakerAmount: partial.leftMakerAssetReceivedByTakerAmount || ZERO,
        rightMakerAssetReceivedByTakerAmount: partial.rightMakerAssetReceivedByTakerAmount || ZERO,
        leftTakerFeeAssetPaidByTakerAmount: partial.leftTakerFeeAssetPaidByTakerAmount || ZERO,
        rightTakerFeeAssetPaidByTakerAmount: partial.rightTakerFeeAssetPaidByTakerAmount || ZERO,
    };
 }

/**
 * @dev Simulates matching two orders by transferring amounts defined in
 *      `transferAmounts` and returns the results.
 * @param orders The orders being matched and their filled states.
 * @param takerAddress Address of taker (the address who matched the two orders)
 * @param tokenBalances Current token balances.
 * @param transferAmounts Amounts to transfer during the simulation.
 * @return The new account balances and fill events that occurred during the match.
 */
function simulateMatchOrders(
    orders: MatchedOrders,
    takerAddress: string,
    tokenBalances: TokenBalancesByOwner,
    transferAmounts: MatchTransferAmounts,
): MatchResults {
    const matchResults = {
        orders: {
            leftOrder: orders.leftOrder,
            leftOrderTakerAssetFilledAmount:
                (orders.leftOrderTakerAssetFilledAmount || ZERO).plus(
                    transferAmounts.rightMakerAssetReceivedByLeftMakerAmount,
                ),
            rightOrder: orders.rightOrder,
            rightOrderTakerAssetFilledAmount:
                (orders.rightOrderTakerAssetFilledAmount || ZERO).plus(
                    transferAmounts.leftMakerAssetReceivedByRightMakerAmount,
                ),
        },
        fills: simulateFillEvents(orders, takerAddress, transferAmounts),
        balances: _.cloneDeep(tokenBalances),
    };
    // Left maker asset -> right maker
    transferAsset(
        orders.leftOrder.makerAddress,
        orders.rightOrder.makerAddress,
        transferAmounts.leftMakerAssetReceivedByRightMakerAmount,
        orders.leftOrder.makerAssetData,
        matchResults,
    );
    // Right maker asset -> left maker
    transferAsset(
        orders.rightOrder.makerAddress,
        orders.leftOrder.makerAddress,
        transferAmounts.rightMakerAssetReceivedByLeftMakerAmount,
        orders.rightOrder.makerAssetData,
        matchResults,
    );
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
    // Left maker fees
    transferAsset(
        orders.leftOrder.makerAddress,
        orders.leftOrder.feeRecipientAddress,
        transferAmounts.leftMakerFeeAssetPaidByLeftMakerAmount,
        orders.leftOrder.makerFeeAssetData,
        matchResults,
    );
    // Right maker fees
    transferAsset(
        orders.rightOrder.makerAddress,
        orders.rightOrder.feeRecipientAddress,
        transferAmounts.rightMakerFeeAssetPaidByRightMakerAmount,
        orders.rightOrder.makerFeeAssetData,
        matchResults,
    );
    // Taker fees.
    if (orders.leftOrder.feeRecipientAddress === orders.rightOrder.feeRecipientAddress &&
        orders.leftOrder.takerFeeAssetData === orders.rightOrder.takerFeeAssetData) {
        // Same asset data and recipients, so combine into a single transfer.
        const totalTakerFeeAssetPaidByTakerAmount =
            transferAmounts.leftTakerFeeAssetPaidByTakerAmount.plus(
                transferAmounts.rightTakerFeeAssetPaidByTakerAmount,
            );
        transferAsset(
            takerAddress,
            orders.leftOrder.feeRecipientAddress,
            totalTakerFeeAssetPaidByTakerAmount,
            orders.leftOrder.takerFeeAssetData,
            matchResults,
        );
    } else {
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
    }
    return matchResults;
}

/**
 * @dev Simulates a transfer of assets from `fromAddress` to `toAddress`
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
            _.remove(fromTokens, tokenId);
            toTokens.push(tokenId);
            break;
        }
        default:
            throw new Error(`Unhandled asset proxy ID: ${assetProxyId}`);
    }
}

/**
 * @dev Checks that the results of `simulateMatchOrders()` agrees with reality.
 * @param matchResults The results of a `simulateMatchOrders()`.
 * @param transactionReceipt The transaction receipt of a call to `matchOrders()`.
 * @param actualTokenBalances The actual, on-chain token balances of known addresses.
 * @param exchangeWrapper The ExchangeWrapper instance.
 */
async function assertMatchResultsAsync(
    matchResults: MatchResults,
    transactionReceipt: TransactionReceiptWithDecodedLogs,
    actualTokenBalances: TokenBalancesByOwner,
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
 * @dev Checks values from the logs produced by Exchange.matchOrders against
 *      the expected transfer amounts.
 * @param orders The matched orders.
 * @param takerAddress Address of taker (account that called Exchange.matchOrders)
 * @param transactionReceipt Transaction receipt and logs produced by Exchange.matchOrders.
 * @param expectedTransferAmounts Expected amounts transferred as a result of order matching.
 */
function assertFillEvents(
    expectedFills: FillEventArgs[],
    transactionReceipt: TransactionReceiptWithDecodedLogs,
): void {
    // Extract the actual `Fill` events.
    const actualFills = extractFillEventsfromReceipt(transactionReceipt);
    expect(actualFills.length, 'wrong number of Fill events').to.be.equal(expectedFills.length);
    // Validate event arguments.
    const fillPairs = _.zip(expectedFills, actualFills) as Array<[FillEventArgs, FillEventArgs]>;
    for (const [expected, actual] of fillPairs) {
        expect(actual.orderHash, 'Fill event: orderHash').to.equal(expected.orderHash);
        expect(actual.makerAddress, 'Fill event: makerAddress').to.equal(expected.makerAddress);
        expect(actual.takerAddress, 'Fill event: takerAddress').to.equal(expected.takerAddress);
        expect(actual.makerAssetFilledAmount, 'Fill event: makerAssetFilledAmount').to.equal(expected.makerAssetFilledAmount);
        expect(actual.takerAssetFilledAmount, 'Fill event: takerAssetFilledAmount').to.equal(expected.takerAssetFilledAmount);
        expect(actual.makerFeePaid, 'Fill event: makerFeePaid').to.equal(expected.makerFeePaid);
        expect(actual.takerFeePaid, 'Fill event: takerFeePaid').to.equal(expected.takerFeePaid);
    }
}

/**
 *  @dev Create a pair of `Fill` events for a simulated `matchOrder()`.
 */
function simulateFillEvents(
    orders: MatchedOrders,
    takerAddress: string,
    transferAmounts: MatchTransferAmounts,
): [FillEventArgs, FillEventArgs] {
    return [
        // Left order Fill
        {
            orderHash: orderHashUtils.getOrderHashHex(orders.leftOrder),
            makerAddress: orders.leftOrder.makerAddress,
            takerAddress,
            makerAssetFilledAmount: transferAmounts.leftMakerAssetReceivedByRightMakerAmount,
            takerAssetFilledAmount: transferAmounts.rightMakerAssetReceivedByLeftMakerAmount,
            makerFeePaid: transferAmounts.leftMakerFeeAssetPaidByLeftMakerAmount,
            takerFeePaid: transferAmounts.leftTakerFeeAssetPaidByTakerAmount,
        },
        // Right order Fill
        {
            orderHash: orderHashUtils.getOrderHashHex(orders.rightOrder),
            makerAddress: orders.rightOrder.makerAddress,
            takerAddress,
            makerAssetFilledAmount: transferAmounts.rightMakerAssetReceivedByLeftMakerAmount,
            takerAssetFilledAmount: transferAmounts.leftMakerAssetReceivedByRightMakerAmount,
            makerFeePaid: transferAmounts.rightMakerFeeAssetPaidByRightMakerAmount,
            takerFeePaid: transferAmounts.rightTakerFeeAssetPaidByTakerAmount,
        },
    ];
}

/**
 * @dev Extract `Fill` events from a transaction receipt.
 */
function extractFillEventsfromReceipt(
    receipt: TransactionReceiptWithDecodedLogs,
): FillEventArgs[] {
    interface RawFillEventArgs {
        orderHash: string;
        makerAddress: string;
        takerAddress: string;
        makerAssetFilledAmount: string;
        takerAssetFilledAmount: string;
        makerFeePaid: string;
        takerFeePaid: string;
    }
    const actualFills =
        _.filter(receipt.logs, ['event', 'Fill']) as any as Array<LogWithDecodedArgs<RawFillEventArgs>>;
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
 * @dev Asserts that all expected token holdings match the actual holdings.
 * @param expectedBalances Expected balances.
 * @param actualBalances Actual balances.
 */
function assertBalances(
    expectedBalances: TokenBalancesByOwner,
    actualBalances: TokenBalancesByOwner,
): void {
    // ERC20 Balances
    expect(actualBalances.erc20, 'ERC20 balances').to.deep.equal(expectedBalances.erc20);
    // ERC721 Token Ids
    const sortedExpectedERC721Balances = _.mapValues(
        expectedBalances.erc721,
        tokenIdsByOwner => {
            _.mapValues(tokenIdsByOwner, tokenIds => {
                _.sortBy(tokenIds);
            });
        },
    );
    const sortedActualERC721Balances = _.mapValues(
        actualBalances.erc721,
        tokenIdsByOwner => {
            _.mapValues(tokenIdsByOwner, tokenIds => {
                _.sortBy(tokenIds);
            });
        },
    );
    expect(sortedExpectedERC721Balances, 'ERC721 balances').to.deep.equal(sortedActualERC721Balances);
}

/**
 * @dev Asserts initial exchange state for matched orders.
 * @param orders Matched orders with intial filled amounts.
 * @param exchangeWrapper ExchangeWrapper isntance.
 */
async function assertInitialOrderStatesAsync(
    orders: MatchedOrders,
    exchangeWrapper: ExchangeWrapper,
): Promise<void> {
    const pairs = [
        [ orders.leftOrder, orders.leftOrderTakerAssetFilledAmount || ZERO ],
        [ orders.rightOrder, orders.rightOrderTakerAssetFilledAmount || ZERO ],
    ] as Array<[SignedOrder, BigNumber]>;
    await Promise.all(pairs.map(async ([ order, expectedFilledAmount ]) => {
        const side = order === orders.leftOrder ? 'left' : 'right';
        const orderHash = orderHashUtils.getOrderHashHex(order);
        const actualFilledAmount = await exchangeWrapper.getTakerAssetFilledAmountAsync(
            orderHash,
        );
        expect(actualFilledAmount, `${side} order initial filled amount`)
            .to.bignumber.equal(expectedFilledAmount);
    }));
}

/**
 * @dev Asserts the exchange state after a call to `matchOrders()`.
 * @param matchResults Results from a call to `simulateMatchOrders()`.
 * @param exchangeWrapper The ExchangeWrapper instance.
 */
async function assertPostExchangeStateAsync(
    matchResults: MatchResults,
    exchangeWrapper: ExchangeWrapper,
): Promise<void> {
    const pairs = [
        [ matchResults.orders.leftOrder, matchResults.orders.leftOrderTakerAssetFilledAmount ],
        [ matchResults.orders.rightOrder, matchResults.orders.rightOrderTakerAssetFilledAmount ],
    ] as Array<[SignedOrder, BigNumber]>;
    await Promise.all(pairs.map(async ([ order, expectedFilledAmount ]) => {
        const side = order === matchResults.orders.leftOrder ? 'left' : 'right';
        const orderHash = orderHashUtils.getOrderHashHex(order);
        // Check filled amount of order.
        const actualFilledAmount = await exchangeWrapper.getTakerAssetFilledAmountAsync(
            orderHash,
        );
        expect(actualFilledAmount, `${side} order final filled amount`)
            .to.be.bignumber.equal(expectedFilledAmount);
        // Check status of order.
        const expectedStatus =
            expectedFilledAmount.isGreaterThanOrEqualTo(order.takerAssetAmount) ?
            OrderStatus.FullyFilled : OrderStatus.Fillable;
        const actualStatus = (await exchangeWrapper.getOrderInfoAsync(order)).orderStatus;
        expect(actualStatus, `${side} order final status`).to.equal(expectedStatus);
    }));
}

// tslint:disable-line:max-file-line-count
