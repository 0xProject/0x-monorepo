// tslint:disable:max-file-line-count

import { BigNumber } from 'bignumber.js';
import { ContractAbi, ContractNetworks, DevdocOutput } from 'ethereum-types';

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
 * ZeroExTransaction for use with 0x Exchange executeTransaction
 */
export interface ZeroExTransaction {
    salt: BigNumber;
    signerAddress: string;
    data: string;
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
    NSignatureTypes,
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

export type AssetData = ERC20AssetData | ERC721AssetData;

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
    Erc721ZeroToAddress = 'ERC721_ZERO_TO_ADDRESS',
    Erc721OwnerMismatch = 'ERC721_OWNER_MISMATCH',
    Erc721InvalidSpender = 'ERC721_INVALID_SPENDER',
    Erc721ZeroOwner = 'ERC721_ZERO_OWNER',
    Erc721InvalidSelector = 'ERC721_INVALID_SELECTOR',
    WalletError = 'WALLET_ERROR',
    ValidatorError = 'VALIDATOR_ERROR',
    InvalidFunctionSelector = 'INVALID_FUNCTION_SELECTOR',
    InvalidAssetProxy = 'INVALID_ASSET_PROXY',
    UnregisteredAssetProxy = 'UNREGISTERED_ASSET_PROXY',
    TxFullyConfirmed = 'TX_FULLY_CONFIRMED',
    TxNotFullyConfirmed = 'TX_NOT_FULLY_CONFIRMED',
    TimeLockIncomplete = 'TIME_LOCK_INCOMPLETE',
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
 * baseAssetData: The address of assetData designated as the baseToken in the currency pair calculation of price
 * quoteAssetData: The address of assetData designated as the quoteToken in the currency pair calculation of price
 * limit: Maximum number of bids and asks in orderbook snapshot
 */
export interface OrdersChannelSubscriptionOpts {
    baseAssetData: string;
    quoteAssetData: string;
    limit: number;
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
}

export type FeeRecipientsResponse = PaginatedCollection<string>;

export interface RequestOpts {
    networkId?: number;
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

export interface SimpleContractArtifact {
    schemaVersion: string;
    contractName: string;
    compilerOutput: SimpleStandardContractOutput;
    networks: ContractNetworks;
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
