import { AssetProxyId, ObjectMap } from '@0x/types';

// Reusable
export enum AsyncProcessState {
    NONE = 'None',
    PENDING = 'Pending',
    SUCCESS = 'Success',
    FAILURE = 'Failure',
}
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
    primaryColor?: string;
}

export type AssetMetaData = ERC20AssetMetaData | ERC721AssetMetaData;

export enum Network {
    Kovan = 42,
    Mainnet = 1,
}
