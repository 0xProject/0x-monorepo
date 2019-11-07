"""Exchange-specific exception classes."""

from enum import auto, Enum

from zero_ex.contract_wrappers.exceptions import RichRevert

# pylint: disable=missing-docstring


class AssetProxyDispatchErrorCodes(Enum):  # noqa: D101 (missing docstring)
    INVALID_ASSET_DATA_LENGTH = 0
    UNKNOWN_ASSET_PROXY = auto()


class BatchMatchOrdersErrorCodes(Enum):  # noqa: D101 (missing docstring)
    ZERO_LEFT_ORDERS = 0
    ZERO_RIGHT_ORDERS = auto()
    INVALID_LENGTH_LEFT_SIGNATURES = auto()
    INVALID_LENGTH_RIGHT_SIGNATURES = auto()


class ExchangeContextErrorCodes(Enum):  # noqa: D101 (missing docstring)
    INVALID_MAKER = 0
    INVALID_TAKER = auto()
    INVALID_SENDER = auto()


class FillErrorCodes(Enum):  # noqa: D101 (missing docstring)
    INVALID_TAKER_AMOUNT = 0
    TAKER_OVERPAY = auto()
    OVERFILL = auto()
    INVALID_FILL_PRICE = auto()


class SignatureErrorCodes(Enum):  # noqa: D101 (missing docstring)
    BAD_ORDER_SIGNATURE = 0
    BAD_TRANSACTION_SIGNATURE = auto()
    INVALID_LENGTH = auto()
    UNSUPPORTED = auto()
    ILLEGAL = auto()
    INAPPROPRIATE_SIGNATURE_TYPE = auto()
    INVALID_SIGNER = auto()


class TransactionErrorCodes(Enum):  # noqa: D101 (missing docstring)
    ALREADY_EXECUTED = 0
    EXPIRED = auto()


class IncompleteFillErrorCode(Enum):  # noqa: D101 (missing docstring)
    INCOMPLETE_MARKET_BUY_ORDERS = 0
    INCOMPLETE_MARKET_SELL_ORDERS = auto()
    INCOMPLETE_FILL_ORDER = auto()


class SignatureError(RichRevert):  # noqa: D101 (missing docstring)
    def __init__(self, return_data):  # noqa: D107 (missing docstring)
        super().__init__(
            "SignatureError(uint8,bytes32,address,bytes)",
            ["errorCode", "hash", "signerAddress", "signature"],
            return_data,
        )

    errorCode: SignatureErrorCodes
    hash: bytes
    signerAddress: str
    signature: bytes

    selector = "0x7e5a2318"


class SignatureValidatorNotApprovedError(
    RichRevert
):  # noqa: D101 (missing docstring)
    def __init__(self, return_data):  # noqa: D107 (missing docstring)
        super().__init__(
            "SignatureValidatorNotApprovedError(address,address)",
            ["signerAddress", "validatorAddress"],
            return_data,
        )

    signerAddress: str
    validatorAddress: str

    selector = "0xa15c0d06"


class EIP1271SignatureError(RichRevert):  # noqa: D101 (missing docstring)
    def __init__(self, return_data):  # noqa: D107 (missing docstring)
        super().__init__(
            "EIP1271SignatureError(address,bytes,bytes,bytes)",
            ["verifyingContractAddress", "data", "signature", "errorData"],
            return_data,
        )

    verifyingContractAddress: str
    data: bytes
    signature: bytes
    errorData: bytes

    selector = "0x5bd0428d"


class SignatureWalletError(RichRevert):  # noqa: D101 (missing docstring)
    def __init__(self, return_data):  # noqa: D107 (missing docstring)
        super().__init__(
            "SignatureWalletError(bytes32,address,bytes,bytes)",
            ["hash", "walletAddress", "signature", "errorData"],
            return_data,
        )

    hash: bytes
    walletAddress: str
    signature: bytes
    errorData: bytes

    selector = "0x1b8388f7"


class OrderStatusError(RichRevert):  # noqa: D101 (missing docstring)
    def __init__(self, return_data):  # noqa: D107 (missing docstring)
        super().__init__(
            "OrderStatusError(bytes32,uint8)",
            ["orderHash", "orderStatus"],
            return_data,
        )

    orderHash: bytes
    orderStatus: int

    selector = "0xfdb6ca8d"


class ExchangeInvalidContextError(
    RichRevert
):  # noqa: D101 (missing docstring)
    def __init__(self, return_data):  # noqa: D107 (missing docstring)
        super().__init__(
            "ExchangeInvalidContextError(uint8,bytes32,address)",
            ["errorCode", "orderHash", "contextAddress"],
            return_data,
        )

    errorCode: ExchangeContextErrorCodes
    orderHash: bytes
    contextAddress: str

    selector = "0xe53c76c8"


class FillError(RichRevert):  # noqa: D101 (missing docstring)
    def __init__(self, return_data):  # noqa: D107 (missing docstring)
        super().__init__(
            "FillError(uint8,bytes32)", ["errorCode", "orderHash"], return_data
        )

    errorCode: FillErrorCodes
    orderHash: bytes

    selector = "0xe94a7ed0"


