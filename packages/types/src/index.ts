// tslint:disable:max-file-line-count

import { BigNumber } from 'bignumber.js';
import {
    ContractAbi,
    ContractChains,
    ContractEventArg,
    DecodedLogArgs,
    DevdocOutput,
    LogWithDecodedArgs,
} from 'ethereum-types';

export interface Order {
    chainId: number;
    exchangeAddress: string;
    makerAddress: string;
    takerAddress: string;
    feeRecipientAddress: string;
    senderAddress: string;
    makerAssetAmount: BigNumber;
    takerAssetAmount: BigNumber;
    makerFee: BigNumber;
    takerFee: BigNumber;
    expirationTimeSeconds: BigNumber;
    salt: BigNumber;
    makerAssetData: string;
    takerAssetData: string;
    makerFeeAssetData: string;
    takerFeeAssetData: string;
}

export interface SignedOrder extends Order {
    signature: string;
}

export enum MarketOperation {
    Sell = 'Sell',
    Buy = 'Buy',
}

/**
 * ZeroExTransaction for use with 0x Exchange executeTransaction
 */
export interface ZeroExTransaction {
    salt: BigNumber;
    expirationTimeSeconds: BigNumber;
    gasPrice: BigNumber;
    signerAddress: string;
    data: string;
    domain: EIP712DomainWithDefaultSchema;
}

export interface SignedZeroExTransaction extends ZeroExTransaction {
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
    OrderCancelled = 'ORDER_CANCELLED',
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
    chains: {
        [chainId: number]: {
            address: string;
        };
    };
}

export type DoneCallback = (err?: Error) => void;

export interface OrderRelevantState {
    makerBalance: BigNumber;
    makerIndividualBalances: ObjectMap<BigNumber>;
    makerProxyAllowance: BigNumber;
    makerIndividualProxyAllowances: ObjectMap<BigNumber>;
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
    transactionHash?: string;
}

export interface OrderStateInvalid {
    isValid: false;
    orderHash: string;
    error: ExchangeContractErrs;
    transactionHash?: string;
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
    Wallet,
    Validator,
    PreSigned,
    EIP1271Wallet,
    NSignatureTypes,
}

export enum AssetProxyId {
    ERC20 = '0xf47261b0',
    ERC721 = '0x02571792',
    MultiAsset = '0x94cfcdd7',
    ERC1155 = '0xa7cb5fb7',
    StaticCall = '0xc339d10a',
    ERC20Bridge = '0xdc1600f3',
}

export interface ERC20AssetData {
    assetProxyId: string;
    tokenAddress: string;
}

export interface ERC20BridgeAssetData {
    assetProxyId: string;
    tokenAddress: string;
    bridgeAddress: string;
    bridgeData: string;
}

export interface ERC721AssetData {
    assetProxyId: string;
    tokenAddress: string;
    tokenId: BigNumber;
}

export interface ERC1155AssetData {
    assetProxyId: string;
    tokenAddress: string;
    tokenIds: BigNumber[];
    tokenValues: BigNumber[];
    callbackData: string;
}

export interface StaticCallAssetData {
    assetProxyId: string;
    callTarget: string;
    staticCallData: string;
    callResultHash: string;
}

export interface ERC1155AssetDataNoProxyId {
    tokenAddress: string;
    tokenValues: BigNumber[];
    tokenIds: BigNumber[];
    callbackData: string;
}

export type SingleAssetData =
    | ERC20AssetData
    | ERC20BridgeAssetData
    | ERC721AssetData
    | ERC1155AssetData
    | StaticCallAssetData;

export interface MultiAssetData {
    assetProxyId: string;
    amounts: BigNumber[];
    nestedAssetData: string[];
}

export interface MultiAssetDataWithRecursiveDecoding {
    assetProxyId: string;
    amounts: BigNumber[];
    nestedAssetData: SingleAssetData[];
}

export interface DutchAuctionData {
    assetData: AssetData;
    beginTimeSeconds: BigNumber;
    beginAmount: BigNumber;
}

export type AssetData = SingleAssetData | MultiAssetData | MultiAssetDataWithRecursiveDecoding;

