import { ContractFunctionObj, ContractTxFunctionObj, PromiseWithTransactionHash } from '@0x/base-contract';
import { BlockParam, CallData } from 'ethereum-types';

// tslint:disable:max-classes-per-file
// Generated Wrapper Interfaces
export abstract class AssetProxyDispatcher {
    public abstract registerAssetProxy(assetProxy: string): ContractTxFunctionObj<void>;
    public abstract getAssetProxy(assetProxyId: string): ContractFunctionObj<string>;
}

export abstract class Ownable {
    public abstract transferOwnership(newOwner: string): ContractTxFunctionObj<void>;

    public abstract owner(callData?: Partial<CallData>, defaultBlock?: BlockParam): ContractFunctionObj<string>;
}
export abstract class Authorizable extends Ownable {
    public abstract addAuthorizedAddress(target: string): ContractTxFunctionObj<void>;
    public abstract removeAuthorizedAddress(target: string): ContractTxFunctionObj<void>;
    public abstract authorized(authority: string): ContractFunctionObj<boolean>;
    public abstract getAuthorizedAddresses(): ContractFunctionObj<string[]>;
}