class OrderEpochError(RichRevert):  # noqa: D101 (missing docstring)
    def __init__(self, return_data):  # noqa: D107 (missing docstring)
        super().__init__(
            "OrderEpochError(address,address,uint256)",
            ["makerAddress", "orderSenderAddress", "currentEpoch"],
            return_data,
        )

    makerAddress: str
    orderSenderAddress: str
    currentEpoch: int

    selector = "0x4ad31275"


class AssetProxyExistsError(RichRevert):  # noqa: D101 (missing docstring)
    def __init__(self, return_data):  # noqa: D107 (missing docstring)
        super().__init__(
            "AssetProxyExistsError(bytes4,address)",
            ["assetProxyId", "assetProxyAddress"],
            return_data,
        )

    assetProxyId: bytes
    assetProxyAddress: str

    selector = "0x11c7b720"


class AssetProxyDispatchError(RichRevert):  # noqa: D101 (missing docstring)
    def __init__(self, return_data):  # noqa: D107 (missing docstring)
        super().__init__(
            "AssetProxyDispatchError(uint8,bytes32,bytes)",
            ["errorCode", "orderHash", "assetData"],
            return_data,
        )

    errorCode: AssetProxyDispatchErrorCodes
    orderHash: bytes
    assetData: bytes

    selector = "0x488219a6"


class AssetProxyTransferError(RichRevert):  # noqa: D101 (missing docstring)
    def __init__(self, return_data):  # noqa: D107 (missing docstring)
        super().__init__(
            "AssetProxyTransferError(bytes32,bytes,bytes)",
            ["orderHash", "assetData", "errorData"],
            return_data,
        )

    orderHash: bytes
    assetData: bytes
    errorData: bytes

    selector = "0x4678472b"


class NegativeSpreadError(RichRevert):  # noqa: D101 (missing docstring)
    def __init__(self, return_data):  # noqa: D107 (missing docstring)
        super().__init__(
            "NegativeSpreadError(bytes32,bytes32)",
            ["leftOrderHash", "rightOrderHash"],
            return_data,
        )

    leftOrderHash: bytes
    rightOrderHash: bytes

    selector = "0xb6555d6f"


class TransactionError(RichRevert):  # noqa: D101 (missing docstring)
    def __init__(self, return_data):  # noqa: D107 (missing docstring)
        super().__init__(
            "TransactionError(uint8,bytes32)",
            ["errorCode", "transactionHash"],
            return_data,
        )

    errorCode: TransactionErrorCodes
    transactionHash: bytes

    selector = "0xf5985184"


class TransactionExecutionError(RichRevert):  # noqa: D101 (missing docstring)
    def __init__(self, return_data):  # noqa: D107 (missing docstring)
        super().__init__(
            "TransactionExecutionError(bytes32,bytes)",
            ["transactionHash", "errorData"],
            return_data,
        )

    transactionHash: bytes
    errorData: bytes

    selector = "0x20d11f61"


class TransactionGasPriceError(RichRevert):  # noqa: D101 (missing docstring)
    def __init__(self, return_data):  # noqa: D107 (missing docstring)
        super().__init__(
            "TransactionGasPriceError(bytes32,uint256,uint256)",
            ["transactionHash", "actualGasPrice", "requiredGasPrice"],
            return_data,
        )

    transactionHash: bytes
    actualGasPrice: int
    requiredGasPrice: int

    selector = "0xa26dac09"


class TransactionInvalidContextError(
    RichRevert
):  # noqa: D101 (missing docstring)
    def __init__(self, return_data):  # noqa: D107 (missing docstring)
        super().__init__(
            "TransactionInvalidContextError(bytes32,address)",
            ["transactionHash", "currentContextAddress"],
            return_data,
        )

    transactionHash: bytes
    currentContextAddress: str

    selector = "0xdec4aedf"


class IncompleteFillError(RichRevert):  # noqa: D101 (missing docstring)
    def __init__(self, return_data):  # noqa: D107 (missing docstring)
        super().__init__(
            "IncompleteFillError(uint8,uint256,uint256)",
            ["errorCode", "expectedAssetAmount", "actualAssetAmount"],
            return_data,
        )

    errorCode: IncompleteFillErrorCode
    expectedAssetAmount: int
    actualAssetAmount: int

    selector = "0x18e4b141"


class BatchMatchOrdersError(RichRevert):  # noqa: D101 (missing docstring)
    def __init__(self, return_data):  # noqa: D107 (missing docstring)
        super().__init__(
            "BatchMatchOrdersError(uint8)", ["errorCode"], return_data
        )

    errorCode: BatchMatchOrdersErrorCodes

    selector = "0xd4092f4f"


class PayProtocolFeeError(RichRevert):  # noqa: D101 (missing docstring)
    def __init__(self, return_data):  # noqa: D107 (missing docstring)
        super().__init__(
            "PayProtocolFeeError(bytes32,uint256,address,address,bytes)",
            [
                "orderHash",
                "protocolFee",
                "makerAddress",
                "takerAddress",
                "errorData",
            ],
            return_data,
        )

    orderHash: bytes
    protocolFee: int
    makerAddress: str
    takerAddress: str
    errorData: bytes

    selector = "0x87cb1e75"