// TODO: DRY. These should be extracted from contract code.
export enum RevertReason {
    OrderUnfillable = 'ORDER_UNFILLABLE',
    InvalidMaker = 'INVALID_MAKER',
    InvalidTaker = 'INVALID_TAKER',
    InvalidSender = 'INVALID_SENDER',
    InvalidOrderSignature = 'INVALID_ORDER_SIGNATURE',
    InvalidTakerAmount = 'INVALID_TAKER_AMOUNT',
    DivisionByZero = 'DIVISION_BY_ZERO',
    RoundingError = 'ROUNDING_ERROR',
    InvalidSignature = 'INVALID_SIGNATURE',
    SignatureIllegal = 'SIGNATURE_ILLEGAL',
    SignatureInvalid = 'SIGNATURE_INVALID',
    SignatureUnsupported = 'SIGNATURE_UNSUPPORTED',
    TakerOverpay = 'TAKER_OVERPAY',
    OrderOverfill = 'ORDER_OVERFILL',
    InvalidFillPrice = 'INVALID_FILL_PRICE',
    InvalidNewOrderEpoch = 'INVALID_NEW_ORDER_EPOCH',
    CompleteFillFailed = 'COMPLETE_FILL_FAILED',
    NegativeSpreadRequired = 'NEGATIVE_SPREAD_REQUIRED',
    ReentrancyIllegal = 'REENTRANCY_ILLEGAL',
    InvalidTxHash = 'INVALID_TX_HASH',
    InvalidTxSignature = 'INVALID_TX_SIGNATURE',
    FailedExecution = 'FAILED_EXECUTION',
    AssetProxyAlreadyExists = 'ASSET_PROXY_ALREADY_EXISTS',
    LengthGreaterThan0Required = 'LENGTH_GREATER_THAN_0_REQUIRED',
    LengthGreaterThan3Required = 'LENGTH_GREATER_THAN_3_REQUIRED',
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
    LengthMismatch = 'LENGTH_MISMATCH',
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
    Erc721ZeroToAddress = 'ERC721_ZERO_TO_ADDRESS',
    Erc721OwnerMismatch = 'ERC721_OWNER_MISMATCH',
    Erc721InvalidSpender = 'ERC721_INVALID_SPENDER',
    Erc721ZeroOwner = 'ERC721_ZERO_OWNER',
    Erc721InvalidSelector = 'ERC721_INVALID_SELECTOR',
    WalletError = 'WALLET_ERROR',
    ValidatorError = 'VALIDATOR_ERROR',
    InvalidFunctionSelector = 'INVALID_FUNCTION_SELECTOR',
    InvalidAssetData = 'INVALID_ASSET_DATA',
    InvalidAssetProxy = 'INVALID_ASSET_PROXY',
    UnregisteredAssetProxy = 'UNREGISTERED_ASSET_PROXY',
    TxFullyConfirmed = 'TX_FULLY_CONFIRMED',
    TxNotFullyConfirmed = 'TX_NOT_FULLY_CONFIRMED',
    TimeLockIncomplete = 'TIME_LOCK_INCOMPLETE',
    // LibAddressArray
    InvalidFreeMemoryPtr = 'INVALID_FREE_MEMORY_PTR',
    // DutchAuction
    AuctionInvalidAmount = 'INVALID_AMOUNT',
    AuctionExpired = 'AUCTION_EXPIRED',
    AuctionNotStarted = 'AUCTION_NOT_STARTED',
    AuctionInvalidBeginTime = 'INVALID_BEGIN_TIME',
    InvalidAssetDataEnd = 'INVALID_ASSET_DATA_END',
    // Balance Threshold Filter
    InvalidOrBlockedExchangeSelector = 'INVALID_OR_BLOCKED_EXCHANGE_SELECTOR',
    BalanceQueryFailed = 'BALANCE_QUERY_FAILED',
    AtLeastOneAddressDoesNotMeetBalanceThreshold = 'AT_LEAST_ONE_ADDRESS_DOES_NOT_MEET_BALANCE_THRESHOLD',
    FromLessThanToRequired = 'FROM_LESS_THAN_TO_REQUIRED',
    ToLessThanLengthRequired = 'TO_LESS_THAN_LENGTH_REQUIRED',
    InvalidApprovalSignature = 'INVALID_APPROVAL_SIGNATURE',
    ApprovalExpired = 'APPROVAL_EXPIRED',
    InvalidOrigin = 'INVALID_ORIGIN',
    // ERC1155
    AmountEqualToOneRequired = 'AMOUNT_EQUAL_TO_ONE_REQUIRED',
    BadReceiverReturnValue = 'BAD_RECEIVER_RETURN_VALUE',
    CannotTransferToAddressZero = 'CANNOT_TRANSFER_TO_ADDRESS_ZERO',
    InsufficientAllowance = 'INSUFFICIENT_ALLOWANCE',
    NFTNotOwnedByFromAddress = 'NFT_NOT_OWNED_BY_FROM_ADDRESS',
    OwnersAndIdsMustHaveSameLength = 'OWNERS_AND_IDS_MUST_HAVE_SAME_LENGTH',
    TokenAndValuesLengthMismatch = 'TOKEN_AND_VALUES_LENGTH_MISMATCH',
    TriedToMintFungibleForNonFungibleToken = 'TRIED_TO_MINT_FUNGIBLE_FOR_NON_FUNGIBLE_TOKEN',
    TriedToMintNonFungibleForFungibleToken = 'TRIED_TO_MINT_NON_FUNGIBLE_FOR_FUNGIBLE_TOKEN',
    TransferRejected = 'TRANSFER_REJECTED',
    Uint256Underflow = 'UINT256_UNDERFLOW',
    InvalidIdsOffset = 'INVALID_IDS_OFFSET',
    InvalidValuesOffset = 'INVALID_VALUES_OFFSET',
    InvalidDataOffset = 'INVALID_DATA_OFFSET',
    InvalidAssetDataLength = 'INVALID_ASSET_DATA_LENGTH',
    // StaticCall
    InvalidStaticCallDataOffset = 'INVALID_STATIC_CALL_DATA_OFFSET',
    TargetNotEven = 'TARGET_NOT_EVEN',
    UnexpectedStaticCallResult = 'UNEXPECTED_STATIC_CALL_RESULT',
    TransfersSuccessful = 'TRANSFERS_SUCCESSFUL',
    // Staking
    InsufficientFunds = 'INSUFFICIENT_FUNDS',
    // AssetProxyOwner
    TxAlreadyExecuted = 'TX_ALREADY_EXECUTED',
    DefaultTimeLockIncomplete = 'DEFAULT_TIME_LOCK_INCOMPLETE',
    CustomTimeLockIncomplete = 'CUSTOM_TIME_LOCK_INCOMPLETE',
    EqualLengthsRequired = 'EQUAL_LENGTHS_REQUIRED',
    OnlyCallableByWallet = 'ONLY_CALLABLE_BY_WALLET',
    ChaiBridgeOnlyCallableByErc20BridgeProxy = 'ChaiBridge/ONLY_CALLABLE_BY_ERC20_BRIDGE_PROXY',
    ChaiBridgeDrawDaiFailed = 'ChaiBridge/DRAW_DAI_FAILED',
    DydxBridgeOnlyCallableByErc20BridgeProxy = 'DydxBridge/ONLY_CALLABLE_BY_ERC20_BRIDGE_PROXY',
    DydxBridgeUnrecognizedBridgeAction = 'DydxBridge/UNRECOGNIZED_BRIDGE_ACTION',
}

