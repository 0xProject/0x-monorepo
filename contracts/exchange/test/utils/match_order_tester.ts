import { ERC1155ProxyWrapper, ERC20Wrapper, ERC721Wrapper } from '@0x/contracts-asset-proxy';
import { chaiSetup, ERC1155HoldingsByOwner, OrderStatus } from '@0x/contracts-test-utils';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { AssetProxyId, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { ExchangeWrapper } from './exchange_wrapper';

const ZERO = new BigNumber(0);

chaiSetup.configure();
const expect = chai.expect;

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
    public matchOrdersCallAsync?: MatchOrdersAsyncCall;
    private readonly _initialTokenBalancesPromise: Promise<TokenBalances>;

    /**
     * Constructs new MatchOrderTester.
     * @param exchangeWrapper Used to call to the Exchange.
     * @param erc20Wrapper Used to fetch ERC20 balances.
     * @param erc721Wrapper Used to fetch ERC721 token owners.
     * @param erc1155Wrapper Used to fetch ERC1155 token owners.
     * @param matchOrdersCallAsync Optional, custom caller for
     *                             `ExchangeWrapper.matchOrdersAsync()`.
     */
    constructor(
        exchangeWrapper: ExchangeWrapper,
        erc20Wrapper: ERC20Wrapper,
        erc721Wrapper: ERC721Wrapper,
        erc1155ProxyWrapper: ERC1155ProxyWrapper,
        matchOrdersCallAsync?: MatchOrdersAsyncCall,
    ) {
        this.exchangeWrapper = exchangeWrapper;
        this.erc20Wrapper = erc20Wrapper;
        this.erc721Wrapper = erc721Wrapper;
        this.erc1155ProxyWrapper = erc1155ProxyWrapper;
        this.matchOrdersCallAsync = matchOrdersCallAsync;
        this._initialTokenBalancesPromise = this.getBalancesAsync();
    }

    /**
     * FIXME What parameters are necessary?
     */
    public async batchMatchOrdersAndAssertEffectsAsync(
        orders: BatchMatchedOrders,
        takerAddress: string,
        matchPairs: [number, number][],
        expectedTransferAmounts: Partial<MatchTransferAmounts>[],
        initialTokenBalances?: TokenBalances,
    ): Promise<BatchMatchResults> {
        await assertBatchOrderStatesAsync(orders, this.exchangeWrapper);
        return {
            matches: [],
        };
    }

    /**
     * Matches two complementary orders and asserts results.
     * @param orders The matched orders and filled states.
     * @param takerAddress Address of taker (the address who matched the two orders)
     * @param expectedTransferAmounts Expected amounts transferred as a result of order matching.
     *                                Omitted fields are either set to 0 or their complementary
     *                                field.
     * @return Results of `matchOrders()`.
     */
    public async matchOrdersAndAssertEffectsAsync(
        orders: MatchedOrders,
        takerAddress: string,
        expectedTransferAmounts: Partial<MatchTransferAmounts>,
        initialTokenBalances?: TokenBalances,
    ): Promise<MatchResults> {
        await assertInitialOrderStatesAsync(orders, this.exchangeWrapper);
        // Get the token balances before executing `matchOrders()`.
        const _initialTokenBalances = initialTokenBalances
            ? initialTokenBalances
            : await this._initialTokenBalancesPromise;
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
            _initialTokenBalances,
            toFullMatchTransferAmounts(expectedTransferAmounts),
        );
        // Validate the simulation against realit.
        await assertMatchResultsAsync(
            matchResults,
            transactionReceipt,
            await this.getBalancesAsync(),
            this.exchangeWrapper,
        );
        return matchResults;
    }

    /**
     * Fetch the current token balances of all known accounts.
     */
    public async getBalancesAsync(): Promise<TokenBalances> {
        return getTokenBalancesAsync(this.erc20Wrapper, this.erc721Wrapper, this.erc1155ProxyWrapper);
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
    expect(encodeTokenBalances(expectedBalances)).to.deep.equal(encodeTokenBalances(actualBalances));
}

/**
 * FIXME: Update these comments
 * Asserts initial exchange state for matched orders.
 * @param orders Matched orders with intial filled amounts.
 * @param exchangeWrapper ExchangeWrapper isntance.
 */
async function assertBatchOrderStatesAsync(orders: BatchMatchedOrders, exchangeWrapper: ExchangeWrapper): Promise<void> {
    for (let i = 0; i < orders.leftOrders.length; i++) {
        assertOrderStateAsync(orders.leftOrders[i], orders.leftOrdersTakerAssetFilledAmounts[i], 'left', exchangeWrapper);
    }
    for (let i = 0; i < orders.rightOrders.length; i++) {
        assertOrderStateAsync(orders.rightOrders[i], orders.rightOrdersTakerAssetFilledAmounts[i], 'right', exchangeWrapper);
    }
}

/**
 * Asserts initial exchange state for matched orders.
 * @param orders Matched orders with intial filled amounts.
 * @param exchangeWrapper ExchangeWrapper isntance.
 */
async function assertInitialOrderStatesAsync(orders: MatchedOrders, exchangeWrapper: ExchangeWrapper): Promise<void> {
    const pairs = [
        [orders.leftOrder, orders.leftOrderTakerAssetFilledAmount || ZERO],
        [orders.rightOrder, orders.rightOrderTakerAssetFilledAmount || ZERO],
    ] as Array<[SignedOrder, BigNumber]>;
    await Promise.all(
        pairs.map(async ([order, expectedFilledAmount]) => {
            const side = order === orders.leftOrder ? 'left' : 'right';
            await assertOrderStateAsync(order, expectedFilledAmount, side, exchangeWrapper);
        })
    );
}

/**
 * FIXME: This needs to be commented and the name should be reconsidered
 */
async function assertOrderStateAsync(
    order: SignedOrder,
    expectedFilledAmount: BigNumber,
    side: string,
    exchangeWrapper: ExchangeWrapper
): Promise<void> {
    const orderHash = orderHashUtils.getOrderHashHex(order);
    const actualFilledAmount = await exchangeWrapper.getTakerAssetFilledAmountAsync(orderHash);
    expect(actualFilledAmount, `${side} order initial filled amount`).to.bignumber.equal(expectedFilledAmount);
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
    const pairs = [
        [matchResults.orders.leftOrder, matchResults.orders.leftOrderTakerAssetFilledAmount],
        [matchResults.orders.rightOrder, matchResults.orders.rightOrderTakerAssetFilledAmount],
    ] as Array<[SignedOrder, BigNumber]>;
    await Promise.all(
        pairs.map(async ([order, expectedFilledAmount]) => {
            const side = order === matchResults.orders.leftOrder ? 'left' : 'right';
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
        }),
    );
}

/**
 * Retrive the current token balances of all known addresses.
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
// tslint:disable-line:max-file-line-count
