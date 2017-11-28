import BigNumber from 'bignumber.js';
import * as _ from 'lodash';

// Utility function to create a K:V from a list of strings
// Adapted from: https://basarat.gitbooks.io/typescript/content/docs/types/literal-types.html
function strEnum(values: string[]): {[key: string]: string} {
    return _.reduce(values, (result, key) => {
        result[key] = key;
        return result;
    }, Object.create(null));
}

export enum GenerateOrderSteps {
  ChooseAssets,
  GrantAllowance,
  RemainingConfigs,
  SignTransaction,
  CopyAndShare,
}

export const Side = strEnum([
  'receive',
  'deposit',
]);
export type Side = keyof typeof Side;

export const BlockchainErrs = strEnum([
  'A_CONTRACT_NOT_DEPLOYED_ON_NETWORK',
  'DISCONNECTED_FROM_ETHEREUM_NODE',
  'UNHANDLED_ERROR',
]);
export type BlockchainErrs = keyof typeof BlockchainErrs;

export const Direction = strEnum([
  'forward',
  'backward',
]);
export type Direction = keyof typeof Direction;

export interface Token {
    iconUrl?: string;
    name: string;
    address: string;
    symbol: string;
    decimals: number;
    isTracked: boolean;
    isRegistered: boolean;
}

export interface TokenByAddress {
    [address: string]: Token;
}

export interface TokenState {
    allowance: BigNumber;
    balance: BigNumber;
}

export interface TokenStateByAddress {
    [address: string]: TokenState;
}

export interface AssetToken {
    address?: string;
    amount?: BigNumber;
}

export interface SideToAssetToken {
    [side: string]: AssetToken;
}

export interface SignatureData {
    hash: string;
    r: string;
    s: string;
    v: number;
}

export interface HashData {
    depositAmount: BigNumber;
    depositTokenContractAddr: string;
    feeRecipientAddress: string;
    makerFee: BigNumber;
    orderExpiryTimestamp: BigNumber;
    orderMakerAddress: string;
    orderTakerAddress: string;
    receiveAmount: BigNumber;
    receiveTokenContractAddr: string;
    takerFee: BigNumber;
    orderSalt: BigNumber;
}

export interface OrderToken {
    name: string;
    symbol: string;
    decimals: number;
    address: string;
}

export interface OrderParty {
    address: string;
    token: OrderToken;
    amount: string;
    feeAmount: string;
}

export interface Order {
    maker: OrderParty;
    taker: OrderParty;
    expiration: string;
    feeRecipient: string;
    salt: string;
    signature: SignatureData;
    exchangeContract: string;
    networkId: number;
}

export interface Fill {
    logIndex: number;
    maker: string;
    taker: string;
    makerToken: string;
    takerToken: string;
    filledMakerTokenAmount: BigNumber;
    filledTakerTokenAmount: BigNumber;
    paidMakerFee: BigNumber;
    paidTakerFee: BigNumber;
    orderHash: string;
    transactionHash: string;
    blockTimestamp: number;
}

export enum BalanceErrs {
    incorrectNetworkForFaucet,
    faucetRequestFailed,
    faucetQueueIsFull,
    mintingFailed,
    wethConversionFailed,
    sendFailed,
    allowanceSettingFailed,
}

