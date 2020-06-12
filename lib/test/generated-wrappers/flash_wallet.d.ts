import { ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { ContractAbi, ContractArtifact, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare class FlashWalletContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string;
    static contractName: string;
    private readonly _methodABIIndex;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }): Promise<FlashWalletContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: (ContractArtifact | SimpleContractArtifact);
    }): Promise<FlashWalletContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }): Promise<FlashWalletContract>;
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
     * Execute an arbitrary call. Only an authority can call this.
      * @param target The call target.
      * @param callData The call data.
      * @param value Ether to attach to the call.
     */
    executeCall(target: string, callData: string, value: BigNumber): ContractTxFunctionObj<string>;
    /**
     * Execute an arbitrary delegatecall, in the context of this puppet.
 * Only an authority can call this.
      * @param target The call target.
      * @param callData The call data.
     */
    executeDelegateCall(target: string, callData: string): ContractTxFunctionObj<string>;
    /**
     * Allow this contract to receive ERC1155 tokens.
     */
    onERC1155BatchReceived(index_0: string, index_1: string, index_2: BigNumber[], index_3: BigNumber[], index_4: string): ContractTxFunctionObj<string>;
    /**
     * Allow this contract to receive ERC1155 tokens.
     */
    onERC1155Received(index_0: string, index_1: string, index_2: BigNumber, index_3: BigNumber, index_4: string): ContractTxFunctionObj<string>;
    owner(): ContractTxFunctionObj<string>;
    /**
     * Signal support for receiving ERC1155 tokens.
      * @param interfaceID The interface ID, as per ERC-165 rules.
     */
    supportsInterface(interfaceID: string): ContractTxFunctionObj<boolean>;
    /**
     * Allows this contract to receive ERC223 tokens.
     */
    tokenFallback(index_0: string, index_1: BigNumber, index_2: string): ContractTxFunctionObj<void>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=flash_wallet.d.ts.map