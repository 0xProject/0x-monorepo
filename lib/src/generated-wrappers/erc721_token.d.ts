import { ContractFunctionObj, ContractTxFunctionObj, BaseContract } from '@0x/base-contract';
import { BlockRange, ContractAbi, ContractArtifact, DecodedLogArgs, LogWithDecodedArgs, TxData, SupportedProvider } from 'ethereum-types';
import { BigNumber } from '@0x/utils';
import { EventCallback, IndexedFilterValues, SimpleContractArtifact } from '@0x/types';
import { Web3Wrapper } from '@0x/web3-wrapper';
export declare type ERC721TokenEventArgs = ERC721TokenApprovalEventArgs | ERC721TokenApprovalForAllEventArgs | ERC721TokenTransferEventArgs;
export declare enum ERC721TokenEvents {
    Approval = "Approval",
    ApprovalForAll = "ApprovalForAll",
    Transfer = "Transfer"
}
export interface ERC721TokenApprovalEventArgs extends DecodedLogArgs {
    _owner: string;
    _approved: string;
    _tokenId: BigNumber;
}
export interface ERC721TokenApprovalForAllEventArgs extends DecodedLogArgs {
    _owner: string;
    _operator: string;
    _approved: boolean;
}
export interface ERC721TokenTransferEventArgs extends DecodedLogArgs {
    _from: string;
    _to: string;
    _tokenId: BigNumber;
}
export declare class ERC721TokenContract extends BaseContract {
    /**
     * @ignore
     */
    static deployedBytecode: string | undefined;
    static contractName: string;
    private readonly _methodABIIndex;
    private readonly _subscriptionManager;
    static deployFrom0xArtifactAsync(artifact: ContractArtifact | SimpleContractArtifact, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }): Promise<ERC721TokenContract>;
    static deployWithLibrariesFrom0xArtifactAsync(artifact: ContractArtifact, libraryArtifacts: {
        [libraryName: string]: ContractArtifact;
    }, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractArtifact | SimpleContractArtifact;
    }): Promise<ERC721TokenContract>;
    static deployAsync(bytecode: string, abi: ContractAbi, supportedProvider: SupportedProvider, txDefaults: Partial<TxData>, logDecodeDependencies: {
        [contractName: string]: ContractAbi;
    }): Promise<ERC721TokenContract>;
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
     * The zero address indicates there is no approved address.
     * Throws unless `msg.sender` is the current NFT owner, or an authorized
     * operator of the current owner.
     * @param _approved The new approved NFT controller
     * @param _tokenId The NFT to approve
     */
    approve(_approved: string, _tokenId: BigNumber): ContractTxFunctionObj<void>;
    /**
     * NFTs assigned to the zero address are considered invalid, and this
     * function throws for queries about the zero address.
     * @param _owner An address for whom to query the balance
     * @returns The number of NFTs owned by &#x60;_owner&#x60;, possibly zero
     */
    balanceOf(_owner: string): ContractFunctionObj<BigNumber>;
    /**
     * Throws if `_tokenId` is not a valid NFT.
     * @param _tokenId The NFT to find the approved address for
     * @returns The approved address for this NFT, or the zero address if there is none
     */
    getApproved(_tokenId: BigNumber): ContractFunctionObj<string>;
    isApprovedForAll(_owner: string, _operator: string): ContractFunctionObj<boolean>;
    /**
     * NFTs assigned to zero address are considered invalid, and queries
     * about them do throw.
     * @param _tokenId The identifier for an NFT
     * @returns The address of the owner of the NFT
     */
    ownerOf(_tokenId: BigNumber): ContractFunctionObj<string>;
    /**
     * This works identically to the other function with an extra data parameter,
     * except this function just sets data to "".
     * @param _from The current owner of the NFT
     * @param _to The new owner
     * @param _tokenId The NFT to transfer
     */
    safeTransferFrom1(_from: string, _to: string, _tokenId: BigNumber): ContractTxFunctionObj<void>;
    /**
     * Throws unless `msg.sender` is the current owner, an authorized
     * operator, or the approved address for this NFT. Throws if `_from` is
     * not the current owner. Throws if `_to` is the zero address. Throws if
     * `_tokenId` is not a valid NFT. When transfer is complete, this function
     * checks if `_to` is a smart contract (code size > 0). If so, it calls
     * `onERC721Received` on `_to` and throws if the return value is not
     * `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`.
     * @param _from The current owner of the NFT
     * @param _to The new owner
     * @param _tokenId The NFT to transfer
     * @param _data Additional data with no specified format, sent in call to `_to`
     */
    safeTransferFrom2(_from: string, _to: string, _tokenId: BigNumber, _data: string): ContractTxFunctionObj<void>;
    /**
     * Emits the ApprovalForAll event. The contract MUST allow
     * multiple operators per owner.
     * @param _operator Address to add to the set of authorized operators
     * @param _approved True if the operator is approved, false to revoke approval
     */
    setApprovalForAll(_operator: string, _approved: boolean): ContractTxFunctionObj<void>;
    /**
     * Throws unless `msg.sender` is the current owner, an authorized
     * operator, or the approved address for this NFT. Throws if `_from` is
     * not the current owner. Throws if `_to` is the zero address. Throws if
     * `_tokenId` is not a valid NFT.
     * @param _from The current owner of the NFT
     * @param _to The new owner
     * @param _tokenId The NFT to transfer
     */
    transferFrom(_from: string, _to: string, _tokenId: BigNumber): ContractTxFunctionObj<void>;
    /**
     * Subscribe to an event type emitted by the ERC721Token contract.
     * @param eventName The ERC721Token contract event you would like to subscribe to.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param callback Callback that gets called when a log is added/removed
     * @param isVerbose Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    subscribe<ArgsType extends ERC721TokenEventArgs>(eventName: ERC721TokenEvents, indexFilterValues: IndexedFilterValues, callback: EventCallback<ArgsType>, isVerbose?: boolean, blockPollingIntervalMs?: number): string;
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
     * @param eventName The ERC721Token contract event you would like to subscribe to.
     * @param blockRange Block range to get logs from.
     * @param indexFilterValues An object where the keys are indexed args returned by the event and
     * the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return Array of logs that match the parameters
     */
    getLogsAsync<ArgsType extends ERC721TokenEventArgs>(eventName: ERC721TokenEvents, blockRange: BlockRange, indexFilterValues: IndexedFilterValues): Promise<Array<LogWithDecodedArgs<ArgsType>>>;
    constructor(address: string, supportedProvider: SupportedProvider, txDefaults?: Partial<TxData>, logDecodeDependencies?: {
        [contractName: string]: ContractAbi;
    }, deployedBytecode?: string | undefined);
}
//# sourceMappingURL=erc721_token.d.ts.map