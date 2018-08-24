import { BigNumber } from '@0xproject/utils';

export enum OrderError {
    InvalidSignature = 'INVALID_SIGNATURE',
}

export enum TradeSide {
    Maker = 'maker',
    Taker = 'taker',
}

export enum TransferType {
    Trade = 'trade',
    Fee = 'fee',
}

export interface EIP712Parameter {
    name: string;
    type: EIP712Types;
}

export interface EIP712Schema {
    name: string;
    parameters: EIP712Parameter[];
}

export enum EIP712Types {
    Address = 'address',
    Bytes = 'bytes',
    Bytes32 = 'bytes32',
    String = 'string',
    Uint256 = 'uint256',
}

export interface CreateOrderOpts {
    takerAddress?: string;
    senderAddress?: string;
    makerFee?: BigNumber;
    takerFee?: BigNumber;
    feeRecipientAddress?: string;
    salt?: BigNumber;
    expirationTimeSeconds?: BigNumber;
}

/**
 * remainingFillableMakerAssetAmount: An array of BigNumbers corresponding to the `orders` parameter.
 * You can use `OrderStateUtils` `@0xproject/order-utils` to perform blockchain lookups for these values.
 * Defaults to `makerAssetAmount` values from the orders param.
 * slippageBufferAmount: An additional amount of makerAsset to be covered by the result in case of trade collisions or partial fills.
 * Defaults to 0
 */
export interface FindOrdersThatCoverMakerAssetFillAmountOpts {
    remainingFillableMakerAssetAmounts?: BigNumber[];
    slippageBufferAmount?: BigNumber;
}

/**
 * remainingFillableMakerAssetAmount: An array of BigNumbers corresponding to the `orders` parameter.
 * You can use `OrderStateUtils` `@0xproject/order-utils` to perform blockchain lookups for these values.
 * Defaults to `makerAssetAmount` values from the orders param.
 * remainingFillableFeeAmounts: An array of BigNumbers corresponding to the feeOrders parameter.
 * You can use OrderStateUtils @0xproject/order-utils to perform blockchain lookups for these values.
 * Defaults to `makerAssetAmount` values from the feeOrders param.
 * slippageBufferAmount: An additional amount of fee to be covered by the result in case of trade collisions or partial fills.
 * Defaults to 0
 */
export interface FindFeeOrdersThatCoverFeesForTargetOrdersOpts {
    remainingFillableMakerAssetAmounts?: BigNumber[];
    remainingFillableFeeAmounts?: BigNumber[];
    slippageBufferAmount?: BigNumber;
}

export interface FeeOrdersAndRemainingFeeAmount<T> {
    resultFeeOrders: T[];
    remainingFeeAmount: BigNumber;
}

export interface OrdersAndRemainingFillAmount<T> {
    resultOrders: T[];
    remainingFillAmount: BigNumber;
}
