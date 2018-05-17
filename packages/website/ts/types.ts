import { ECSignature } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

export enum Side {
    Receive = 'RECEIVE',
    Deposit = 'DEPOSIT',
}

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

export interface AssetToken {
    address?: string;
    amount?: BigNumber;
}

export interface SideToAssetToken {
    [side: string]: AssetToken;
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
}

export interface SignedOrder {
    maker: string;
    taker: string;
    makerTokenAddress: string;
    takerTokenAddress: string;
    makerFee: string;
    takerFee: string;
    makerTokenAmount: string;
    takerTokenAmount: string;
    expirationUnixTimestampSec: string;
    feeRecipient: string;
    salt: string;
    ecSignature: ECSignature;
    exchangeContractAddress: string;
}

export interface OrderMetadata {
    makerToken: OrderToken;
    takerToken: OrderToken;
}

export interface Order {
    signedOrder: SignedOrder;
    metadata: OrderMetadata;
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
    sendFailed,
    allowanceSettingFailed,
}

export enum ActionTypes {
    // Portal
    BatchDispatch = 'BATCH_DISPATCH',
    UpdateScreenWidth = 'UPDATE_SCREEN_WIDTH',
    UpdateNodeVersion = 'UPDATE_NODE_VERSION',
    ResetState = 'RESET_STATE',
    AddTokenToTokenByAddress = 'ADD_TOKEN_TO_TOKEN_BY_ADDRESS',
    BlockchainErrEncountered = 'BLOCKCHAIN_ERR_ENCOUNTERED',
    UpdateBlockchainIsLoaded = 'UPDATE_BLOCKCHAIN_IS_LOADED',
    UpdateNetworkId = 'UPDATE_NETWORK_ID',
    UpdateChosenAssetToken = 'UPDATE_CHOSEN_ASSET_TOKEN',
    UpdateChosenAssetTokenAddress = 'UPDATE_CHOSEN_ASSET_TOKEN_ADDRESS',
    UpdateOrderTakerAddress = 'UPDATE_ORDER_TAKER_ADDRESS',
    UpdateOrderSalt = 'UPDATE_ORDER_SALT',
    UpdateOrderECSignature = 'UPDATE_ORDER_EC_SIGNATURE',
    UpdateTokenByAddress = 'UPDATE_TOKEN_BY_ADDRESS',
    RemoveTokenFromTokenByAddress = 'REMOVE_TOKEN_FROM_TOKEN_BY_ADDRESS',
    ForceTokenStateRefetch = 'FORCE_TOKEN_STATE_REFETCH',
    UpdateOrderExpiry = 'UPDATE_ORDER_EXPIRY',
    SwapAssetTokens = 'SWAP_ASSET_TOKENS',
    UpdateUserAddress = 'UPDATE_USER_ADDRESS',
    UpdateUserEtherBalance = 'UPDATE_USER_ETHER_BALANCE',
    UpdateUserSuppliedOrderCache = 'UPDATE_USER_SUPPLIED_ORDER_CACHE',
    UpdateOrderFillAmount = 'UPDATE_ORDER_FILL_AMOUNT',
    UpdateShouldBlockchainErrDialogBeOpen = 'UPDATE_SHOULD_BLOCKCHAIN_ERR_DIALOG_BE_OPEN',

    // Docs
    UpdateLibraryVersion = 'UPDATE_LIBRARY_VERSION',
    UpdateAvailableLibraryVersions = 'UPDATE_AVAILABLE_LIBRARY_VERSIONS',

    // Shared
    ShowFlashMessage = 'SHOW_FLASH_MESSAGE',
    HideFlashMessage = 'HIDE_FLASH_MESSAGE',
    UpdateProviderType = 'UPDATE_PROVIDER_TYPE',
    UpdateInjectedProviderName = 'UPDATE_INJECTED_PROVIDER_NAME',
    UpdateSelectedLanguage = 'UPDATE_SELECTED_LANGUAGE',
}

export interface Action {
    type: ActionTypes;
    data?: any;
}

export interface TrackedTokensByNetworkId {
    [networkId: number]: Token[];
}

