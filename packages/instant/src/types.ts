import { AssetProxyId, ObjectMap } from '@0xproject/types';

// Reusable
export enum AsyncProcessState {
    NONE,
    PENDING,
    SUCCESS,
    FAILURE,
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
    assetProxyId: AssetProxyId.ERC20;
    assetData: string;
    metaData: ERC20AssetMetaData;
}

export interface ERC721Asset {
    assetProxyId: AssetProxyId.ERC721;
    assetData: string;
    metaData: ERC721AssetMetaData;
}
export interface Asset {
    assetProxyId: AssetProxyId;
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