export enum StatusCodes {
    Success = 200,
    NotFound = 404,
    InternalError = 500,
    MethodNotAllowed = 405,
    GatewayTimeout = 504,
}

export interface ObjectMap<T> {
    [key: string]: T;
}

/**
 * makerAssetData: Subscribes to new orders with the specified `makerAssetData`
 * takerAssetData: subscribes to new orders with the specified `takerAssetData`
 * traderAssetData: subscribes to new orders where either `makerAssetData` or `takerAssetData` has the value specified
 * makerAssetProxyId: returns orders where the maker asset is of certain asset proxy id (example: `0xf47261b0` for ERC20, `0x02571792` for ERC721)
 * takerAssetProxyId: returns orders where the taker asset is of certain asset proxy id(example: `0xf47261b0` for ERC20, `0x02571792` for ERC721)
 * makerAssetAddress: subscribes to new orders where the contract address for the maker asset matches the value specified
 * takerAssetAddress: subscribes to new orders where the contract address for the taker asset matches the value specified
 */
export interface OrdersChannelSubscriptionOpts {
    makerAssetData?: string;
    takerAssetData?: string;
    traderAssetData?: string;
    makerAssetProxyId?: string;
    takerAssetProxyId?: string;
    makerAssetAddress?: string;
    takerAssetAddress?: string;
}

