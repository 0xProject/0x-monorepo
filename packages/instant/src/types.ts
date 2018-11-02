import { AssetProxyId, ObjectMap } from '@0x/types';
import { BigNumber } from '@0x/utils';

// Reusable
export type Maybe<T> = T | undefined;
export enum AsyncProcessState {
    NONE = 'None',
    PENDING = 'Pending',
    SUCCESS = 'Success',
    FAILURE = 'Failure',
}

export enum OrderProcessState {
    NONE = 'None',
    VALIDATING = 'Validating',
    PROCESSING = 'Processing',
    SUCCESS = 'Success',
    FAILURE = 'Failure',
}

export interface SimulatedProgress {
    startTimeUnix: number;
    expectedEndTimeUnix: number;
}

interface OrderStatePreTx {
    processState: OrderProcessState.NONE | OrderProcessState.VALIDATING;
}
interface OrderStatePostTx {
    processState: OrderProcessState.PROCESSING | OrderProcessState.SUCCESS | OrderProcessState.FAILURE;
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

export interface AffiliateInfo {
    feeRecipient: string;
    feePercentage: number;
}
