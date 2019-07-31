import { ObjectMap, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { Provider } from 'ethereum-types';
import * as React from 'react';

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
    isRegistered: boolean;
    trackedTimestamp?: number;
}

export interface TokenByAddress {
    [address: string]: Token;
}

export interface Styleable {
    style: React.CSSProperties;
    children: React.ReactNode;
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

export interface OrderMetadata {
    makerToken: OrderToken;
    takerToken: OrderToken;
}

export interface PortalOrder {
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
    IncorrectNetworkForFaucet,
    FaucetRequestFailed,
    FaucetQueueIsFull,
    MintingFailed,
    SendFailed,
    AllowanceSettingFailed,
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
    UpdateOrderSignature = 'UPDATE_ORDER_SIGNATURE',
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
    UpdatePortalOnboardingStep = 'UPDATE_ONBOARDING_STEP',
    UpdatePortalOnboardingShowing = 'UPDATE_PORTAL_ONBOARDING_SHOWING',

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

export interface GoogleSheetLeadUrls {
    [key: string]: string;
}

export interface ContractResponse {
    logs: ContractEvent[];
}

export interface ContractEvent {
    event: string;
    args: any;
}

export type ValidatedBigNumberCallback = (isValid: boolean, amount?: BigNumber) => void;
// Associated values are in `em` units
export enum ScreenWidths {
    Sm = 40,
    Md = 52,
    Lg = 64,
}

export enum AlertTypes {
    Error,
    Success,
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
    Development = 'DEVELOPMENT',
    Dogfood = 'DOGFOOD',
    Staging = 'STAGING',
    Production = 'PRODUCTION',
    Unknown = 'UNKNOWN',
}

export type ContractInstance = any; // TODO: add type definition for Contract

export interface ExploreProjectInstantMetadata {
    orderSource: string;
    availableAssetDatas?: string[];
}

export interface ExploreProject {
    name: string;
    label: string;
    description: string;
    logo_url: string;
    theme_color: string;
    url: string;
    keywords: string[];
    instant?: ExploreProjectInstantMetadata;
    logo_max_width?: string;
    onInstantClick?(): void;
    onAnalytics?(action: ExploreAnalyticAction): void;
}

export enum ExploreAnalyticAction {
    InstantClick = 'INSTANT_CLICK',
    LinkClick = 'LINK_CLICK',
    FilterClick = 'FILTER_CLICK',
    QuerySearched = 'QUERY_SEARCHED',
}

export enum ExploreTilesOrdering {
    Alphabetical = 'ALPHABETICAL',
    RecentlyAdded = 'RECENTLY_ADDED',
    Popular = 'POPULAR',
}

export enum ExploreTilesOrderingType {
    HardCodedByName = 'HARDCODED_BY_NAME',
    // for other ordering logics in the future
    DynamicBySortFunction = 'DYNAMIC_BY_SORT',
}

export interface ExploreTilesOrderingMetadata {
    label: string;
    ordering: ExploreTilesOrdering;
    type: ExploreTilesOrderingType;
    hardCoded?: string[];
    sort?(tiles: ExploreTile[]): ExploreTile[];
}

export enum ExploreTilesModifiers {
    Filter = 'FILTER',
    Search = 'SEARCH',
    Editorial = 'EDITORIAL',
    Ordering = 'ORDERING',
}

export enum ExploreFilterType {
    All = 'ALL',
    Keyword = 'Keyword',
}

export interface ExploreFilterMetadata {
    label: string;
    filterType: ExploreFilterType;
    name: string;
    active?: boolean;
}

export enum ExploreTileVisibility {
    Hidden = 'HIDDEN',
    Visible = 'VISIBLE',
}

export enum ExploreTileWidth {
    OneThird = 'ONE_THIRD',
    FullWidth = 'FULL_WIDTH',
    Half = 'HALF',
    TwoThirds = 'TWO_THIRDS',
}

export enum ExploreTileGridWidth {
    ThreeColumn = 6,
    TwoColumn = 4,
    OneColumn = 2,
}

export interface ExploreTile {
    name: string;
    visibility: ExploreTileVisibility;
    width?: ExploreTileWidth;
    exploreProject?: ExploreProject;
    component?: React.ReactNode;
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
    All = 'ALL',
    Untracked = 'UNTRACKED',
    Tracked = 'TRACKED',
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
    Jobs = '/jobs',
}

export enum WebsitePaths {
    Portal = '/portal',
    Wiki = '/wiki',
    Docs = '/docs',
    ZeroExJs = '/docs/0x.js',
    Home = '/',
    FAQ = '/faq', // tslint:disable-line:enum-naming
    About = '/about',
    AboutMission = '/about/mission',
    AboutTeam = '/about/team',
    AboutPress = '/about/press',
    AboutJobs = '/about/jobs',
    Community = '/community',
    LaunchKit = '/launch-kit',
    Instant = '/instant',
    Ecosystem = '/eap',
    MarketMaker = '/market-maker',
    Governance = '/governance',
    Why = '/why',
    Whitepaper = '/pdfs/0x_white_paper.pdf',
    SmartContracts = '/docs/contracts',
    Connect = '/docs/connect',
    Web3Wrapper = '/docs/web3-wrapper',
    ContractWrappers = '/docs/contract-wrappers',
    OrderWatcher = '/docs/order-watcher',
    SolCompiler = '/docs/sol-compiler',
    JSONSchemas = '/docs/json-schemas',
    SolCoverage = '/docs/sol-coverage',
    SolProfiler = '/docs/sol-profiler',
    SolTrace = '/docs/sol-trace',
    Subproviders = '/docs/subproviders',
    OrderUtils = '/docs/order-utils',
    EthereumTypes = '/docs/ethereum-types',
    AssetBuyer = '/docs/asset-buyer',
    AssetSwapper = '/docs/asset-swapper',
    Migrations = '/docs/migrations',
    Careers = '/careers',
    Credits = '/credits',
    Vote = '/vote',
    Extensions = '/extensions',
    Explore = '/explore',
}

export enum DocPackages {
    Connect = 'CONNECT',
    ZeroExJs = 'ZERO_EX_JS',
    SmartContracts = 'SMART_CONTRACTS',
    Web3Wrapper = 'WEB3_WRAPPER',
    SolCompiler = 'SOL_COMPILER',
    JSONSchemas = 'JSON_SCHEMAS',
    SolCoverage = 'SOL_COVERAGE',
    SolTrace = 'SOL_TRACE',
    SolProfiler = 'SOL_PROFILER',
    Subproviders = 'SUBPROVIDERS',
    OrderUtils = 'ORDER_UTILS',
    EthereumTypes = 'ETHEREUM_TYPES',
    ContractWrappers = 'CONTRACT_WRAPPERS',
    OrderWatcher = 'ORDER_WATCHER',
    AssetBuyer = 'ASSET_BUYER',
    AssetSwapper = 'ASSET_SWAPPER',
    Migrations = 'MIGRATIONS',
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
    OnChainSettlement = 'ONCHAIN_SETTLEMENT',
    OffChainOnChainDescription = 'OFFCHAIN_ONCHAIN_DESCRIPTION',
    RelayersHeader = 'RELAYERS_HEADER',
    BenefitsHeader = 'BENEFITS_HEADER',
    UseCasesHeader = 'USE_CASES_HEADER',
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
    GamingAndCollectables = 'GAMING_AND_COLLECTABLES',
    GamingAndCollectablesDescription = 'GAMING_AND_COLLECTABLES_DESCRIPTION',
    OrderBooks = 'ORDER_BOOKS',
    OrderBooksDescription = 'ORDER_BOOKS_DESCRIPTION',
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
    EthereumTypes = 'ETHEREUM_TYPES',
    Subproviders = 'SUBPROVIDERS',
    ZeroExJs = '0X_JS',
    ContractWrappers = 'CONTRACT_WRAPPERS',
    OrderWatcher = 'ORDER_WATCHER',
    AssetBuyer = 'ASSET_BUYER',
    AssetSwapper = 'ASSET_SWAPPER',
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
    Discord = 'DISCORD',
    TradeCallToAction = 'TRADE_CALL_TO_ACTION',
    OurMissionAndValues = 'OUR_MISSION_AND_VALUES',
    BuildARelayer = 'BUILD_A_RELAYER',
    BuildARelayerDescription = 'BUILD_A_RELAYER_DESCRIPTION',
    DevelopOnEthereum = 'DEVELOP_ON_ETHEREUM',
    DevelopOnEthereumDescription = 'DEVELOP_ON_ETHEREUM_DESCRIPTION',
    OrderBasics = 'ORDER_BASICS',
    OrderBasicsDescription = 'ORDER_BASICS_DESCRIPTION',
    UseNetworkedLiquidity = 'USE_NETWORKED_LIQUIDITY',
    UseNetworkedLiquidityDescription = 'USE_NETWORKED_LIQUIDITY_DESCRIPTION',
    Integrate0xInstant = 'INTEGRATE_0X_INSTANT',
    Integrate0xInstantDescription = 'INTEGRATE_0X_INSTANT_DESCRIPTION',
    ViewAllDocumentation = 'VIEW_ALL_DOCUMENTATION',
    Sandbox = 'SANDBOX',
    Github = 'GITHUB',
    LiveChat = 'LIVE_CHAT',
    LibrariesAndTools = 'LIBRARIES_AND_TOOLS',
    LibrariesAndToolsDescription = 'LIBRARIES_AND_TOOLS_DESCRIPTION',
    More = 'MORE',
    StartBuildOn0x = 'START_BUILDING_ON_0X',
    StartBuildOn0xDescription = 'START_BUILDING_ON_0X_DESCRIPTION',
    LaunchKit = 'LAUNCH_KIT',
    LaunchKitPitch = 'LAUNCH_KIT_PITCH',
    ExploreTheDocs = 'EXPLORE_THE_DOCS',
    EnableTrading = 'ENABLE_TRADING',
    ForkAndExtend = 'FORK_AND_EXTEND',
    LocalMarket = 'LOCAL_MARKET',
    SeemlesslyCreate = 'SEEMLESSLY_CREATE',
    QuicklyLaunch = 'QUICKLY_LAUNCH',
    TapIntoAndShare = 'TAP_INTO_AND_SHARE',
    PerfectForDevelopers = 'PERFECT_FOR_DEVELOPERS',
    GetInTouch = 'GET_IN_TOUCH',
    LearnMore = 'LEARN_MORE',
    GetStarted = 'GET_STARTED',
    ProtocolSpecification = 'PROTOCOL_SPECIFICATION',
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
    CoinbaseWallet = 'COINBASE_WALLET',
    Cipher = 'CIPHER',
}

export interface InjectedProviderUpdate {
    selectedAddress: string;
    networkVersion: string;
}

export interface InjectedProviderObservable {
    subscribe(updateHandler: (update: InjectedProviderUpdate) => void): void;
    unsubscribe(updateHandler: (update: InjectedProviderUpdate) => void): void;
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

export type ItemByAddress<T> = ObjectMap<T>;

export type TokenStateByAddress = ItemByAddress<TokenState>;

export interface TokenState {
    balance: BigNumber;
    allowance: BigNumber;
    isLoaded: boolean;
    price?: BigNumber;
}

export interface WebsiteBackendRelayerInfo {
    name: string;
    weeklyTxnVolume?: string;
    url: string;
    appUrl?: string;
    headerImgUrl?: string;
    logoImgUrl?: string;
    primaryColor?: string;
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
    safeSlow: number;
    average: number;
    fast: number;
    fastest: number;
}

export interface WebsiteBackendJobInfo {
    id: number;
    title: string;
    department: string;
    office: string;
    url: string;
}

export enum BrowserType {
    Chrome = 'Chrome',
    Firefox = 'Firefox',
    Opera = 'Opera',
    Safari = 'Safari',
    Edge = 'Edge',
    Other = 'Other',
}

export enum OperatingSystemType {
    Android = 'Android',
    iOS = 'iOS', // tslint:disable-line:enum-naming
    Mac = 'Mac',
    Windows = 'Windows',
    WindowsPhone = 'WindowsPhone',
    Linux = 'Linux',
    Other = 'Other',
}

export enum AccountState {
    Disconnected = 'Disconnected',
    Ready = 'Ready',
    Loading = 'Loading',
    Locked = 'Locked',
}

export interface InjectedProvider extends Provider {
    publicConfigStore?: InjectedProviderObservable;
}

export interface TutorialInfo {
    iconUrl: string;
    description: string;
    link: ALink;
}

export enum Categories {
    ZeroExProtocolTypescript = '0x Protocol (Typescript/Javascript)',
    ZeroExProtocolPython = '0x Protocol (Python)',
    Ethereum = 'Ethereum (Typescript/Javascript)',
    CommunityMaintained = 'Community Maintained',
}

export interface Package {
    description: string;
    link: ALink;
}

export type VoteOutcome = 'accepted' | 'rejected';
export type VoteTime = 'upcoming' | 'happening';
export type VoteStatus = VoteOutcome | VoteTime;

export interface TallyInterface {
    zeipId?: number;
    yes?: BigNumber;
    no?: BigNumber;
    blockNumber?: string;
}

export interface SectionNameToMarkdownByVersion {
    [version: string]: { [sectionName: string]: string };
}

export interface DocsInfoConfig {
    id: string;
    packageName: string;
    type: SupportedDocJson;
    displayName: string;
    packageUrl: string;
    markdownMenu: DocsMenu;
    markdownSections: SectionsMap;
    sectionNameToMarkdownByVersion: SectionNameToMarkdownByVersion;
    contractsByVersionByNetworkId?: ContractsByVersionByNetworkId;
}

export interface DocsMenu {
    [sectionName: string]: string[];
}

export interface SectionsMap {
    [sectionName: string]: string;
}

// Exception: We don't make the values uppercase because these KindString's need to
// match up those returned by TypeDoc
export enum KindString {
    Constructor = 'Constructor',
    Property = 'Property',
    Method = 'Method',
    Interface = 'Interface',
    TypeAlias = 'Type alias',
    ObjectLiteral = 'Object literal',
    Variable = 'Variable',
    Function = 'Function',
    Enumeration = 'Enumeration',
    Class = 'Class',
}

export enum SupportedDocJson {
    SolDoc = 'SOL_DOC',
    TypeDoc = 'TYPEDOC',
}

export interface ContractsByVersionByNetworkId {
    [version: string]: {
        [networkName: string]: {
            [contractName: string]: string;
        };
    };
}

export interface AddressByContractName {
    [contractName: string]: string;
}

export interface EnumValue {
    name: string;
    defaultValue?: string;
}

export enum AbiTypes {
    Constructor = 'constructor',
    Function = 'function',
    Event = 'event',
}
export interface Styles {
    [name: string]: React.CSSProperties;
}

export enum HeaderSizes {
    H1 = 'h1',
    H2 = 'h2',
    H3 = 'h3',
}

export enum EtherscanLinkSuffixes {
    Address = 'address',
    Tx = 'tx',
}

export enum Networks {
    Mainnet = 'Mainnet',
    Kovan = 'Kovan',
    Ropsten = 'Ropsten',
    Rinkeby = 'Rinkeby',
}

export enum LinkType {
    External = 'EXTERNAL',
    ReactScroll = 'REACT_SCROLL',
    ReactRoute = 'REACT_ROUTE',
}

export interface ALink {
    title: string;
    to: string;
    shouldOpenInNewTab?: boolean;
}
// tslint:disable:max-file-line-count