export type OrdersChannelMessage = UpdateOrdersChannelMessage | UnknownOrdersChannelMessage;

export enum OrdersChannelMessageTypes {
    Update = 'update',
    Unknown = 'unknown',
}

export interface UpdateOrdersChannelMessage {
    type: OrdersChannelMessageTypes.Update;
    requestId: string;
    payload: APIOrder[];
}

export interface UnknownOrdersChannelMessage {
    type: OrdersChannelMessageTypes.Unknown;
    requestId: string;
    payload: undefined;
}

export enum WebsocketConnectionEventType {
    Close = 'close',
    Error = 'error',
    Message = 'message',
}

export enum WebsocketClientEventType {
    Connect = 'connect',
    ConnectFailed = 'connectFailed',
}

export type OrdersResponse = PaginatedCollection<APIOrder>;

export interface APIOrder {
    order: SignedOrder;
    metaData: object;
}

export interface AssetPairsRequestOpts {
    assetDataA?: string;
    assetDataB?: string;
}

export type AssetPairsResponse = PaginatedCollection<AssetPairsItem>;

export interface AssetPairsItem {
    assetDataA: Asset;
    assetDataB: Asset;
}

export interface Asset {
    assetData: string;
    minAmount: BigNumber;
    maxAmount: BigNumber;
    precision: number;
}

export interface OrdersRequestOpts {
    makerAssetProxyId?: string;
    takerAssetProxyId?: string;
    makerAssetAddress?: string;
    takerAssetAddress?: string;
    exchangeAddress?: string;
    senderAddress?: string;
    makerAssetData?: string;
    takerAssetData?: string;
    makerFeeAssetData?: string;
    takerFeeAssetData?: string;
    makerAddress?: string;
    takerAddress?: string;
    traderAddress?: string;
    feeRecipientAddress?: string;
}

export interface OrderbookRequest {
    baseAssetData: string;
    quoteAssetData: string;
}

export interface OrderbookResponse {
    bids: PaginatedCollection<APIOrder>;
    asks: PaginatedCollection<APIOrder>;
}

export interface PaginatedCollection<T> {
    total: number;
    page: number;
    perPage: number;
    records: T[];
}

export interface OrderConfigRequest {
    makerAddress: string;
    takerAddress: string;
    makerAssetAmount: BigNumber;
    takerAssetAmount: BigNumber;
    makerAssetData: string;
    takerAssetData: string;
    exchangeAddress: string;
    expirationTimeSeconds: BigNumber;
}

export interface OrderConfigResponse {
    makerFee: BigNumber;
    takerFee: BigNumber;
    feeRecipientAddress: string;
    senderAddress: string;
    makerFeeAssetData: string;
    takerFeeAssetData: string;
}

export type FeeRecipientsResponse = PaginatedCollection<string>;

export interface RequestOpts {
    chainId?: number;
}

export interface PagedRequestOpts {
    page?: number;
    perPage?: number;
}

export interface TypeDocType {
    type: TypeDocTypes;
    value: string;
    name: string;
    types: TypeDocType[];
    typeArguments?: TypeDocType[];
    declaration: TypeDocNode;
    elementType?: TypeDocType;
    indexSignature?: TypeDocNode;
    elements?: TupleElement[];
}

export interface TupleElement {
    type: string;
    name: string;
}

