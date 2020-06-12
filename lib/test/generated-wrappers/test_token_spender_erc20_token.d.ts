import { ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { BlockRange, ContractAbi, ContractArtifact, DecodedLogArgs, LogWithDecodedArgs, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare type TestTokenSpenderERC20TokenEventArgs = TestTokenSpenderERC20TokenTransferFromCalledEventArgs;
export declare enum TestTokenSpenderERC20TokenEvents {
    TransferFromCalled = "TransferFromCalled"
}
export interface TestTokenSpenderERC20TokenTransferFromCalledEventArgs extends DecodedLogArgs {
    sender: string;
    from: string;
    to: string;
    amount: BigNumber;
}
export declare class TestTokenSpenderERC20TokenContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    private readonly _subscriptionManager;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }): Promise<TestTokenSpenderERC20TokenContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }): Promise<TestTokenSpenderERC20TokenContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }): Promise<TestTokenSpenderERC20TokenContract>;
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
    allowance(index_0: string, index_1: string): ContractTxFunctionObj<BigNumber>;
    approve(spender: string, amount: BigNumber): ContractTxFunctionObj<boolean>;
    balanceOf(index_0: string): ContractTxFunctionObj<BigNumber>;
    burn(owner: string, amount: BigNumber): ContractTxFunctionObj<void>;
    getSpendableAmount(owner: string, spender: string): ContractTxFunctionObj<BigNumber>;
    mint(owner: string, amount: BigNumber): ContractTxFunctionObj<void>;
    setBalanceAndAllowanceOf(owner: string, balance: BigNumber, spender: string, allowance_: BigNumber): ContractTxFunctionObj<void>;
    transfer(to: string, amount: BigNumber): ContractTxFunctionObj<boolean>;
    transferFrom(from: string, to: string, amount: BigNumber): ContractTxFunctionObj<boolean>;
    /**
     * Subscribe to an event type emitted by the TestTokenSpenderERC20Token contract.
     * @param eventName The TestTokenSpenderERC20Token contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    subscribe<ArgsType extends TestTokenSpenderERC20TokenEventArgs>(eventName: TestTokenSpenderERC20TokenEvents, indexFilterValues: IndexedFilterValues, callback: EventCallback<ArgsType>, isVerbose?: boolean, blockPollingIntervalMs?: number): string;
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
     * @param eventName The TestTokenSpenderERC20Token contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    getLogsAsync<ArgsType extends TestTokenSpenderERC20TokenEventArgs>(eventName: TestTokenSpenderERC20TokenEvents, blockRange: BlockRange, indexFilterValues: IndexedFilterValues): Promise<Array<LogWithDecodedArgs<ArgsType>>>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=test_token_spender_erc20_token.d.ts.map