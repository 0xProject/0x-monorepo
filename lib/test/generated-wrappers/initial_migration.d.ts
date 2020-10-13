import { ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { ContractAbi, ContractArtifact, TxData, SupportedProvider } from 'ethereum-types';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare class InitialMigrationContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }, initializeCaller_: string): Promise<InitialMigrationContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }, initializeCaller_: string): Promise<InitialMigrationContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }, initializeCaller_: string): Promise<InitialMigrationContract>;
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
    /**
     * Sets up the initial state of the `ZeroEx` contract.
 * The `ZeroEx` contract will delegatecall into this function.
      * @param owner The new owner of the ZeroEx contract.
      * @param features Features to bootstrap into the proxy.
     */
    bootstrap(owner: string, features: {
        registry: string;
        ownable: string;
    }): ContractTxFunctionObj<string>;
    /**
     * Self-destructs this contract. Only callable by this contract.
      * @param ethRecipient Who to transfer outstanding ETH to.
     */
    die(ethRecipient: string): ContractTxFunctionObj<void>;
    initializeCaller(): ContractTxFunctionObj<string>;
    /**
     * Initialize the `ZeroEx` contract with the minimum feature set,
 * transfers ownership to `owner`, then self-destructs.
 * Only callable by `initializeCaller` set in the contstructor.
      * @param owner The owner of the contract.
      * @param zeroEx The instance of the ZeroEx contract. ZeroEx should        been
     *     constructed with this contract as the bootstrapper.
      * @param features Features to bootstrap into the proxy.
     */
    initializeZeroEx(owner: string, zeroEx: string, features: {
        registry: string;
        ownable: string;
    }): ContractTxFunctionObj<string>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=initial_migration.d.ts.map