import { ContractFunctionObj, ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { ContractAbi, ContractArtifact, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare class CoordinatorContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string;
    static contractName: string;
    private readonly _methodABIIndex;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }, exchange: string, chainId: BigNumber): Promise<CoordinatorContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }, exchange: string, chainId: BigNumber): Promise<CoordinatorContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }, exchange: string, chainId: BigNumber): Promise<CoordinatorContract>;
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
    EIP712_COORDINATOR_APPROVAL_SCHEMA_HASH(): ContractFunctionObj<string>;
    EIP712_COORDINATOR_DOMAIN_HASH(): ContractFunctionObj<string>;
    EIP712_COORDINATOR_DOMAIN_NAME(): ContractFunctionObj<string>;
    EIP712_COORDINATOR_DOMAIN_VERSION(): ContractFunctionObj<string>;
    EIP712_EXCHANGE_DOMAIN_HASH(): ContractFunctionObj<string>;
    /**
     * Validates that the 0x transaction has been approved by all of the feeRecipients
     * that correspond to each order in the transaction's Exchange calldata.
     * @param transaction 0x transaction containing salt, signerAddress, and data.
     * @param txOrigin Required signer of Ethereum transaction calling this
     *     function.
     * @param transactionSignature Proof that the transaction has been signed by
     *     the signer.
     * @param approvalSignatures Array of signatures that correspond to the
     *     feeRecipients of each        order in the transaction's Exchange
     *     calldata.
     */
    assertValidCoordinatorApprovals(transaction: {
        salt: BigNumber;
        expirationTimeSeconds: BigNumber;
        gasPrice: BigNumber;
        signerAddress: string;
        data: string;
    }, txOrigin: string, transactionSignature: string, approvalSignatures: string[]): ContractFunctionObj<void>;
    /**
     * Decodes the orders from Exchange calldata representing any fill method.
     * @param data Exchange calldata representing a fill method.
     * @returns orders The orders from the Exchange calldata.
     */
    decodeOrdersFromFillData(data: string): ContractFunctionObj<Array<{
        makerAddress: string;
        takerAddress: string;
        feeRecipientAddress: string;
        senderAddress: string;
        makerAssetAmount: BigNumber;
        takerAssetAmount: BigNumber;
        makerFee: BigNumber;
        takerFee: BigNumber;
        expirationTimeSeconds: BigNumber;
        salt: BigNumber;
        makerAssetData: string;
        takerAssetData: string;
        makerFeeAssetData: string;
        takerFeeAssetData: string;
    }>>;
    /**
     * Executes a 0x transaction that has been signed by the feeRecipients that correspond to
     * each order in the transaction's Exchange calldata.
     * @param transaction 0x transaction containing salt, signerAddress, and data.
     * @param txOrigin Required signer of Ethereum transaction calling this
     *     function.
     * @param transactionSignature Proof that the transaction has been signed by
     *     the signer.
     * @param approvalSignatures Array of signatures that correspond to the
     *     feeRecipients of each        order in the transaction's Exchange
     *     calldata.
     */
    executeTransaction(transaction: {
        salt: BigNumber;
        expirationTimeSeconds: BigNumber;
        gasPrice: BigNumber;
        signerAddress: string;
        data: string;
    }, txOrigin: string, transactionSignature: string, approvalSignatures: string[]): ContractTxFunctionObj<void>;
    /**
     * Calculates the EIP712 hash of the Coordinator approval mesasage using the domain
     * separator of this contract.
     * @param approval Coordinator approval message containing the transaction
     *     hash, and transaction        signature.
     * @returns approvalHash EIP712 hash of the Coordinator approval message with the domain         separator of this contract.
     */
    getCoordinatorApprovalHash(approval: {
        txOrigin: string;
        transactionHash: string;
        transactionSignature: string;
    }): ContractFunctionObj<string>;
    /**
     * Recovers the address of a signer given a hash and signature.
     * @param hash Any 32 byte hash.
     * @param signature Proof that the hash has been signed by signer.
     * @returns signerAddress Address of the signer.
     */
    getSignerAddress(hash: string, signature: string): ContractFunctionObj<string>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=coordinator.d.ts.map