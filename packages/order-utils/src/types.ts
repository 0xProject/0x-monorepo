import { BigNumber } from '@0x/utils';

export enum TypedDataError {
    InvalidSignature = 'INVALID_SIGNATURE',
    InvalidMetamaskSigner = "MetaMask provider must be wrapped in a MetamaskSubprovider (from the '@0x/subproviders' package) in order to work with this method.",
}

export interface CreateOrderOpts {
    takerAddress?: string;
    senderAddress?: string;
    makerFee?: BigNumber;
    takerFee?: BigNumber;
    feeRecipientAddress?: string;
    salt?: BigNumber;
    expirationTimeSeconds?: BigNumber;
    makerFeeAssetData?: string;
    takerFeeAssetData?: string;
}

export interface ValidateOrderFillableOpts {
    expectedFillTakerTokenAmount?: BigNumber;
    validateRemainingOrderAmountIsFillable?: boolean;
    simulationTakerAddress?: string;
}