export interface TrackedTokensByUserAddress {
    [userAddress: string]: TrackedTokensByNetworkId;
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
export type ValidatedBigNumberCallback = (isValid: boolean, amount?: BigNumber, errorMessage?: React.ReactNode) => void;
export enum ScreenWidths {
    Sm = 'SM',
    Md = 'MD',
    Lg = 'LG',
}

export enum AlertTypes {
    ERROR,
    SUCCESS,
}

export enum BlockchainErrs {
    AContractNotDeployedOnNetwork = 'A_CONTRACT_NOT_DEPLOYED_ON_NETWORK',
    DisconnectedFromEthereumNode = 'DISCONNECTED_FROM_ETHEREUM_NODE',
    DefaultTokensNotInTokenRegistry = 'DEFAULT_TOKENS_NOT_IN_TOKEN_REGISTRY',
    NoError = 'NO_ERROR',
}

export enum BlockchainCallErrs {
    ContractDoesNotExist = 'CONTRACT_DOES_NOT_EXIST',
    UserHasNoAssociatedAddresses = 'USER_HAS_NO_ASSOCIATED_ADDRESSES',
    UnhandledError = 'UNHANDLED_ERROR',
    TokenAddressIsInvalid = 'TOKEN_ADDRESS_IS_INVALID',
}

export enum Environments {
    DEVELOPMENT,
    PRODUCTION,
}

export type ContractInstance = any; // TODO: add type definition for Contract

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

export enum ProviderType {
    Injected = 'INJECTED',
    Ledger = 'LEDGER',
}

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
    getAddress_async: (
        derivationPath: string,
        askForDeviceConfirmation: boolean,
        shouldGetChainCode: boolean,
    ) => Promise<LedgerGetAddressResult>;
    signPersonalMessage_async: (derivationPath: string, messageHex: string) => Promise<LedgerSignResult>;
    signTransaction_async: (derivationPath: string, txHex: string) => Promise<LedgerSignResult>;
    comm: LedgerCommunication;
}
export interface SignPersonalMessageParams {
    data: string;
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

export interface VersionToFilePath {
    [version: string]: string;
}

export enum Docs {
    ZeroExJs,
    SmartContracts,
}

export enum WebsiteLegacyPaths {
    ZeroExJs = '/docs/0xjs',
    Web3Wrapper = '/docs/web3_wrapper',
    Deployer = '/docs/deployer',
}

export enum WebsitePaths {
    Portal = '/portal',
    Wiki = '/wiki',
    ZeroExJs = '/docs/0x.js',
    Home = '/',
    FAQ = '/faq',
    About = '/about',
    Whitepaper = '/pdfs/0x_white_paper.pdf',
    SmartContracts = '/docs/contracts',
    Connect = '/docs/connect',
    Web3Wrapper = '/docs/web3-wrapper',
    SolCompiler = '/docs/sol-compiler',
    JSONSchemas = '/docs/json-schemas',
    SolCov = '/docs/sol-cov',
    Subproviders = '/docs/subproviders',
    OrderUtils = '/docs/order-utils',
    Jobs = '/jobs',
}

export enum DocPackages {
    Connect = 'CONNECT',
    ZeroExJs = 'ZERO_EX_JS',
    SmartContracts = 'SMART_CONTRACTS',
    Web3Wrapper = 'WEB3_WRAPPER',
    SolCompiler = 'SOL_COMPILER',
    JSONSchemas = 'JSON_SCHEMAS',
    SolCov = 'SOL_COV',
    Subproviders = 'SUBPROVIDERS',
    OrderUtils = 'ORDER_UTILS',
}

export enum Key {
    TopHeader = 'TOP_HEADER',
    TopTagline = 'TOP_TAGLINE',
    BuildCallToAction = 'BUILD_CALL_TO_ACTION',
    CommunityCallToAction = 'COMMUNITY_CALL_TO_ACTION',
    ProjectsHeader = 'PROJECTS_HEADER',
    FullListPrompt = 'FULL_LIST_PROMPT',
    FullListLink = 'FULL_LIST_LINK',
    TokenizedSectionHeader = 'TOKENIZED_SECTION_HEADER',
    TokenizedSectionDescription = 'TOKENIZED_SECTION_DESCRIPTION',
    Currency = 'CURRENCY',
    TraditionalAssets = 'TRADITIONAL_ASSETS',
    DigitalGoods = 'DIGITAL_GOODS',
    OffChainOrderRelay = 'OFFCHAIN_ORDER_RELAY',
    OonChainSettlement = 'OONCHAIN_SETTLEMENT',
    OffChainOnChainDescription = 'OFFCHAIN_ONCHAIN_DESCRIPTION',
    RelayersHeader = 'RELAYERS_HEADER',
    BenefitsHeader = 'BENEFITS_HEADER',
    BenefitOneTitle = 'BENEFIT_ONE_TITLE',
    BenefitOneDescription = 'BENEFIT_ONE_DESCRIPTION',
    BenefitTwoTitle = 'BENEFIT_TWO_TITLE',
    BenefitTwoDescription = 'BENEFIT_TWO_DESCRIPTION',
    BenefitThreeTitle = 'BENEFIT_THREE_TITLE',
    BenefitThreeDescription = 'BENEFIT_THREE_DESCRIPTION',
    BuildingBlockSectionHeader = 'BUILDING_BLOCK_SECTION_HEADER',
    BuildingBlockSectionDescription = 'BUILDING_BLOCK_SECTION_DESCRIPTION',
    DevToolsPrompt = 'DEV_TOOLS_PROMPT',
    SmartContract = 'SMART_CONTRACT',
    Docs = 'DOCS',
    DecentralizedGovernance = 'DECENTRALIZED_GOVERNANCE',
    DecentralizedGovernanceDescription = 'DECENTRALIZED_GOVERNANCE_DESCRIPTION',
    PredictionMarkets = 'PREDICTION_MARKETS',
    PredictionMarketsDescription = 'PREDICTION_MARKETS_DESCRIPTION',
    StableTokens = 'STABLE_TOKENS',
    StableTokensDescription = 'STABLE_TOKENS_DESCRIPTION',
    DecentralizedLoans = 'DECENTRALIZED_LOANS',
    DecentralizedLoansDescription = 'DECENTRALIZED_LOANS_DESCRIPTION',
    FundManagement = 'FUND_MANAGEMENT',
    FundManagementDescription = 'FUND_MANAGEMENT_DESCRIPTION',
    FinalCallToAction = 'FINAL_CALL_TO_ACTION',
    Documentation = 'DOCUMENTATION',
    Community = 'COMMUNITY',
    Organization = 'ORGANIZATION',
    About = 'ABOUT',
    Careers = 'CAREERS',
    Contact = 'CONTACT',
    SolCompiler = 'SOL_COMPILER',
    JsonSchemas = 'JSON_SCHEMAS',
    SolCov = 'SOL_COV',
    Subproviders = 'SUBPROVIDERS',
    Blog = 'BLOG',
    Forum = 'FORUM',
    Connect = 'CONNECT',
    Whitepaper = 'WHITEPAPER',
    Wiki = 'WIKI',
    Web3Wrapper = 'WEB3_WRAPPER',
    OrderUtils = 'ORDER_UTILS',
    And = 'AND',
    Faq = 'FAQ',
    SmartContracts = 'SMART_CONTRACTS',
    StandardRelayerApi = 'STANDARD_RELAYER_API',
    PortalDApp = 'PORTAL_DAPP',
    Website = 'WEBSITE',
    Developers = 'DEVELOPERS',
    Home = 'HOME',
    RocketChat = 'ROCKETCHAT',
}

export enum SmartContractDocSections {
    Introduction = 'Introduction',
    Exchange = 'Exchange',
    TokenTransferProxy = 'TokenTransferProxy',
    TokenRegistry = 'TokenRegistry',
    ZRXToken = 'ZRXToken',
}

export enum Language {
    English = 'EN',
    Spanish = 'ES',
    Chinese = 'ZH',
    Korean = 'KO',
    Russian = 'RU',
}

export enum Deco {
    Cap,
    CapWords,
    Upper,
}

export interface MaterialUIPosition {
    vertical: 'bottom' | 'top' | 'center';
    horizontal: 'left' | 'middle' | 'right';
}

export enum Providers {
    Parity = 'PARITY',
    Metamask = 'METAMASK',
    Mist = 'MIST',
}

export interface TimestampMsRange {
    startTimestampMs: number;
    endTimestampMs: number;
}

export interface OutdatedWrappedEtherByNetworkId {
    [networkId: number]: {
        address: string;
        timestampMsRange: TimestampMsRange;
    };
}

export interface ItemByAddress<T> {
    [address: string]: T;
}

export type TokenStateByAddress = ItemByAddress<TokenState>;

export interface TokenState {
    balance: BigNumber;
    allowance: BigNumber;
    isLoaded: boolean;
    price?: BigNumber;
}

export interface WebsiteBackendRelayerInfo {
    name: string;
    weeklyTxnVolume: string;
    url: string;
    appUrl?: string;
    headerImgUrl?: string;
    topTokens: WebsiteBackendTokenInfo[];
}

export interface WebsiteBackendPriceInfo {
    [symbol: string]: string;
}

export interface WebsiteBackendTokenInfo {
    address: string;
    decimals: number;
    name: string;
    symbol: string;
}

export interface WebsiteBackendGasInfo {
    average: number;
}
// tslint:disable:max-file-line-count
