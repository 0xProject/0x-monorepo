import { ExchangeProxyMetaTransaction, Order, ZeroExTransaction } from '@0x/types';
import { hexUtils, signTypedDataUtils } from '@0x/utils';

import { eip712Utils } from './eip712_utils';
import { orderHashUtils } from './order_hash_utils';
import { transactionHashUtils } from './transaction_hash_utils';

/**
 * Compute the EIP712 hash of an order.
 */
export function getOrderHash(order: Order): string {
    return orderHashUtils.getOrderHash(order);
}

/**
 * Compute the EIP712 hash of an Exchange meta-transaction.
 */
export function getExchangeMetaTransactionHash(tx: ZeroExTransaction): string {
    return transactionHashUtils.getTransactionHash(tx);
}

/**
 * Compute the EIP712 hash of an Exchange Proxy meta-transaction.
 */
export function getExchangeProxyMetaTransactionHash(mtx: ExchangeProxyMetaTransaction): string {
    return hexUtils.toHex(
        signTypedDataUtils.generateTypedDataHash(eip712Utils.createExchangeProxyMetaTransactionTypedData(mtx)),
    );
}
