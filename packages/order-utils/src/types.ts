import { BigNumber } from '@0x/utils';

export enum TypedDataError {
    InvalidSignature = 'INVALID_SIGNATURE',
    InvalidMetamaskSigner = "MetaMask provider must be wrapped in a MetamaskSubprovider (from the '@0x/subproviders' package) in order to work with this method.",
}

export enum TradeSide {
    Maker = 'maker',
    Taker = 'taker',
}

export enum TransferType {
    Trade = 'trade',
    Fee = 'fee',
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

export interface ValidateOrderFillableOpts {
    expectedFillTakerTokenAmount?: BigNumber;
    validateRemainingOrderAmountIsFillable?: boolean;
    simulationTakerAddress?: string;
}

/**
 * remainingFillableMakerAssetAmount: An array of BigNumbers corresponding to the `orders` parameter.
 * You can use `OrderStateUtils` `@0x/order-utils` to perform blockchain lookups for these values.
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
 * You can use `OrderStateUtils` `@0x/order-utils` to perform blockchain lookups for these values.
 * Defaults to `makerAssetAmount` values from the orders param.
 * slippageBufferAmount: An additional amount of makerAsset to be covered by the result in case of trade collisions or partial fills.
 * Defaults to 0
 */
export interface FindOrdersThatCoverTakerAssetFillAmountOpts {
    remainingFillableTakerAssetAmounts?: BigNumber[];
    slippageBufferAmount?: BigNumber;
}

/**
 * remainingFillableMakerAssetAmount: An array of BigNumbers corresponding to the `orders` parameter.
 * You can use `OrderStateUtils` `@0x/order-utils` to perform blockchain lookups for these values.
 * Defaults to `makerAssetAmount` values from the orders param.
 * remainingFillableFeeAmounts: An array of BigNumbers corresponding to the feeOrders parameter.
 * You can use OrderStateUtils @0x/order-utils to perform blockchain lookups for these values.
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
    feeOrdersRemainingFillableMakerAssetAmounts: BigNumber[];
    remainingFeeAmount: BigNumber;
}

export interface OrdersAndRemainingMakerFillAmount<T> {
    resultOrders: T[];
    ordersRemainingFillableMakerAssetAmounts: BigNumber[];
    remainingFillAmount: BigNumber;
}

export interface OrdersAndRemainingTakerFillAmount<T> {
    resultOrders: T[];
    ordersRemainingFillableTakerAssetAmounts: BigNumber[];
    remainingFillAmount: BigNumber;
}