export const ActionTypes = strEnum([
    // Portal
    'UPDATE_SCREEN_WIDTH',
    'UPDATE_NODE_VERSION',
    'RESET_STATE',
    'ADD_TOKEN_TO_TOKEN_BY_ADDRESS',
    'BLOCKCHAIN_ERR_ENCOUNTERED',
    'CLEAR_TOKEN_BY_ADDRESS',
    'UPDATE_BLOCKCHAIN_IS_LOADED',
    'UPDATE_NETWORK_ID',
    'UPDATE_GENERATE_ORDER_STEP',
    'UPDATE_CHOSEN_ASSET_TOKEN',
    'UPDATE_CHOSEN_ASSET_TOKEN_ADDRESS',
    'UPDATE_ORDER_TAKER_ADDRESS',
    'UPDATE_ORDER_SALT',
    'UPDATE_ORDER_SIGNATURE_DATA',
    'UPDATE_TOKEN_BY_ADDRESS',
    'REMOVE_TOKEN_TO_TOKEN_BY_ADDRESS',
    'UPDATE_TOKEN_STATE_BY_ADDRESS',
    'REMOVE_FROM_TOKEN_STATE_BY_ADDRESS',
    'REPLACE_TOKEN_ALLOWANCE_BY_ADDRESS',
    'REPLACE_TOKEN_BALANCE_BY_ADDRESS',
    'UPDATE_TOKEN_BALANCE_BY_ADDRESS',
    'UPDATE_ORDER_EXPIRY',
    'SWAP_ASSET_TOKENS',
    'UPDATE_USER_ADDRESS',
    'UPDATE_USER_ETHER_BALANCE',
    'UPDATE_USER_SUPPLIED_ORDER_CACHE',
    'UPDATE_ORDER_FILL_AMOUNT',
    'UPDATE_SHOULD_BLOCKCHAIN_ERR_DIALOG_BE_OPEN',

    // Docs
    'UPDATE_LIBRARY_VERSION',
    'UPDATE_AVAILABLE_LIBRARY_VERSIONS',

    // Shared
    'SHOW_FLASH_MESSAGE',
    'HIDE_FLASH_MESSAGE',
    'UPDATE_PROVIDER_TYPE',
    'UPDATE_INJECTED_PROVIDER_NAME',
]);
export type ActionTypes = keyof typeof ActionTypes;

export interface Action {
    type: ActionTypes;
    data?: any;
}

export interface TrackedTokensByNetworkId {
    [networkId: number]: Token;
}

export interface Styles {
    [name: string]: React.CSSProperties;
}

export interface ProfileInfo {
    name: string;
    title?: string;
    description: string;
    image: string;
    linkedIn?: string;
    github?: string;
    angellist?: string;
    medium?: string;
    twitter?: string;
}

export interface Partner {
    name: string;
    logo: string;
    url: string;
}

export interface Statistic {
    title: string;
    figure: string;
}

export interface StatisticByKey {
    [key: string]: Statistic;
}

export interface ERC20MarketInfo {
    etherMarketCapUsd: number;
    numLiquidERC20Tokens: number;
    marketCapERC20TokensUsd: number;
}

export enum ExchangeContractErrs {
    OrderFillExpired = 'ORDER_FILL_EXPIRED',
    OrderAlreadyCancelledOrFilled = 'ORDER_ALREADY_CANCELLED_OR_FILLED',
    OrderRemainingFillAmountZero = 'ORDER_REMAINING_FILL_AMOUNT_ZERO',
    OrderFillRoundingError = 'ORDER_FILL_ROUNDING_ERROR',
    FillBalanceAllowanceError = 'FILL_BALANCE_ALLOWANCE_ERROR',
    InsufficientTakerBalance = 'INSUFFICIENT_TAKER_BALANCE',
    InsufficientTakerAllowance = 'INSUFFICIENT_TAKER_ALLOWANCE',
    InsufficientMakerBalance = 'INSUFFICIENT_MAKER_BALANCE',
    InsufficientMakerAllowance = 'INSUFFICIENT_MAKER_ALLOWANCE',
    TransactionSenderIsNotFillOrderTaker = 'TRANSACTION_SENDER_IS_NOT_FILL_ORDER_TAKER',
    InsufficientRemainingFillAmount = 'INSUFFICIENT_REMAINING_FILL_AMOUNT',
}

export interface ContractResponse {
    logs: ContractEvent[];
}

export interface ContractEvent {
    event: string;
    args: any;
}

export type InputErrMsg = React.ReactNode | string | undefined;
export type ValidatedBigNumberCallback = (isValid: boolean, amount?: BigNumber) => void;
export const ScreenWidths = strEnum([
  'SM',
  'MD',
  'LG',
]);
export type ScreenWidths = keyof typeof ScreenWidths;

export enum AlertTypes {
    ERROR,
    SUCCESS,
}

