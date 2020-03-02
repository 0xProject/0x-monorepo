import { ContractFunctionObj, ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { BlockRange, ContractAbi, ContractArtifact, DecodedLogArgs, LogWithDecodedArgs, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare type WETH9EventArgs = WETH9ApprovalEventArgs | WETH9DepositEventArgs | WETH9TransferEventArgs | WETH9WithdrawalEventArgs;
export declare enum WETH9Events {
    Approval = "Approval",
    Deposit = "Deposit",
    Transfer = "Transfer",
    Withdrawal = "Withdrawal"
}
export interface WETH9ApprovalEventArgs extends DecodedLogArgs {
    _owner: string;
    _spender: string;
    _value: BigNumber;
}
export interface WETH9DepositEventArgs extends DecodedLogArgs {
    _owner: string;
    _value: BigNumber;
}
export interface WETH9TransferEventArgs extends DecodedLogArgs {
    _from: string;
    _to: string;
    _value: BigNumber;
}
export interface WETH9WithdrawalEventArgs extends DecodedLogArgs {
    _owner: string;
    _value: BigNumber;
}
export declare class WETH9Contract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    private readonly _subscriptionManager;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }): Promise<WETH9Contract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }): Promise<WETH9Contract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }): Promise<WETH9Contract>;
    /**
     * @returns      The contract ABI
     */
    static ABI(): ContractAbi;
    protected static _deployLibrariesAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, web3Wrapper: Web3Wrapper, txDefaults: Partial<TxData>, libraryAddresses?: {
        [libraryName: string]: string;
    }): Promise<{
        [libraryName: string]: string;
    }>;
    getFunctionSignature(methodName: string): string;
    getABIDecodedTransactionData<T>(methodName: string, callData: string): T;
    getABIDecodedReturnData<T>(methodName: string, callData: string): T;
    getSelector(methodName: string): string;
    allowance(index_0: string, index_1: string): ContractFunctionObj<BigNumber>;
    approve(guy: string, wad: BigNumber): ContractTxFunctionObj<boolean>;
    balanceOf(index_0: string): ContractFunctionObj<BigNumber>;
    decimals(): ContractFunctionObj<number>;
    deposit(): ContractTxFunctionObj<void>;
    name(): ContractFunctionObj<string>;
    symbol(): ContractFunctionObj<string>;
    totalSupply(): ContractFunctionObj<BigNumber>;
    transfer(dst: string, wad: BigNumber): ContractTxFunctionObj<boolean>;
    transferFrom(src: string, dst: string, wad: BigNumber): ContractTxFunctionObj<boolean>;
    withdraw(wad: BigNumber): ContractTxFunctionObj<void>;
    /**
     * Subscribe to an event type emitted by the WETH9 contract.
     * @param eventName The WETH9 contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    subscribe<ArgsType extends WETH9EventArgs>(eventName: WETH9Events, indexFilterValues: IndexedFilterValues, callback: EventCallback<ArgsType>, isVerbose?: boolean, blockPollingIntervalMs?: number): string;
    /**
     * Cancel a subscription
     * @param subscriptionToken Subscription token returned by `subscribe()`
     */
    unsubscribe(subscriptionToken: string): void;
    /**
     * Cancels all existing subscriptions
     */
    unsubscribeAll(): void;
    /**
     * Gets historical logs without creating a subscription
     * @param eventName The WETH9 contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    getLogsAsync<ArgsType extends WETH9EventArgs>(eventName: WETH9Events, blockRange: BlockRange, indexFilterValues: IndexedFilterValues): Promise<Array<LogWithDecodedArgs<ArgsType>>>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=weth9.d.ts.map