import { constants, ERC1155HoldingsByOwner, ERC1155FungibleHoldingsByOwner, ERC1155NonFungibleHoldingsByOwner, LogDecoder, txDefaults } from '@0x/contracts-test-utils';
import { generatePseudoRandomSalt } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';

import { LogWithDecodedArgs } from 'ethereum-types';

import { artifacts, ERC1155MintableContract, ERC1155ProxyContract, ERC1155MintableTransferSingleEventArgs } from '../../src';


export class ERC1155Wrapper {
    private readonly _tokenOwnerAddresses: string[];
    private readonly _fungibleTokenIds: string[];
    private readonly _nonFungibleTokenIds: string[];
    private readonly _nfts: {id: BigNumber, tokenId: BigNumber}[];
    private readonly _contractOwnerAddress: string;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _provider: Provider;
    private readonly _logDecoder: LogDecoder;
    private readonly _dummyTokenContracts: ERC1155MintableContract[];
    private _proxyContract?: ERC1155ProxyContract;
    private _proxyIdIfExists?: string;
    private _initialTokenIdsByOwner: ERC1155HoldingsByOwner = {fungible: {}, nonFungible: {}};
    constructor(provider: Provider, tokenOwnerAddresses: string[], contractOwnerAddress: string) {
        this._web3Wrapper = new Web3Wrapper(provider);
        this._provider = provider;
        this._logDecoder = new LogDecoder(this._web3Wrapper, artifacts);
        this._dummyTokenContracts = [];
        this._tokenOwnerAddresses = tokenOwnerAddresses;
        this._contractOwnerAddress = contractOwnerAddress;
        this._fungibleTokenIds = [];
        this._nonFungibleTokenIds = [];
        this._nfts = [];
    }
    public async deployDummyTokensAsync(): Promise<ERC1155MintableContract[]> {
        // tslint:disable-next-line:no-unused-variable
        for (const i of _.times(constants.NUM_DUMMY_ERC1155_TO_DEPLOY)) {
            this._dummyTokenContracts.push(
                await ERC1155MintableContract.deployFrom0xArtifactAsync(
                    artifacts.ERC1155Mintable,
                    this._provider,
                    txDefaults,
                ),
            );
        }
        return this._dummyTokenContracts;
    }
    public async deployProxyAsync(): Promise<ERC1155ProxyContract> {
        this._proxyContract = await ERC1155ProxyContract.deployFrom0xArtifactAsync(
            artifacts.ERC1155Proxy,
            this._provider,
            txDefaults,
        );
        this._proxyIdIfExists = await this._proxyContract.getProxyId.callAsync();
        return this._proxyContract;
    }
    public getProxyId(): string {
        this._validateProxyContractExistsOrThrow();
        return this._proxyIdIfExists as string;
    }
    public async setBalancesAndAllowancesAsync(): Promise<ERC1155HoldingsByOwner> {
        this._validateDummyTokenContractsExistOrThrow();
        this._validateProxyContractExistsOrThrow();
        this._initialTokenIdsByOwner = {
            fungible: {} as ERC1155FungibleHoldingsByOwner,
            nonFungible: {}
        };
        const fungibleHoldingsByOwner:  ERC1155FungibleHoldingsByOwner = {};
        const nonFungibleHoldingsByOwner: ERC1155NonFungibleHoldingsByOwner = {};
        for (const dummyTokenContract of this._dummyTokenContracts) {
            // Fungible Tokens
            for (const i of _.times(constants.NUM_ERC1155_FUNGIBLE_TOKENS_MINT)) {
                // Create a fungible token
                const tokenUri = generatePseudoRandomSalt().toString();
                const tokenIsNonFungible = false;
                const tokenId = await this.createTokenAsync(dummyTokenContract.address, tokenUri, tokenIsNonFungible);
                const tokenIdAsString = tokenId.toString();
                this._fungibleTokenIds.push(tokenIdAsString);
                // Mint tokens for each owner for this token
                for (const tokenOwnerAddress of this._tokenOwnerAddresses) {
                    // tslint:disable-next-line:no-unused-variable
                    await this.mintFungibleAsync(dummyTokenContract.address, tokenId, tokenOwnerAddress);
                    if (_.isUndefined(fungibleHoldingsByOwner[tokenOwnerAddress])) {
                        fungibleHoldingsByOwner[tokenOwnerAddress] = {};
                    }
                    if (_.isUndefined(fungibleHoldingsByOwner[tokenOwnerAddress][dummyTokenContract.address])) {
                        fungibleHoldingsByOwner[tokenOwnerAddress][dummyTokenContract.address] = {};
                    }
                    fungibleHoldingsByOwner[tokenOwnerAddress][dummyTokenContract.address][tokenIdAsString] = constants.INITIAL_ERC1155_FUNGIBLE_BALANCE;
                    await this.approveProxyAsync(dummyTokenContract.address, tokenId, tokenOwnerAddress);
                }
            }
            // Non-Fungible Tokens
            for (const i of _.times(constants.NUM_ERC1155_NONFUNGIBLE_TOKENS_MINT)) {
                const tokenUri = generatePseudoRandomSalt().toString();
                const tokenIsNonFungible = true;
                const tokenId = await this.createTokenAsync(dummyTokenContract.address, tokenUri, tokenIsNonFungible);
                const tokenIdAsString = tokenId.toString();
                this._nonFungibleTokenIds.push(tokenIdAsString);
                await this.mintNonFungibleAsync(dummyTokenContract.address, tokenId, this._tokenOwnerAddresses);
                let tokenNonce = 0;
                for (const tokenOwnerAddress of this._tokenOwnerAddresses) {
                     if (_.isUndefined(nonFungibleHoldingsByOwner[tokenOwnerAddress])) {
                        nonFungibleHoldingsByOwner[tokenOwnerAddress] = {};
                     }
                     if (_.isUndefined(nonFungibleHoldingsByOwner[tokenOwnerAddress][dummyTokenContract.address])) {
                        nonFungibleHoldingsByOwner[tokenOwnerAddress][dummyTokenContract.address] = {};
                     }
                     if (_.isUndefined(nonFungibleHoldingsByOwner[tokenOwnerAddress][dummyTokenContract.address][tokenIdAsString])) {
                        nonFungibleHoldingsByOwner[tokenOwnerAddress][dummyTokenContract.address][tokenIdAsString] = [];
                     }
                     const nonFungibleId = tokenId.plus(++tokenNonce);
                     this._nfts.push({id: nonFungibleId, tokenId});
                     nonFungibleHoldingsByOwner[tokenOwnerAddress][dummyTokenContract.address][tokenIdAsString].push(nonFungibleId);
                     await this.approveProxyAsync(dummyTokenContract.address, tokenId, tokenOwnerAddress);
                }
            }
        }
        this._initialTokenIdsByOwner = {
            fungible: fungibleHoldingsByOwner,
            nonFungible: nonFungibleHoldingsByOwner,
        }
        return this._initialTokenIdsByOwner;
    }
    public async approveProxyAsync(tokenAddress: string, tokenId: BigNumber, tokenOwner: string): Promise<void> {
        const proxyAddress = (this._proxyContract as ERC1155ProxyContract).address;
        await this.approveProxyForAllAsync(proxyAddress, tokenAddress, tokenOwner);
    }
    public async approveProxyForAllAsync(to: string, tokenAddress: string, tokenOwner: string): Promise<void> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        await this._web3Wrapper.awaitTransactionSuccessAsync(
            await tokenContract.setApprovalForAll.sendTransactionAsync(to, true, {
                from: tokenOwner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    }
    public async createTokenAsync(tokenAddress: string, tokenUri: string, tokenIsNonFungible: boolean): Promise<BigNumber> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        const txReceipt = await this._logDecoder.getTxWithDecodedLogsAsync(
            await tokenContract.create.sendTransactionAsync(tokenUri, tokenIsNonFungible),
        );
        const createFungibleTokenLog = txReceipt.logs[0] as LogWithDecodedArgs<ERC1155MintableTransferSingleEventArgs>;
        const dummyFungibleTokenId = createFungibleTokenLog.args._id;
        return dummyFungibleTokenId;
    }
    public async mintFungibleAsync(tokenAddress: string, tokenId: BigNumber, userAddress: string): Promise<void> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        await this._web3Wrapper.awaitTransactionSuccessAsync(
            await tokenContract.mintFungible.sendTransactionAsync(
                tokenId,
                [userAddress],
                [constants.INITIAL_ERC1155_FUNGIBLE_BALANCE],
                { from: this._contractOwnerAddress }
            ),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    }
    public async mintNonFungibleAsync(tokenAddress: string, tokenId: BigNumber, userAddresses: string[]): Promise<void> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        await this._web3Wrapper.awaitTransactionSuccessAsync(
            await tokenContract.mintNonFungible.sendTransactionAsync(
                tokenId,
                userAddresses,
                { from: this._contractOwnerAddress }
            ),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    }
    public async ownerOfNonFungibleAsync(tokenAddress: string, tokenId: BigNumber): Promise<string> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        const owner = await tokenContract.ownerOf.callAsync(tokenId);
        return owner;
    }
    public async isNonFungibleOwnerAsync(userAddress: string, tokenAddress: string, tokenId: BigNumber): Promise<boolean> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        const tokenOwner = await tokenContract.ownerOf.callAsync(tokenId);
        const isOwner = tokenOwner === userAddress;
        return isOwner;
    }
    public async isProxyApprovedForAllAsync(userAddress: string, tokenAddress: string): Promise<boolean> {
        this._validateProxyContractExistsOrThrow();
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        const operator = (this._proxyContract as ERC1155ProxyContract).address;
        const didApproveAll = await tokenContract.isApprovedForAll.callAsync(userAddress, operator);
        return didApproveAll;
    }
    public async getBalancesAsync(): Promise<ERC1155HoldingsByOwner> {
        this._validateDummyTokenContractsExistOrThrow();
        this._validateBalancesAndAllowancesSetOrThrow();
        const tokenHoldingsByOwner: ERC1155FungibleHoldingsByOwner = {};
        const nonFungibleHoldingsByOwner: ERC1155NonFungibleHoldingsByOwner = {};
        for (const dummyTokenContract of this._dummyTokenContracts) {
            const tokenAddress = dummyTokenContract.address;
            const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
            // Construct batch balance call
            const tokenOwners: string[] = [];
            const tokenIds: BigNumber[] = [];
            for (const tokenOwnerAddress of this._tokenOwnerAddresses) {
                for (const tokenId of this._fungibleTokenIds) {
                    tokenOwners.push(tokenOwnerAddress);
                    tokenIds.push(new BigNumber(tokenId));
                }
                for (const nft of this._nfts) {
                    tokenOwners.push(tokenOwnerAddress);
                    tokenIds.push(nft.id);
                }
            }
            const balances = await tokenContract.balanceOfBatch.callAsync(tokenOwners, tokenIds);
            // Parse out balances into fungible / non-fungible token holdings
            let i = 0;
            for (const tokenOwnerAddress of this._tokenOwnerAddresses) {
                // Fungible tokens
                for (const tokenId of this._fungibleTokenIds) {
                    if (_.isUndefined(tokenHoldingsByOwner[tokenOwnerAddress])) {
                        tokenHoldingsByOwner[tokenOwnerAddress] = {};
                    }
                    if (_.isUndefined(tokenHoldingsByOwner[tokenOwnerAddress][tokenAddress])) {
                        tokenHoldingsByOwner[tokenOwnerAddress][tokenAddress] = {};
                    }
                    tokenHoldingsByOwner[tokenOwnerAddress][tokenAddress][tokenId] = balances[i++];
                }
                // Non-fungible tokens
                for (const nft of this._nfts) {
                    if (_.isUndefined(nonFungibleHoldingsByOwner[tokenOwnerAddress])) {
                        nonFungibleHoldingsByOwner[tokenOwnerAddress] = {};
                    }
                    if (_.isUndefined(nonFungibleHoldingsByOwner[tokenOwnerAddress][tokenAddress])) {
                        nonFungibleHoldingsByOwner[tokenOwnerAddress][tokenAddress] = {};
                    }
                    if (_.isUndefined(nonFungibleHoldingsByOwner[tokenOwnerAddress][tokenAddress][nft.tokenId.toString()])) {
                        nonFungibleHoldingsByOwner[tokenOwnerAddress][tokenAddress][nft.tokenId.toString()] = [];
                    }
                    const isOwner = balances[i++];
                    if (isOwner.isEqualTo(1)) {
                        nonFungibleHoldingsByOwner[tokenOwnerAddress][tokenAddress][nft.tokenId.toString()].push(nft.id);
                    }
                }
            }
        }
        const holdingsByOwner = {
            fungible: tokenHoldingsByOwner,
            nonFungible: nonFungibleHoldingsByOwner,
        }
        return holdingsByOwner;
    }
    public getFungibleTokenIds(): BigNumber[] {
        const fungibleTokenIds = _.map(this._fungibleTokenIds, (tokenIdAsString: string) => {return new BigNumber(tokenIdAsString)});
        return fungibleTokenIds;
    }
    public getNonFungibleTokenIds(): BigNumber[] {
        const nonFungibleTokenIds = _.map(this._nonFungibleTokenIds, (tokenIdAsString: string) => {return new BigNumber(tokenIdAsString)});
        return nonFungibleTokenIds;
    }
    public getTokenOwnerAddresses(): string[] {
        return this._tokenOwnerAddresses;
    }
    public getTokenAddresses(): string[] {
        const tokenAddresses = _.map(this._dummyTokenContracts, dummyTokenContract => dummyTokenContract.address);
        return tokenAddresses;
    }
    private _getTokenContractFromAssetData(tokenAddress: string): ERC1155MintableContract {
        const tokenContractIfExists = _.find(this._dummyTokenContracts, c => c.address === tokenAddress);
        if (_.isUndefined(tokenContractIfExists)) {
            throw new Error(`Token: ${tokenAddress} was not deployed through ERC1155Wrapper`);
        }
        return tokenContractIfExists;
    }
    private _validateDummyTokenContractsExistOrThrow(): void {
        if (_.isUndefined(this._dummyTokenContracts)) {
            throw new Error('Dummy ERC1155 tokens not yet deployed, please call "deployDummyTokensAsync"');
        }
    }
    private _validateProxyContractExistsOrThrow(): void {
        if (_.isUndefined(this._proxyContract)) {
            throw new Error('ERC1155 proxy contract not yet deployed, please call "deployProxyAsync"');
        }
    }
    private _validateBalancesAndAllowancesSetOrThrow(): void {
        if (_.keys(this._initialTokenIdsByOwner.fungible).length === 0 || _.keys(this._initialTokenIdsByOwner.nonFungible).length === 0) {
            throw new Error(
                'Dummy ERC1155 balances and allowances not yet set, please call "setBalancesAndAllowancesAsync"',
            );
        }
    }
}