export interface TypeDocNode {
    id?: number;
    name?: string;
    kind?: string;
    defaultValue?: string;
    kindString?: string;
    type?: TypeDocType;
    fileName?: string;
    line?: number;
    comment?: TypeDocNode;
    text?: string;
    shortText?: string;
    returns?: string;
    declaration: TypeDocNode;
    flags?: TypeDocFlags;
    indexSignature?: TypeDocNode;
    signatures?: TypeDocNode[];
    parameters?: TypeDocNode[];
    typeParameter?: TypeDocNode[];
    sources?: TypeDocNode[];
    children?: TypeDocNode[];
    groups?: TypeDocGroup[];
}

export interface TypeDocFlags {
    isStatic?: boolean;
    isOptional?: boolean;
    isPublic?: boolean;
    isExported?: boolean;
}

export interface TypeDocGroup {
    title: string;
    children: number[];
}

export enum TypeDocTypes {
    Intrinsic = 'intrinsic',
    Reference = 'reference',
    Array = 'array',
    StringLiteral = 'stringLiteral',
    Reflection = 'reflection',
    Union = 'union',
    TypeParameter = 'typeParameter',
    Intersection = 'intersection',
    Tuple = 'tuple',
    Unknown = 'unknown',
}

export interface CustomTypeChild {
    name: string;
    type?: Type;
    defaultValue?: string;
}

export interface Event {
    name: string;
    eventArgs: EventArg[];
}

export interface EventArg {
    isIndexed: boolean;
    name: string;
    type: Type;
}

export interface Property {
    name: string;
    type: Type;
    source?: Source;
    comment?: string;
    callPath?: string;
}

export interface BaseMethod {
    isConstructor: boolean;
    name: string;
    returnComment?: string | undefined;
    callPath: string;
    parameters: Parameter[];
    returnType: Type;
    comment?: string;
}

export interface BaseFunction {
    name: string;
    returnComment?: string | undefined;
    parameters: Parameter[];
    returnType: Type;
    comment?: string;
}

export interface TypeDefinitionByName {
    [typeName: string]: CustomType;
}

export interface DocAgnosticFormat {
    [sectionName: string]: DocSection;
}

export interface DocSection {
    comment: string;
    constructors: Array<TypescriptMethod | SolidityMethod>;
    methods: Array<TypescriptMethod | SolidityMethod>;
    properties: Property[];
    types: CustomType[];
    functions: TypescriptFunction[];
    events?: Event[];
    externalExportToLink?: ExternalExportToLink;
}

export interface TypescriptMethod extends BaseMethod {
    source?: Source;
    isStatic?: boolean;
    typeParameter?: TypeParameter;
}

export interface TypescriptFunction extends BaseFunction {
    source?: Source;
    typeParameter?: TypeParameter;
    callPath: string;
}

export interface SolidityMethod extends BaseMethod {
    isConstant?: boolean;
    isPayable?: boolean;
    isFallback?: boolean;
}

export interface Source {
    fileName: string;
    line: number;
}

export interface Parameter {
    name: string;
    comment: string;
    isOptional: boolean;
    type: Type;
    defaultValue?: string;
}

export interface TypeParameter {
    name: string;
    type: Type;
}

export interface Type {
    name: string;
    typeDocType: TypeDocTypes;
    value?: string;
    isExportedClassReference?: boolean;
    typeArguments?: Type[];
    elementType?: ElementType;
    types?: Type[];
    method?: TypescriptMethod;
    indexSignature?: IndexSignature;
    externalLink?: string;
    tupleElements?: Type[];
}

export interface ElementType {
    name: string;
    typeDocType: TypeDocTypes;
}

export interface IndexSignature {
    keyName: string;
    keyType: Type;
    valueName: string;
}

export interface CustomType {
    name: string;
    kindString: string;
    type?: Type;
    method?: TypescriptMethod;
    indexSignature?: IndexSignature;
    defaultValue?: string;
    comment?: string;
    children?: CustomTypeChild[];
}
export interface GeneratedDocJson {
    version: string;
    metadata: Metadata;
    typedocJson: TypeDocNode;
}

