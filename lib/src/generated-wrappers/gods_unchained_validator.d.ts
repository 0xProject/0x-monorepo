import { ContractFunctionObj, BaseContract } from '@0x/base-contract';
import { ContractAbi, ContractArtifact, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { SimpleContractArtifact } from '@0x/types';
export declare class GodsUnchainedValidatorContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }, _godsUnchained: string): Promise<GodsUnchainedValidatorContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }, _godsUnchained: string): Promise<GodsUnchainedValidatorContract>;
    /**
     * @returns      The contract ABI
     */
    static ABI(): ContractAbi;
    getFunctionSignature(methodName: string): string;
    getABIDecodedTransactionData<T>(methodName: string, callData: string): T;
    getABIDecodedReturnData<T>(methodName: string, callData: string): T;
    getSelector(methodName: string): string;
    /**
     * Checks that the given card (encoded as assetData) has the proto and quality encoded in `propertyData`.
     * Reverts if the card doesn't match the specified proto and quality.
     * @param tokenId The ERC721 tokenId of the card to check.
     * @param propertyData Encoded proto and quality that the card is expected to
     *     have.
     */
    checkBrokerAsset(tokenId: BigNumber, propertyData: string): ContractFunctionObj<void>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=gods_unchained_validator.d.ts.map