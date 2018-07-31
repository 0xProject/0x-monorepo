import { BigNumber } from 'bignumber.js';
import { ContractAbi } from 'ethereum-types';

// HACK: Rather then extending from OrderWithoutExchangeAddress
// we don't, because our docs don't expand inherited types, and it's unnecessarily
// confusing to introduce the user to the OrderWithoutExchangeAddress type.
export interface Order {
    senderAddress: string;
    makerAddress: string;
    takerAddress: string;
    makerFee: BigNumber;
    takerFee: BigNumber;
    makerAssetAmount: BigNumber;
    takerAssetAmount: BigNumber;
    makerAssetData: string;
    takerAssetData: string;
    salt: BigNumber;
    exchangeAddress: string;
    feeRecipientAddress: string;
    expirationTimeSeconds: BigNumber;
}

export interface OrderWithoutExchangeAddress {
    senderAddress: string;
    makerAddress: string;
    takerAddress: string;
    makerFee: BigNumber;
    takerFee: BigNumber;
    makerAssetAmount: BigNumber;
    takerAssetAmount: BigNumber;
    makerAssetData: string;
    takerAssetData: string;
    salt: BigNumber;
    feeRecipientAddress: string;
    expirationTimeSeconds: BigNumber;
}

export interface SignedOrder extends Order {
    signature: string;
}

/**
 * Elliptic Curve signature
 */
export interface ECSignature {
    v: number;
    r: string;
    s: string;
}

/**
 * Validator signature components
 */
export interface ValidatorSignature {
    validatorAddress: string;
    signature: string;
}

/**
 * Errors originating from the 0x exchange contract
 */
export enum ExchangeContractErrs {
    OrderFillExpired = 'ORDER_FILL_EXPIRED',
    OrderCancelExpired = 'ORDER_CANCEL_EXPIRED',
    OrderCancelAmountZero = 'ORDER_CANCEL_AMOUNT_ZERO',
    OrderAlreadyCancelledOrFilled = 'ORDER_ALREADY_CANCELLED_OR_FILLED',
    OrderFillAmountZero = 'ORDER_FILL_AMOUNT_ZERO',
    OrderRemainingFillAmountZero = 'ORDER_REMAINING_FILL_AMOUNT_ZERO',
    OrderFillRoundingError = 'ORDER_FILL_ROUNDING_ERROR',
    FillBalanceAllowanceError = 'FILL_BALANCE_ALLOWANCE_ERROR',
    InsufficientTakerBalance = 'INSUFFICIENT_TAKER_BALANCE',
    InsufficientTakerAllowance = 'INSUFFICIENT_TAKER_ALLOWANCE',
    InsufficientMakerBalance = 'INSUFFICIENT_MAKER_BALANCE',
    InsufficientMakerAllowance = 'INSUFFICIENT_MAKER_ALLOWANCE',
    InsufficientTakerFeeBalance = 'INSUFFICIENT_TAKER_FEE_BALANCE',
    InsufficientTakerFeeAllowance = 'INSUFFICIENT_TAKER_FEE_ALLOWANCE',
    InsufficientMakerFeeBalance = 'INSUFFICIENT_MAKER_FEE_BALANCE',
    InsufficientMakerFeeAllowance = 'INSUFFICIENT_MAKER_FEE_ALLOWANCE',
    TransactionSenderIsNotFillOrderTaker = 'TRANSACTION_SENDER_IS_NOT_FILL_ORDER_TAKER',
    MultipleMakersInSingleCancelBatchDisallowed = 'MULTIPLE_MAKERS_IN_SINGLE_CANCEL_BATCH_DISALLOWED',
    InsufficientRemainingFillAmount = 'INSUFFICIENT_REMAINING_FILL_AMOUNT',
    MultipleTakerTokensInFillUpToDisallowed = 'MULTIPLE_TAKER_TOKENS_IN_FILL_UP_TO_DISALLOWED',
    BatchOrdersMustHaveSameExchangeAddress = 'BATCH_ORDERS_MUST_HAVE_SAME_EXCHANGE_ADDRESS',
    BatchOrdersMustHaveAtLeastOneItem = 'BATCH_ORDERS_MUST_HAVE_AT_LEAST_ONE_ITEM',
}

export type ArtifactContractName = 'ZRX' | 'TokenTransferProxy' | 'TokenRegistry' | 'Token' | 'Exchange' | 'EtherToken';

export interface Artifact {
    contract_name: ArtifactContractName;
    abi: ContractAbi;
    networks: {
        [networkId: number]: {
            address: string;
        };
    };
}

export type DoneCallback = (err?: Error) => void;

export interface OrderRelevantState {
    makerBalance: BigNumber;
    makerProxyAllowance: BigNumber;
    makerFeeBalance: BigNumber;
    makerFeeProxyAllowance: BigNumber;
    filledTakerAssetAmount: BigNumber;
    remainingFillableMakerAssetAmount: BigNumber;
    remainingFillableTakerAssetAmount: BigNumber;
}

export interface OrderStateValid {
    isValid: true;
    orderHash: string;
    orderRelevantState: OrderRelevantState;
}

export interface OrderStateInvalid {
    isValid: false;
    orderHash: string;
    error: ExchangeContractErrs;
}

export type OrderState = OrderStateValid | OrderStateInvalid;

export interface Token {
    name: string;
    address: string;
    symbol: string;
    decimals: number;
}

