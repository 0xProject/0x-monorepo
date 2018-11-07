import { AssetBuyer } from '@0x/asset-buyer';
import { AssetProxyId, ObjectMap, SignedOrder } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Provider } from 'ethereum-types';

// Reusable
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
    InsufficientETH = 'INSUFFICIENT_ETH',
}

export type SimpleHandler = () => void;

export interface AffiliateInfo {
    feeRecipient: string;
    feePercentage: number;
}

/**
 * Our provider may be of 3 different types:
 * Props: the provider was passed in a prop to the component
 * Injected: the provider was injected into `window`
 * FallbackEmptyWallet: the provider has no wallet but responds to data requests using infura
 */
export enum ProviderType {
    Props = 'PROPS',
    Injected = 'INJECTED',
    FallbackEmptyWallet = 'FALLBACK_EMPTY_WALLET',
}

export interface ProviderState {
    type: ProviderType;
    provider: Provider;
    assetBuyer: AssetBuyer;
    web3Wrapper: Web3Wrapper;
}

export type OrderSource = string | SignedOrder[];
