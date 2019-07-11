pragma solidity ^0.5.9;


contract IExchangeRichErrors {

    enum AssetProxyDispatchErrorCodes {
        INVALID_ASSET_DATA_LENGTH,
        UNKNOWN_ASSET_PROXY
    }

    enum FillErrorCodes {
        INVALID_TAKER_AMOUNT,
        TAKER_OVERPAY,
        OVERFILL,
        INVALID_FILL_PRICE
    }

    enum SignatureErrorCodes {
        BAD_SIGNATURE,
        INVALID_LENGTH,
        UNSUPPORTED,
        ILLEGAL,
        INAPPROPRIATE_SIGNATURE_TYPE
    }

    enum TransactionErrorCodes {
        NO_REENTRANCY,
        ALREADY_EXECUTED,
        EXPIRED
    }
}
