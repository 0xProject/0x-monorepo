import { BigNumber } from '@0x/utils';

export interface V2Order {
    makerAddress: string;
    takerAddress: string;
    senderAddress: string;
    feeRecipientAddress: string;
    makerAssetAmount: BigNumber;
    takerAssetAmount: BigNumber;
    makerFee: BigNumber;
    takerFee: BigNumber;
    salt: BigNumber;
    expirationTimeSeconds: BigNumber;
    makerAssetData: string;
    takerAssetData: string;
    makerFeeAssetData: string;
    takerFeeAssetData: string;
}

export interface SignedV2Order extends V2Order {
    signature: string;
}
