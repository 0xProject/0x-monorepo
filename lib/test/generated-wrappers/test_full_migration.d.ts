import { ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { ContractAbi, ContractArtifact, TxData, SupportedProvider } from 'ethereum-types';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare class TestFullMigrationContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }, deployer: string): Promise<TestFullMigrationContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }, deployer: string): Promise<TestFullMigrationContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }, deployer: string): Promise<TestFullMigrationContract>;
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
     * Destroy this contract. Only callable from ourselves (from `initializeZeroEx()`).
      * @param ethRecipient Receiver of any ETH in this contract.
     */
    die(ethRecipient: string): ContractTxFunctionObj<void>;
    dieRecipient(): ContractTxFunctionObj<string>;
    /**
     * Retrieve the bootstrapper address to use when constructing `ZeroEx`.
     */
    getBootstrapper(): ContractTxFunctionObj<string>;
    initializeCaller(): ContractTxFunctionObj<string>;
    /**
     * Initialize the `ZeroEx` contract with the full feature set,
 * transfer ownership to `owner`, then self-destruct.
      * @param owner The owner of the contract.
      * @param zeroEx The instance of the ZeroEx contract. ZeroEx should        been
     *     constructed with this contract as the bootstrapper.
      * @param features Features to add to the proxy.
      * @param migrateOpts Parameters needed to initialize features.
     */
    initializeZeroEx(owner: string, zeroEx: string, features: {
        registry: string;
        ownable: string;
        tokenSpender: string;
        transformERC20: string;
        signatureValidator: string;
        metaTransactions: string;
    }, migrateOpts: {
        transformerDeployer: string;
    }): ContractTxFunctionObj<string>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=test_full_migration.d.ts.map