export interface ExportNameToTypedocNames {
    [exportName: string]: string[];
}

export interface ExternalTypeToLink {
    [externalTypeName: string]: string;
}

export interface ExternalExportToLink {
    [externalExport: string]: string;
}

export interface Metadata {
    exportPathToTypedocNames: ExportNameToTypedocNames;
    exportPathOrder: string[];
    externalTypeToLink: ExternalTypeToLink;
    externalExportToLink: ExternalExportToLink;
}

export interface EIP712Parameter {
    name: string;
    type: string;
}

export interface EIP712Types {
    [key: string]: EIP712Parameter[];
}

export type EIP712ObjectValue = string | number | EIP712Object;

export interface EIP712Object {
    [key: string]: EIP712ObjectValue;
}

export interface EIP712TypedData {
    types: EIP712Types;
    domain: EIP712Object;
    message: EIP712Object;
    primaryType: string;
}

export interface Stats {
    orderCount: number;
}

export interface DutchAuctionDetails {
    beginTimeSeconds: BigNumber;
    endTimeSeconds: BigNumber;
    beginAmount: BigNumber;
    endAmount: BigNumber;
    currentAmount: BigNumber;
    currentTimeSeconds: BigNumber;
}

export interface PackageJSONConfig {
    postpublish?: {
        assets?: string[];
        docOmitExports?: string[];
        dockerHubRepo?: string;
    };
    'abis:comment'?: string;
    abis?: string;
    ignoreDependencyVersions?: string;
    ignoreDependencyVersionsForPackage?: string;
}

export interface PackageJSON {
    private?: boolean;
    version: string;
    name: string;
    main?: string;
    scripts?: { [command: string]: string };
    config?: PackageJSONConfig;
    dependencies?: { [dependencyName: string]: string };
    devDependencies?: { [dependencyName: string]: string };
    workspaces?: string[];
}

export interface EIP712DomainWithDefaultSchema {
    name?: string;
    version?: string;
    chainId: number;
    verifyingContract: string;
}

export enum OrderStatus {
    Invalid,
    InvalidMakerAssetAmount,
    InvalidTakerAssetAmount,
    Fillable,
    Expired,
    FullyFilled,
    Cancelled,
}

export enum OrderTransferResults {
    TakerAssetDataFailed,
    MakerAssetDataFailed,
    TakerFeeAssetDataFailed,
    MakerFeeAssetDataFailed,
    TransfersSuccessful,
}

export interface FillResults {
    makerAssetFilledAmount: BigNumber;
    takerAssetFilledAmount: BigNumber;
    makerFeePaid: BigNumber;
    takerFeePaid: BigNumber;
    protocolFeePaid: BigNumber;
}

export interface MatchedFillResults {
    left: FillResults;
    right: FillResults;
    profitInLeftMakerAsset: BigNumber;
    profitInRightMakerAsset: BigNumber;
}

export interface BatchMatchedFillResults {
    left: FillResults[];
    right: FillResults[];
    profitInLeftMakerAsset: BigNumber;
    profitInRightMakerAsset: BigNumber;
}

export interface OrderInfo {
    orderStatus: number;
    orderHash: string;
    orderTakerAssetFilledAmount: BigNumber;
}

export interface DecodedLogEvent<ArgsType extends DecodedLogArgs> {
    isRemoved: boolean;
    log: LogWithDecodedArgs<ArgsType>;
}

export type EventCallback<ArgsType extends DecodedLogArgs> = (
    err: null | Error,
    log?: DecodedLogEvent<ArgsType>,
) => void;

export interface IndexedFilterValues {
    [index: string]: ContractEventArg;
}

export interface SimpleContractArtifact {
    schemaVersion: string;
    contractName: string;
    compilerOutput: SimpleStandardContractOutput;
    chains: ContractChains;
}

export interface SimpleStandardContractOutput {
    abi: ContractAbi;
    evm: SimpleEvmOutput;
    devdoc?: DevdocOutput;
}

export interface SimpleEvmOutput {
    bytecode: SimpleEvmBytecodeOutput;
}

export interface SimpleEvmBytecodeOutput {
    object: string;
}