export const EtherscanLinkSuffixes = strEnum([
  'address',
  'tx',
]);
export type EtherscanLinkSuffixes = keyof typeof EtherscanLinkSuffixes;

export const BlockchainCallErrs = strEnum([
  'CONTRACT_DOES_NOT_EXIST',
  'USER_HAS_NO_ASSOCIATED_ADDRESSES',
  'UNHANDLED_ERROR',
  'TOKEN_ADDRESS_IS_INVALID',
  'INVALID_SIGNATURE',
]);
export type BlockchainCallErrs = keyof typeof BlockchainCallErrs;

export const KindString = strEnum([
  'Constructor',
  'Property',
  'Method',
  'Interface',
  'Type alias',
  'Variable',
  'Function',
  'Enumeration',
]);
export type KindString = keyof typeof KindString;

export interface EnumValue {
    name: string;
    defaultValue?: string;
}

export enum Environments {
    DEVELOPMENT,
    PRODUCTION,
}

export type ContractInstance = any; // TODO: add type definition for Contract

export interface TypeDocType {
    type: TypeDocTypes;
    value: string;
    name: string;
    types: TypeDocType[];
    typeArguments?: TypeDocType[];
    declaration: TypeDocNode;
    elementType?: TypeDocType;
}

export interface TypeDocFlags {
    isStatic?: boolean;
    isOptional?: boolean;
    isPublic?: boolean;
}

export interface TypeDocGroup {
    title: string;
    children: number[];
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
    indexSignature?: TypeDocNode[];
    signatures?: TypeDocNode[];
    parameters?: TypeDocNode[];
    typeParameter?: TypeDocNode[];
    sources?: TypeDocNode[];
    children?: TypeDocNode[];
    groups?: TypeDocGroup[];
}

export enum TypeDocTypes {
    Intrinsic = 'intrinsic',
    Reference = 'reference',
    Array = 'array',
    StringLiteral = 'stringLiteral',
    Reflection = 'reflection',
    Union = 'union',
    TypeParameter = 'typeParameter',
    Unknown = 'unknown',
}

export interface DocAgnosticFormat {
    [sectionName: string]: DocSection;
}

export interface DocSection {
    comment: string;
    constructors: Array<TypescriptMethod|SolidityMethod>;
    methods: Array<TypescriptMethod|SolidityMethod>;
    properties: Property[];
    types: CustomType[];
    events?: Event[];
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
}

export interface BaseMethod {
    isConstructor: boolean;
    name: string;
    returnComment?: string|undefined;
    callPath: string;
    parameters: Parameter[];
    returnType: Type;
    comment?: string;
}

export interface TypescriptMethod extends BaseMethod {
    source?: Source;
    isStatic?: boolean;
    typeParameter?: TypeParameter;
}

export interface SolidityMethod extends BaseMethod {
    isConstant?: boolean;
    isPayable?: boolean;
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
}

export interface TypeParameter {
    name: string;
    type: Type;
}

