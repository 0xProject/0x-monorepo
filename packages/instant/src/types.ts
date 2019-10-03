import { BigNumber, SwapQuoteConsumer, SwapQuoter } from '@0x/asset-swapper';
import { AssetProxyId, ObjectMap, SignedOrder } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { SupportedProvider, ZeroExProvider } from 'ethereum-types';

// Reusable
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type Maybe<T> = T | undefined;
export enum AsyncProcessState {
    None = 'NONE',
    Pending = 'PENDING',
    Success = 'SUCCESS',
    Failure = 'FAILURE',
}

export enum OrderProcessState {
    None = 'NONE',
    Validating = 'VALIDATING',
    Processing = 'PROCESSING',
    Success = 'SUCCESS',
    Failure = 'FAILURE',
}

export enum QuoteFetchOrigin {
    Manual = 'Manual',
    Heartbeat = 'Heartbeat',
}

export enum BaseCurrency {
    USD = 'USD', // tslint:disable-line:enum-naming
    ETH = 'ETH', // tslint:disable-line:enum-naming
}

export interface SimulatedProgress {
    startTimeUnix: number;
    expectedEndTimeUnix: number;
}

interface OrderStatePreTx {
    processState: OrderProcessState.None | OrderProcessState.Validating;
}
interface OrderStatePostTx {
    processState: OrderProcessState.Processing | OrderProcessState.Success | OrderProcessState.Failure;
    txHash: string;
    progress: SimulatedProgress;
}
export type OrderState = OrderStatePreTx | OrderStatePostTx;

export enum DisplayStatus {
    Present,
    Hidden,
}

export type FunctionType = (...args: any[]) => any;
export type ActionCreatorsMapObject = ObjectMap<FunctionType>;
export type ActionsUnion<A extends ActionCreatorsMapObject> = ReturnType<A[keyof A]>;

export interface ERC20AssetMetaData {
    assetProxyId: AssetProxyId.ERC20;
    decimals: number;
    primaryColor?: string;
    symbol: string;
    name: string;
    iconUrl?: string;
}

export interface ERC721AssetMetaData {
    assetProxyId: AssetProxyId.ERC721;
    name: string;
    imageUrl?: string;
    primaryColor?: string;
}

export type AssetMetaData = ERC20AssetMetaData | ERC721AssetMetaData;

export interface ERC20Asset {
    assetData: string;
    metaData: ERC20AssetMetaData;
}

export interface ERC721Asset {
    assetData: string;
    metaData: ERC721AssetMetaData;
}

export interface Asset {
    assetData: string;
    metaData: AssetMetaData;
}

export enum Network {
    Kovan = 42,
    Mainnet = 1,
}

export enum ZeroExInstantError {
    AssetMetaDataNotAvailable = 'ASSET_META_DATA_NOT_AVAILABLE',
    InsufficientETH = 'INSUFFICIENT_ETH', // tslint:disable-line:enum-naming
    CouldNotSubmitTransaction = 'COULD_NOT_SUBMIT_TRANSACTION',
}

export type SimpleHandler = () => void;

export interface AffiliateInfo {
    feeRecipient: string;
    feePercentage: number;
}

export interface ProviderState {
    name: string;
    displayName: string;
    provider: ZeroExProvider;
    swapQuoter: SwapQuoter;
    swapQuoteConsumer: SwapQuoteConsumer;
    web3Wrapper: Web3Wrapper;
    account: Account;
    orderSource: OrderSource;
}

export enum AccountState {
    None = 'NONE,',
    Loading = 'LOADING',
    Ready = 'READY',
    Locked = 'LOCKED',
}

export interface AccountReady {
    state: AccountState.Ready;
    address: string;
    ethBalanceInWei?: BigNumber;
}
export interface AccountNotReady {
    state: AccountState.None | AccountState.Loading | AccountState.Locked;
}

export type Account = AccountReady | AccountNotReady;

export type OrderSource = string | SignedOrder[];

export interface AddressAndEthBalanceInWei {
    address: string;
    ethBalanceInWei: BigNumber;
}

export type SlideAnimationState = 'slidIn' | 'slidOut' | 'none';

export enum StandardSlidingPanelContent {
    None = 'NONE',
    InstallWallet = 'INSTALL_WALLET',
}

export interface StandardSlidingPanelSettings {
    animationState: SlideAnimationState;
    content: StandardSlidingPanelContent;
}

export enum Browser {
    Chrome = 'CHROME',
    Firefox = 'FIREFOX',
    Opera = 'OPERA',
    Safari = 'SAFARI',
    Edge = 'EDGE',
    Other = 'OTHER',
}

export enum WalletSuggestion {
    CoinbaseWallet = 'Coinbase Wallet',
    MetaMask = 'MetaMask',
}

export enum OperatingSystem {
    Android = 'ANDROID',
    iOS = 'IOS', // tslint:disable-line:enum-naming
    Mac = 'MAC',
    Windows = 'WINDOWS',
    WindowsPhone = 'WINDOWS_PHONE',
    Linux = 'LINUX',
    Other = 'OTHER',
}

export enum ProviderType {
    Parity = 'PARITY',
    MetaMask = 'META_MASK',
    Mist = 'MIST',
    CoinbaseWallet = 'COINBASE_WALLET',
    Cipher = 'CIPHER',
    TrustWallet = 'TRUST_WALLET',
    Opera = 'OPERA',
    Fortmatic = 'Fortmatic',
    Fallback = 'FALLBACK',
}

export interface ZeroExInstantRequiredBaseConfig {
    orderSource: OrderSource;
}

export interface AffiliateInfo {
    feeRecipient: string;
    feePercentage: number;
}

export interface ZeroExInstantOptionalBaseConfig {
    provider: SupportedProvider;
    walletDisplayName: string;
    availableAssetDatas: string[];
    defaultAssetBuyAmount: number;
    defaultSelectedAssetData: string;
    additionalAssetMetaDataMap: ObjectMap<AssetMetaData>;
    networkId: Network;
    affiliateInfo: AffiliateInfo;
    shouldDisableAnalyticsTracking: boolean;
    onSuccess?: (txHash: string) => void;
}

export type ZeroExInstantBaseConfig = ZeroExInstantRequiredBaseConfig & Partial<ZeroExInstantOptionalBaseConfig>;
