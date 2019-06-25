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

    // bytes4(keccak256("SignatureError(uint8,bytes32,address,bytes)"))
    bytes4 internal constant SIGNATURE_ERROR_SELECTOR =
        0x7e5a2318;

    // bytes4(keccak256("SignatureValidatorNotApprovedError(address,address)"))
    bytes4 internal constant SIGNATURE_VALIDATOR_NOT_APPROVED_ERROR_SELECTOR =
        0xa15c0d06;

    // bytes4(keccak256("SignatureValidatorError(bytes32,address,address,bytes,bytes)"))
    bytes4 internal constant SIGNATURE_VALIDATOR_ERROR_SELECTOR =
        0xa23838b8;

    // bytes4(keccak256("SignatureWalletError(bytes32,address,bytes,bytes)"))
    bytes4 internal constant SIGNATURE_WALLET_ERROR_SELECTOR =
        0x1b8388f7;

    // bytes4(keccak256("OrderStatusError(bytes32,uint8)"))
    bytes4 internal constant ORDER_STATUS_ERROR_SELECTOR =
        0xfdb6ca8d;

    // bytes4(keccak256("InvalidSenderError(bytes32,address)"))
    bytes4 internal constant INVALID_SENDER_ERROR_SELECTOR =
        0x95b59997;

    // bytes4(keccak256("InvalidMakerError(bytes32,address)"))
    bytes4 internal constant INVALID_MAKER_ERROR_SELECTOR =
        0x26bf55d9;

    // bytes4(keccak256("FillError(uint8,bytes32)"))
    bytes4 internal constant FILL_ERROR_SELECTOR =
        0xe94a7ed0;

    // bytes4(keccak256("InvalidTakerError(bytes32,address)"))
    bytes4 internal constant INVALID_TAKER_ERROR_SELECTOR =
        0xfdb328be;

    // bytes4(keccak256("OrderEpochError(address,address,uint256)"))
    bytes4 internal constant ORDER_EPOCH_ERROR_SELECTOR =
        0x4ad31275;

    // bytes4(keccak256("AssetProxyExistsError(address)"))
    bytes4 internal constant ASSET_PROXY_EXISTS_ERROR_SELECTOR =
        0xcc8b3b53;

    // bytes4(keccak256("AssetProxyDispatchError(uint8,bytes32,bytes)"))
    bytes4 internal constant ASSET_PROXY_DISPATCH_ERROR_SELECTOR =
        0x488219a6;

    // bytes4(keccak256("AssetProxyTransferError(bytes32,bytes,bytes)"))
    bytes4 internal constant ASSET_PROXY_TRANSFER_ERROR_SELECTOR =
        0x4678472b;

    // bytes4(keccak256("NegativeSpreadError(bytes32,bytes32)"))
    bytes4 internal constant NEGATIVE_SPREAD_ERROR_SELECTOR =
        0xb6555d6f;

    // bytes4(keccak256("TransactionError(uint8,bytes32)"))
    bytes4 internal constant TRANSACTION_ERROR_SELECTOR =
        0xf5985184;

    // bytes4(keccak256("TransactionSignatureError(bytes32,address,bytes)"))
    bytes4 internal constant TRANSACTION_SIGNATURE_ERROR_SELECTOR =
        0xbfd56ef6;

    // bytes4(keccak256("TransactionExecutionError(bytes32,bytes)"))
    bytes4 internal constant TRANSACTION_EXECUTION_ERROR_SELECTOR =
        0x20d11f61;

    // bytes4(keccak256("IncompleteFillError(bytes32)"))
    bytes4 internal constant INCOMPLETE_FILL_ERROR_SELECTOR =
        0x152aa60e;
}
