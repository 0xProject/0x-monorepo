import { ERC1155ProxyWrapper, ERC20Wrapper, ERC721Wrapper } from '@0x/contracts-asset-proxy';
import {
    BatchMatchedFillResults,
    chaiSetup,
    ERC1155HoldingsByOwner,
    FillResults,
    MatchedFillResults,
    OrderStatus,
} from '@0x/contracts-test-utils';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { AssetProxyId, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { ExchangeWrapper } from './exchange_wrapper';
import { TokenBalances } from './balances';


/**
 * Asserts that the provided order's fill amount and order status
 * are the expected values.
 * @param order The order to verify for a correct state.
 * @param expectedFilledAmount The amount that the order should
 *                             have been filled.
 * @param side The side that the provided order should be matched on.
 * @param exchangeWrapper The ExchangeWrapper instance.
 */
export async function assertOrderFilledAmountAsync(
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
