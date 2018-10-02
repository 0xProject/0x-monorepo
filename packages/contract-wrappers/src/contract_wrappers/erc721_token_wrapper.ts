import { artifacts, wrappers } from '@0xproject/contracts';
import { schemas } from '@0xproject/json-schemas';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { ContractAbi, LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { methodOptsSchema } from '../schemas/method_opts_schema';
import { txOptsSchema } from '../schemas/tx_opts_schema';
import {
    BlockRange,
    ContractWrappersError,
    EventCallback,
    IndexedFilterValues,
    MethodOpts,
    TransactionOpts,
} from '../types';
import { assert } from '../utils/assert';
import { constants } from '../utils/constants';

import { ContractWrapper } from './contract_wrapper';
import { ERC721ProxyWrapper } from './erc721_proxy_wrapper';

const removeUndefinedProperties = _.pickBy;

/**
 * This class includes all the functionality related to interacting with ERC721 token contracts.
 * All ERC721 method calls are supported, along with some convenience methods for getting/setting allowances
 * to the 0x ERC721 Proxy smart contract.
 */
export class ERC721TokenWrapper extends ContractWrapper {
    public abi: ContractAbi = artifacts.ERC721Token.compilerOutput.abi;
    private _tokenContractsByAddress: { [address: string]: wrappers.ERC721TokenContract };
    private _erc721ProxyWrapper: ERC721ProxyWrapper;
    /**
     * Instantiate ERC721TokenWrapper
     * @param web3Wrapper Web3Wrapper instance to use
     * @param networkId Desired networkId
     * @param erc721ProxyWrapper The ERC721ProxyWrapper instance to use
     * @param blockPollingIntervalMs The block polling interval to use for active subscriptions
     */
    constructor(
        web3Wrapper: Web3Wrapper,
        networkId: number,
        erc721ProxyWrapper: ERC721ProxyWrapper,
        blockPollingIntervalMs?: number,
    ) {
        super(web3Wrapper, networkId, blockPollingIntervalMs);
        this._tokenContractsByAddress = {};
        this._erc721ProxyWrapper = erc721ProxyWrapper;
    }
    /**
     * Count all NFTs assigned to an owner
     * NFTs assigned to the zero address are considered invalid, and this function throws for queries about the zero address.
     * @param   tokenAddress    The hex encoded contract Ethereum address where the ERC721 token is deployed.
     * @param   ownerAddress    The hex encoded user Ethereum address whose balance you would like to check.
     * @param   methodOpts      Optional arguments this method accepts.
     * @return  The number of NFTs owned by `ownerAddress`, possibly zero
     */
    public async getTokenCountAsync(
        tokenAddress: string,
        ownerAddress: string,
        methodOpts: MethodOpts = {},
    ): Promise<BigNumber> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const normalizedOwnerAddress = ownerAddress.toLowerCase();

        const tokenContract = await this._getTokenContractAsync(normalizedTokenAddress);

        const txData = {};
        let balance = await tokenContract.balanceOf.callAsync(normalizedOwnerAddress, txData, methodOpts.defaultBlock);
        // Wrap BigNumbers returned from web3 with our own (later) version of BigNumber
        balance = new BigNumber(balance);
        return balance;
    }
    /**
     * Find the owner of an NFT
     * NFTs assigned to zero address are considered invalid, and queries about them do throw.
     * @param   tokenAddress    The hex encoded contract Ethereum address where the ERC721 token is deployed.
     * @param   tokenId         The identifier for an NFT
     * @param   methodOpts      Optional arguments this method accepts.
     * @return  The address of the owner of the NFT
     */
    public async getOwnerOfAsync(
        tokenAddress: string,
        tokenId: BigNumber,
        methodOpts: MethodOpts = {},
    ): Promise<string> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.isBigNumber('tokenId', tokenId);
        assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);
        const normalizedTokenAddress = tokenAddress.toLowerCase();

        const tokenContract = await this._getTokenContractAsync(normalizedTokenAddress);

        const txData = {};
        try {
            const tokenOwner = await tokenContract.ownerOf.callAsync(tokenId, txData, methodOpts.defaultBlock);
            return tokenOwner;
        } catch (err) {
            throw new Error(ContractWrappersError.ERC721OwnerNotFound);
        }
    }
    /**
     * Query if an address is an authorized operator for all NFT's of `ownerAddress`
     * @param   tokenAddress    The hex encoded contract Ethereum address where the ERC721 token is deployed.
     * @param   ownerAddress    The hex encoded user Ethereum address of the token owner.
     * @param   operatorAddress The hex encoded user Ethereum address of the operator you'd like to check if approved.
     * @param   methodOpts      Optional arguments this method accepts.
     * @return  True if `operatorAddress` is an approved operator for `ownerAddress`, false otherwise
     */
    public async isApprovedForAllAsync(
        tokenAddress: string,
        ownerAddress: string,
        operatorAddress: string,
        methodOpts: MethodOpts = {},
    ): Promise<boolean> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.isETHAddressHex('operatorAddress', operatorAddress);
        assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const normalizedOwnerAddress = ownerAddress.toLowerCase();
        const normalizedOperatorAddress = operatorAddress.toLowerCase();

        const tokenContract = await this._getTokenContractAsync(normalizedTokenAddress);

        const txData = {};
        const isApprovedForAll = await tokenContract.isApprovedForAll.callAsync(
            normalizedOwnerAddress,
            normalizedOperatorAddress,
            txData,
            methodOpts.defaultBlock,
        );
        return isApprovedForAll;
    }
    /**
     * Query if 0x proxy is an authorized operator for all NFT's of `ownerAddress`
     * @param   tokenAddress    The hex encoded contract Ethereum address where the ERC721 token is deployed.
     * @param   ownerAddress    The hex encoded user Ethereum address of the token owner.
     * @param   methodOpts      Optional arguments this method accepts.
     * @return  True if `operatorAddress` is an approved operator for `ownerAddress`, false otherwise
     */
    public async isProxyApprovedForAllAsync(
        tokenAddress: string,
        ownerAddress: string,
        methodOpts: MethodOpts = {},
    ): Promise<boolean> {
        const proxyAddress = this._erc721ProxyWrapper.getContractAddress();
        const isProxyApprovedForAll = await this.isApprovedForAllAsync(
            tokenAddress,
            ownerAddress,
            proxyAddress,
            methodOpts,
        );
        return isProxyApprovedForAll;
    }
    /**
     * Get the approved address for a single NFT. Returns undefined if no approval was set
     * Throws if `_tokenId` is not a valid NFT
     * @param   tokenAddress    The hex encoded contract Ethereum address where the ERC721 token is deployed.
     * @param   tokenId         The identifier for an NFT
     * @param   methodOpts      Optional arguments this method accepts.
     * @return  The approved address for this NFT, or the undefined if there is none
     */
    public async getApprovedIfExistsAsync(
        tokenAddress: string,
        tokenId: BigNumber,
        methodOpts: MethodOpts = {},
    ): Promise<string | undefined> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.isBigNumber('tokenId', tokenId);
        assert.doesConformToSchema('methodOpts', methodOpts, methodOptsSchema);
        const normalizedTokenAddress = tokenAddress.toLowerCase();

        const tokenContract = await this._getTokenContractAsync(normalizedTokenAddress);

        const txData = {};
        const approvedAddress = await tokenContract.getApproved.callAsync(tokenId, txData, methodOpts.defaultBlock);
        if (approvedAddress === constants.NULL_ADDRESS) {
            return undefined;
        }
        return approvedAddress;
    }
    /**
     * Checks if 0x proxy is approved for a single NFT
     * Throws if `_tokenId` is not a valid NFT
     * @param   tokenAddress    The hex encoded contract Ethereum address where the ERC721 token is deployed.
     * @param   tokenId         The identifier for an NFT
     * @param   methodOpts      Optional arguments this method accepts.
     * @return  True if 0x proxy is approved
     */
    public async isProxyApprovedAsync(
        tokenAddress: string,
        tokenId: BigNumber,
        methodOpts: MethodOpts = {},
    ): Promise<boolean> {
        const proxyAddress = this._erc721ProxyWrapper.getContractAddress();
        const approvedAddress = await this.getApprovedIfExistsAsync(tokenAddress, tokenId, methodOpts);
        const isProxyApproved = approvedAddress === proxyAddress;
        return isProxyApproved;
    }
    /**
     * Enable or disable approval for a third party ("operator") to manage all of `ownerAddress`'s assets.
     * Throws if `_tokenId` is not a valid NFT
     * Emits the ApprovalForAll event.
     * @param   tokenAddress    The hex encoded contract Ethereum address where the ERC721 token is deployed.
     * @param   ownerAddress    The hex encoded user Ethereum address of the token owner.
     * @param   operatorAddress The hex encoded user Ethereum address of the operator you'd like to set approval for.
     * @param   isApproved      The boolean variable to set the approval to.
     * @param   txOpts          Transaction parameters.
     * @return  Transaction hash.
     */
    public async setApprovalForAllAsync(
        tokenAddress: string,
        ownerAddress: string,
        operatorAddress: string,
        isApproved: boolean,
        txOpts: TransactionOpts = {},
    ): Promise<string> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        await assert.isSenderAddressAsync('ownerAddress', ownerAddress, this._web3Wrapper);
        assert.isETHAddressHex('operatorAddress', operatorAddress);
        assert.isBoolean('isApproved', isApproved);
        assert.doesConformToSchema('txOpts', txOpts, txOptsSchema);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const normalizedOwnerAddress = ownerAddress.toLowerCase();
        const normalizedOperatorAddress = operatorAddress.toLowerCase();

        const tokenContract = await this._getTokenContractAsync(normalizedTokenAddress);
        const txHash = await tokenContract.setApprovalForAll.sendTransactionAsync(
            normalizedOperatorAddress,
            isApproved,
            removeUndefinedProperties({
                gas: txOpts.gasLimit,
                gasPrice: txOpts.gasPrice,
                from: normalizedOwnerAddress,
            }),
        );
        return txHash;
    }
    /**
     * Enable or disable approval for a third party ("operator") to manage all of `ownerAddress`'s assets.
     * Throws if `_tokenId` is not a valid NFT
     * Emits the ApprovalForAll event.
     * @param   tokenAddress    The hex encoded contract Ethereum address where the ERC721 token is deployed.
     * @param   ownerAddress    The hex encoded user Ethereum address of the token owner.
     * @param   operatorAddress The hex encoded user Ethereum address of the operator you'd like to set approval for.
     * @param   isApproved      The boolean variable to set the approval to.
     * @param   txOpts          Transaction parameters.
     * @return  Transaction hash.
     */
    public async setProxyApprovalForAllAsync(
        tokenAddress: string,
        ownerAddress: string,
        isApproved: boolean,
        txOpts: TransactionOpts = {},
    ): Promise<string> {
        const proxyAddress = this._erc721ProxyWrapper.getContractAddress();
        const txHash = await this.setApprovalForAllAsync(tokenAddress, ownerAddress, proxyAddress, isApproved, txOpts);
        return txHash;
    }
    /**
     * Set or reaffirm the approved address for an NFT
     * The zero address indicates there is no approved address. Throws unless `msg.sender` is the current NFT owner,
     * or an authorized operator of the current owner.
     * Throws if `_tokenId` is not a valid NFT
     * Emits the Approval event.
     * @param   tokenAddress    The hex encoded contract Ethereum address where the ERC721 token is deployed.
     * @param   approvedAddress The hex encoded user Ethereum address you'd like to set approval for.
     * @param   tokenId         The identifier for an NFT
     * @param   txOpts          Transaction parameters.
     * @return  Transaction hash.
     */
    public async setApprovalAsync(
        tokenAddress: string,
        approvedAddress: string,
        tokenId: BigNumber,
        txOpts: TransactionOpts = {},
    ): Promise<string> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.isETHAddressHex('approvedAddress', approvedAddress);
        assert.isBigNumber('tokenId', tokenId);
        assert.doesConformToSchema('txOpts', txOpts, txOptsSchema);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const normalizedApprovedAddress = approvedAddress.toLowerCase();

        const tokenContract = await this._getTokenContractAsync(normalizedTokenAddress);
        const tokenOwnerAddress = await tokenContract.ownerOf.callAsync(tokenId);
        await assert.isSenderAddressAsync('tokenOwnerAddress', tokenOwnerAddress, this._web3Wrapper);
        const txHash = await tokenContract.approve.sendTransactionAsync(
            normalizedApprovedAddress,
            tokenId,
            removeUndefinedProperties({
                gas: txOpts.gasLimit,
                gasPrice: txOpts.gasPrice,
                from: tokenOwnerAddress,
            }),
        );
        return txHash;
    }
    /**
     * Set or reaffirm 0x proxy as an approved address for an NFT
     * Throws unless `msg.sender` is the current NFT owner, or an authorized operator of the current owner.
     * Throws if `_tokenId` is not a valid NFT
     * Emits the Approval event.
     * @param   tokenAddress    The hex encoded contract Ethereum address where the ERC721 token is deployed.
     * @param   tokenId         The identifier for an NFT
     * @param   txOpts          Transaction parameters.
     * @return  Transaction hash.
     */
    public async setProxyApprovalAsync(
        tokenAddress: string,
        tokenId: BigNumber,
        txOpts: TransactionOpts = {},
    ): Promise<string> {
        const proxyAddress = this._erc721ProxyWrapper.getContractAddress();
        const txHash = await this.setApprovalAsync(tokenAddress, proxyAddress, tokenId, txOpts);
        return txHash;
    }
    /**
     * Enable or disable approval for a third party ("operator") to manage all of `ownerAddress`'s assets.
     * Throws if `_tokenId` is not a valid NFT
     * Emits the ApprovalForAll event.
     * @param   tokenAddress    The hex encoded contract Ethereum address where the ERC721 token is deployed.
     * @param   receiverAddress The hex encoded Ethereum address of the user to send the NFT to.
     * @param   senderAddress The hex encoded Ethereum address of the user to send the NFT to.
     * @param   tokenId         The identifier for an NFT
     * @param   txOpts          Transaction parameters.
     * @return  Transaction hash.
     */
    public async transferFromAsync(
        tokenAddress: string,
        receiverAddress: string,
        senderAddress: string,
        tokenId: BigNumber,
        txOpts: TransactionOpts = {},
    ): Promise<string> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.isETHAddressHex('receiverAddress', receiverAddress);
        await assert.isSenderAddressAsync('senderAddress', senderAddress, this._web3Wrapper);
        assert.doesConformToSchema('txOpts', txOpts, txOptsSchema);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const normalizedReceiverAddress = receiverAddress.toLowerCase();
        const normalizedSenderAddress = senderAddress.toLowerCase();
        const tokenContract = await this._getTokenContractAsync(normalizedTokenAddress);
        const ownerAddress = await this.getOwnerOfAsync(tokenAddress, tokenId);
        if (normalizedSenderAddress !== ownerAddress) {
            const isApprovedForAll = await this.isApprovedForAllAsync(
                normalizedTokenAddress,
                ownerAddress,
                normalizedSenderAddress,
            );
            if (!isApprovedForAll) {
                const approvedAddress = await this.getApprovedIfExistsAsync(normalizedTokenAddress, tokenId);
                if (approvedAddress !== normalizedSenderAddress) {
                    throw new Error(ContractWrappersError.ERC721NoApproval);
                }
            }
        }
        const txHash = await tokenContract.transferFrom.sendTransactionAsync(
            ownerAddress,
            normalizedReceiverAddress,
            tokenId,
            removeUndefinedProperties({
                gas: txOpts.gasLimit,
                gasPrice: txOpts.gasPrice,
                from: normalizedSenderAddress,
            }),
        );
        return txHash;
    }
    /**
     * Subscribe to an event type emitted by the Token contract.
     * @param   tokenAddress        The hex encoded address where the ERC721 token is deployed.
     * @param   eventName           The token contract event you would like to subscribe to.
     * @param   indexFilterValues   An object where the keys are indexed args returned by the event and
     *                              the value is the value you are interested in. E.g `{maker: aUserAddressHex}`
     * @param   callback            Callback that gets called when a log is added/removed
     * @param   isVerbose           Enable verbose subscription warnings (e.g recoverable network issues encountered)
     * @return Subscription token used later to unsubscribe
     */
    public subscribe<ArgsType extends wrappers.ERC721TokenEventArgs>(
        tokenAddress: string,
        eventName: wrappers.ERC721TokenEvents,
        indexFilterValues: IndexedFilterValues,
        callback: EventCallback<ArgsType>,
        isVerbose: boolean = false,
    ): string {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.doesBelongToStringEnum('eventName', eventName, wrappers.ERC721TokenEvents);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        assert.isFunction('callback', callback);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const subscriptionToken = this._subscribe<ArgsType>(
            normalizedTokenAddress,
            eventName,
            indexFilterValues,
            artifacts.ERC721Token.compilerOutput.abi,
            callback,
            isVerbose,
        );
        return subscriptionToken;
    }
    /**
     * Cancel a subscription
     * @param   subscriptionToken Subscription token returned by `subscribe()`
     */
    public unsubscribe(subscriptionToken: string): void {
        assert.isValidSubscriptionToken('subscriptionToken', subscriptionToken);
        this._unsubscribe(subscriptionToken);
    }
    /**
     * Cancels all existing subscriptions
     */
    public unsubscribeAll(): void {
        super._unsubscribeAll();
    }
    /**
     * Gets historical logs without creating a subscription
     * @param   tokenAddress        An address of the token that emitted the logs.
     * @param   eventName           The token contract event you would like to subscribe to.
     * @param   blockRange          Block range to get logs from.
     * @param   indexFilterValues   An object where the keys are indexed args returned by the event and
     *                              the value is the value you are interested in. E.g `{_from: aUserAddressHex}`
     * @return  Array of logs that match the parameters
     */
    public async getLogsAsync<ArgsType extends wrappers.ERC721TokenEventArgs>(
        tokenAddress: string,
        eventName: wrappers.ERC721TokenEvents,
        blockRange: BlockRange,
        indexFilterValues: IndexedFilterValues,
    ): Promise<Array<LogWithDecodedArgs<ArgsType>>> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.doesBelongToStringEnum('eventName', eventName, wrappers.ERC721TokenEvents);
        assert.doesConformToSchema('blockRange', blockRange, schemas.blockRangeSchema);
        assert.doesConformToSchema('indexFilterValues', indexFilterValues, schemas.indexFilterValuesSchema);
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        const logs = await this._getLogsAsync<ArgsType>(
            normalizedTokenAddress,
            eventName,
            blockRange,
            indexFilterValues,
            artifacts.ERC721Token.compilerOutput.abi,
        );
        return logs;
    }
    // HACK: We don't want this method to be visible to the other units within that package but not to the end user.
    // TS doesn't give that possibility and therefore we make it private and access it over an any cast. Because of that tslint sees it as unused.
    // tslint:disable-next-line:no-unused-variable
    private _invalidateContractInstances(): void {
        this.unsubscribeAll();
        this._tokenContractsByAddress = {};
    }
    private async _getTokenContractAsync(tokenAddress: string): Promise<wrappers.ERC721TokenContract> {
        const normalizedTokenAddress = tokenAddress.toLowerCase();
        let tokenContract = this._tokenContractsByAddress[normalizedTokenAddress];
        if (!_.isUndefined(tokenContract)) {
            return tokenContract;
        }
        const [abi, address] = await this._getContractAbiAndAddressFromArtifactsAsync(
            artifacts.ERC721Token,
            normalizedTokenAddress,
        );
        const contractInstance = new wrappers.ERC721TokenContract(
            abi,
            address,
            this._web3Wrapper.getProvider(),
            this._web3Wrapper.getContractDefaults(),
        );
        tokenContract = contractInstance;
        this._tokenContractsByAddress[normalizedTokenAddress] = tokenContract;
        return tokenContract;
    }
}
