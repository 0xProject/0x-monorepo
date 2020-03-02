import { ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { ContractAbi, ContractArtifact, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare class IAssetDataContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }): Promise<IAssetDataContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }): Promise<IAssetDataContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }): Promise<IAssetDataContract>;
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
     * Function signature for encoding ERC1155 assetData.
     * @param tokenAddress Address of ERC1155 token contract.
     * @param tokenIds Array of ids of tokens to be transferred.
     * @param values Array of values that correspond to each token id to be
     *     transferred.        Note that each value will be multiplied by the
     *     amount being filled in the order before transferring.
     * @param callbackData Extra data to be passed to receiver's
     *     `onERC1155Received` callback function.
     */
    ERC1155Assets(tokenAddress: string, tokenIds: BigNumber[], values: BigNumber[], callbackData: string): ContractTxFunctionObj<void>;
    /**
     * Function signature for encoding ERC20Bridge assetData.
     * @param tokenAddress Address of token to transfer.
     * @param bridgeAddress Address of the bridge contract.
     * @param bridgeData Arbitrary data to be passed to the bridge contract.
     */
    ERC20Bridge(tokenAddress: string, bridgeAddress: string, bridgeData: string): ContractTxFunctionObj<void>;
    /**
     * Function signature for encoding ERC20 assetData.
     * @param tokenAddress Address of ERC20Token contract.
     */
    ERC20Token(tokenAddress: string): ContractTxFunctionObj<void>;
    /**
     * Function signature for encoding ERC721 assetData.
     * @param tokenAddress Address of ERC721 token contract.
     * @param tokenId Id of ERC721 token to be transferred.
     */
    ERC721Token(tokenAddress: string, tokenId: BigNumber): ContractTxFunctionObj<void>;
    /**
     * Function signature for encoding MultiAsset assetData.
     * @param values Array of amounts that correspond to each asset to be
     *     transferred.        Note that each value will be multiplied by the
     *     amount being filled in the order before transferring.
     * @param nestedAssetData Array of assetData fields that will be be dispatched
     *     to their correspnding AssetProxy contract.
     */
    MultiAsset(values: BigNumber[], nestedAssetData: string[]): ContractTxFunctionObj<void>;
    /**
     * Function signature for encoding StaticCall assetData.
     * @param staticCallTargetAddress Address that will execute the staticcall.
     * @param staticCallData Data that will be executed via staticcall on the
     *     staticCallTargetAddress.
     * @param expectedReturnDataHash Keccak-256 hash of the expected staticcall
     *     return data.
     */
    StaticCall(staticCallTargetAddress: string, staticCallData: string, expectedReturnDataHash: string): ContractTxFunctionObj<void>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=i_asset_data.d.ts.map