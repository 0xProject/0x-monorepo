import { AssetProxyId, ObjectMap } from '@0x/types';

// Reusable
export enum AsyncProcessState {
    NONE = 'None',
    PENDING = 'Pending',
    SUCCESS = 'Success',
    FAILURE = 'Failure',
}

interface RegularOrderState {
    processState: AsyncProcessState.NONE | AsyncProcessState.PENDING;
}
interface SuccessfulOrderState {
    processState: AsyncProcessState.SUCCESS;
    txnHash: string;
}
interface FailureOrderState {
    processState: AsyncProcessState.FAILURE;
    txnHash?: string;
}
export type OrderState = RegularOrderState | SuccessfulOrderState | FailureOrderState;

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
    representationUrl?: string;
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
}