export interface Type {
    name: string;
    typeDocType: TypeDocTypes;
    value?: string;
    typeArguments?: Type[];
    elementType?: ElementType;
    types?: Type[];
    method?: TypescriptMethod;
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

export interface CustomTypeChild {
    name: string;
    type?: Type;
    defaultValue?: string;
}

export interface FAQQuestion {
    prompt: string;
    answer: React.ReactNode;
}
export interface FAQSection {
    name: string;
    questions: FAQQuestion[];
}

export interface S3FileObject {
    Key: {
        _text: string;
    };
}

export interface MenuSubsectionsBySection {
    [section: string]: string[];
}

export const ProviderType = strEnum([
  'INJECTED',
  'LEDGER',
]);
export type ProviderType = keyof typeof ProviderType;

export interface Fact {
    title: string;
    explanation: string;
    image: string;
}

interface LedgerGetAddressResult {
    address: string;
}
interface LedgerSignResult {
    v: string;
    r: string;
    s: string;
}
interface LedgerCommunication {
    close_async: () => Promise<void>;
}
export interface LedgerEthConnection {
    getAddress_async: (derivationPath: string, askForDeviceConfirmation: boolean,
                       shouldGetChainCode: boolean) => Promise<LedgerGetAddressResult>;
    signPersonalMessage_async: (derivationPath: string, messageHex: string) => Promise<LedgerSignResult>;
    signTransaction_async: (derivationPath: string, txHex: string) => Promise<LedgerSignResult>;
    comm: LedgerCommunication;
}
export interface SignPersonalMessageParams {
    data: string;
}

export interface LedgerWalletSubprovider {
    getPath: () => string;
    setPath: (path: string) => void;
    setPathIndex: (pathIndex: number) => void;
}

export interface TxParams {
    nonce: string;
    gasPrice?: number;
    gasLimit: string;
    to: string;
    value?: string;
    data?: string;
    chainId: number; // EIP 155 chainId - mainnet: 1, ropsten: 3
}

export interface PublicNodeUrlsByNetworkId {
    [networkId: number]: string[];
}

export interface JSONRPCPayload {
    params: any[];
    method: string;
}

export interface BlogPost {
    image: string;
    date: string;
    title: string;
    description: string;
    url: string;
}

export interface TypeDefinitionByName {
    [typeName: string]: CustomType;
}

export interface Article {
    section: string;
    title: string;
    content: string;
    fileName: string;
}

export interface ArticlesBySection {
    [section: string]: Article[];
}

export interface DialogConfigs {
    title: string;
    isModal: boolean;
    actions: any[];
}

export enum TokenVisibility {
    ALL = 'ALL',
    UNTRACKED = 'UNTRACKED',
    TRACKED = 'TRACKED',
}

export enum HeaderSizes {
    H1 = 'h1',
    H2 = 'h2',
    H3 = 'h3',
}

export interface DoxityDocObj {
    [contractName: string]: DoxityContractObj;
}

export interface DoxityContractObj {
    title: string;
    fileName: string;
    name: string;
    abiDocs: DoxityAbiDoc[];
}

export interface DoxityAbiDoc {
    constant: boolean;
    inputs: DoxityInput[];
    name: string;
    outputs: DoxityOutput[];
    payable: boolean;
    type: string;
    details?: string;
    return?: string;
}

export interface DoxityOutput {
    name: string;
    type: string;
}

export interface DoxityInput {
    name: string;
    type: string;
    description: string;
    indexed?: boolean;
}

export interface VersionToFileName {
    [version: string]: string;
}

export enum Docs {
    ZeroExJs,
    SmartContracts,
}

export interface ContractAddresses {
    [version: string]: {
        [network: string]: AddressByContractName;
    };
}

export interface AddressByContractName {
    [contractName: string]: string;
}

export enum Networks {
    mainnet = 'Mainnet',
    kovan = 'Kovan',
    ropsten = 'Ropsten',
    rinkeby = 'Rinkeby',
}

export enum AbiTypes {
    Constructor = 'constructor',
    Function = 'function',
    Event = 'event',
}

export enum WebsitePaths {
    Portal = '/portal',
    Wiki = '/wiki',
    ZeroExJs = '/docs/0xjs',
    Home = '/',
    FAQ = '/faq',
    About = '/about',
    Whitepaper = '/pdfs/0x_white_paper.pdf',
    SmartContracts = '/docs/contracts',
}

export interface DocsMenu {
    [sectionName: string]: string[];
}

export interface SectionsMap {
    [sectionName: string]: string;
}

export interface DocsInfoConfig {
  packageName: string;
  packageUrl: string;
  websitePath: string;
  docsJsonRoot: string;
  menu: DocsMenu;
  sections: SectionsMap;
  sectionNameToMarkdown: {[sectionName: string]: string};
  visibleConstructors: string[];
  convertToDocAgnosticFormatFn: (docObj: DoxityDocObj|TypeDocNode, docsInfo?: any) => DocAgnosticFormat;
  publicTypes?: string[];
  sectionNameToModulePath?: {[sectionName: string]: string[]};
  menuSubsectionToVersionWhenIntroduced?: {[sectionName: string]: string};
}

// tslint:disable:max-file-line-count