export enum SignatureType {
    Illegal,
    Invalid,
    EIP712,
    EthSign,
    Caller,
    Wallet,
    Validator,
    PreSigned,
    Trezor,
    NSignatureTypes,
}

/**
 * The Signer Provider Type. Some Signer implementations use different message prefixes or implement different
 * eth_sign behaviour. Note EthSign is compatible with the Ledger device.
 */
export enum SignerProviderType {
    EthSign = 'ETH_SIGN',
    Metamask = 'METAMASK',
    Trezor = 'TREZOR',
}

/**
 * Elliptic Curve signature
 */
export interface ECSignature {
    v: number;
    r: string;
    s: string;
}

export enum AssetProxyId {
    ERC20 = '0xf47261b0',
    ERC721 = '0x02571792',
}

export interface ERC20AssetData {
    assetProxyId: string;
    tokenAddress: string;
}

export interface ERC721AssetData {
    assetProxyId: string;
    tokenAddress: string;
    tokenId: BigNumber;
}

export enum RevertReason {
    OrderUnfillable = 'ORDER_UNFILLABLE',
    InvalidMaker = 'INVALID_MAKER',
    InvalidTaker = 'INVALID_TAKER',
    InvalidSender = 'INVALID_SENDER',
    InvalidOrderSignature = 'INVALID_ORDER_SIGNATURE',
    InvalidTakerAmount = 'INVALID_TAKER_AMOUNT',
    RoundingError = 'ROUNDING_ERROR',
    InvalidSignature = 'INVALID_SIGNATURE',
    SignatureIllegal = 'SIGNATURE_ILLEGAL',
    SignatureUnsupported = 'SIGNATURE_UNSUPPORTED',
    InvalidNewOrderEpoch = 'INVALID_NEW_ORDER_EPOCH',
    CompleteFillFailed = 'COMPLETE_FILL_FAILED',
    NegativeSpreadRequired = 'NEGATIVE_SPREAD_REQUIRED',
    ReentrancyIllegal = 'REENTRANCY_ILLEGAL',
    InvalidTxHash = 'INVALID_TX_HASH',
    InvalidTxSignature = 'INVALID_TX_SIGNATURE',
    FailedExecution = 'FAILED_EXECUTION',
    AssetProxyAlreadyExists = 'ASSET_PROXY_ALREADY_EXISTS',
    LengthGreaterThan0Required = 'LENGTH_GREATER_THAN_0_REQUIRED',
    LengthGreaterThan131Required = 'LENGTH_GREATER_THAN_131_REQUIRED',
    Length0Required = 'LENGTH_0_REQUIRED',
    Length65Required = 'LENGTH_65_REQUIRED',
    InvalidAmount = 'INVALID_AMOUNT',
    TransferFailed = 'TRANSFER_FAILED',
    SenderNotAuthorized = 'SENDER_NOT_AUTHORIZED',
    TargetNotAuthorized = 'TARGET_NOT_AUTHORIZED',
    TargetAlreadyAuthorized = 'TARGET_ALREADY_AUTHORIZED',
    IndexOutOfBounds = 'INDEX_OUT_OF_BOUNDS',
    AuthorizedAddressMismatch = 'AUTHORIZED_ADDRESS_MISMATCH',
    OnlyContractOwner = 'ONLY_CONTRACT_OWNER',
    MakerNotWhitelisted = 'MAKER_NOT_WHITELISTED',
    TakerNotWhitelisted = 'TAKER_NOT_WHITELISTED',
    AssetProxyDoesNotExist = 'ASSET_PROXY_DOES_NOT_EXIST',
    LibBytesGreaterThanZeroLengthRequired = 'GREATER_THAN_ZERO_LENGTH_REQUIRED',
    LibBytesGreaterOrEqualTo4LengthRequired = 'GREATER_OR_EQUAL_TO_4_LENGTH_REQUIRED',
    LibBytesGreaterOrEqualTo20LengthRequired = 'GREATER_OR_EQUAL_TO_20_LENGTH_REQUIRED',
    LibBytesGreaterOrEqualTo32LengthRequired = 'GREATER_OR_EQUAL_TO_32_LENGTH_REQUIRED',
    LibBytesGreaterOrEqualToNestedBytesLengthRequired = 'GREATER_OR_EQUAL_TO_NESTED_BYTES_LENGTH_REQUIRED',
    LibBytesGreaterOrEqualToSourceBytesLengthRequired = 'GREATER_OR_EQUAL_TO_SOURCE_BYTES_LENGTH_REQUIRED',
    Erc20InsufficientBalance = 'ERC20_INSUFFICIENT_BALANCE',
    Erc20InsufficientAllowance = 'ERC20_INSUFFICIENT_ALLOWANCE',
    FeePercentageTooLarge = 'FEE_PERCENTAGE_TOO_LARGE',
    ValueGreaterThanZero = 'VALUE_GREATER_THAN_ZERO',
    InvalidMsgValue = 'INVALID_MSG_VALUE',
    InsufficientEthRemaining = 'INSUFFICIENT_ETH_REMAINING',
    Uint256Overflow = 'UINT256_OVERFLOW',
}

export enum StatusCodes {
    Success = 200,
    NotFound = 404,
    InternalError = 500,
    MethodNotAllowed = 405,
    GatewayTimeout = 504,
}
