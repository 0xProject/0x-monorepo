import { constants, ERC1155HoldingsByOwner, LogDecoder, txDefaults } from '@0x/contracts-test-utils';
import { generatePseudoRandomSalt } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';

import { LogWithDecodedArgs } from 'ethereum-types';

import { artifacts, DummyERC1155TokenContract, ERC1155ProxyContract, DummyERC1155TokenTransferSingleEventArgs } from '../../src';


export class ERC1155Wrapper {
    private readonly _tokenOwnerAddresses: string[];
    private readonly _contractOwnerAddress: string;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _provider: Provider;
    private readonly _logDecoder: LogDecoder;
    private readonly _dummyTokenContracts: DummyERC1155TokenContract[];
    private _proxyContract?: ERC1155ProxyContract;
    private _proxyIdIfExists?: string;
    private _initialTokenIdsByOwner: ERC1155HoldingsByOwner = {};
    constructor(provider: Provider, tokenOwnerAddresses: string[], contractOwnerAddress: string) {
        this._web3Wrapper = new Web3Wrapper(provider);
        this._provider = provider;
        this._logDecoder = new LogDecoder(this._web3Wrapper, artifacts);
        this._dummyTokenContracts = [];
        this._tokenOwnerAddresses = tokenOwnerAddresses;
        this._contractOwnerAddress = contractOwnerAddress;
    }
    public async deployDummyTokensAsync(): Promise<DummyERC1155TokenContract[]> {
        // tslint:disable-next-line:no-unused-variable
        for (const i of _.times(constants.NUM_DUMMY_ERC1155_TO_DEPLOY)) {
            this._dummyTokenContracts.push(
                await DummyERC1155TokenContract.deployFrom0xArtifactAsync(
                    artifacts.DummyERC1155Token,
                    this._provider,
                    txDefaults,
                    constants.DUMMY_TOKEN_NAME,
                    constants.DUMMY_TOKEN_SYMBOL,
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
        this._initialTokenIdsByOwner = {};
        for (const dummyTokenContract of this._dummyTokenContracts) {
            for (const i of _.times(constants.NUM_ERC1155_FUNGIBLE_TOKENS_MINT)) {
                // Create a fungible token
                const tokenUri = generatePseudoRandomSalt().toString();
                const tokenId = await this.createTokenAsync(dummyTokenContract.address, tokenUri);
                const tokenIdAsString = tokenId.toString();
                // Mint tokens for each owner for this token
                for (const tokenOwnerAddress of this._tokenOwnerAddresses) {
                    // tslint:disable-next-line:no-unused-variable
                    await this.mintFungibleAsync(dummyTokenContract.address, tokenId, tokenOwnerAddress);
                    if (_.isUndefined(this._initialTokenIdsByOwner[tokenOwnerAddress])) {
                        this._initialTokenIdsByOwner[tokenOwnerAddress] = {};
                    }
                    if (_.isUndefined(this._initialTokenIdsByOwner[tokenOwnerAddress][dummyTokenContract.address])) {
                        this._initialTokenIdsByOwner[tokenOwnerAddress][dummyTokenContract.address] = {};
                    }
                    this._initialTokenIdsByOwner[tokenOwnerAddress][dummyTokenContract.address][tokenIdAsString] = constants.INITIAL_ERC1155_FUNGIBLE_BALANCE;
                    await this.approveProxyAsync(dummyTokenContract.address, tokenId, tokenOwnerAddress);
                }
            }
        }
        return this._initialTokenIdsByOwner;
    }
    /*
    public async doesTokenExistAsync(tokenAddress: string, tokenId: BigNumber): Promise<boolean> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        const owner = await tokenContract.ownerOf.callAsync(tokenId);
        const doesExist = owner !== constants.NULL_ADDRESS;
        return doesExist;
    }
    */
    public async approveProxyAsync(tokenAddress: string, tokenId: BigNumber, tokenOwner: string): Promise<void> {
        const proxyAddress = (this._proxyContract as ERC1155ProxyContract).address;
        await this.approveAsync(proxyAddress, tokenAddress, tokenId, tokenOwner);
    }
    /*
    public async approveProxyForAllAsync(tokenAddress: string, tokenId: BigNumber, isApproved: boolean): Promise<void> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        const tokenOwner = await this.ownerOfAsync(tokenAddress, tokenId);
        const proxyAddress = (this._proxyContract as ERC721ProxyContract).address;
        await this._web3Wrapper.awaitTransactionSuccessAsync(
            await tokenContract.setApprovalForAll.sendTransactionAsync(proxyAddress, isApproved, {
                from: tokenOwner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    }*/
    
    public async approveAsync(to: string, tokenAddress: string, tokenId: BigNumber, tokenOwner: string): Promise<void> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        await this._web3Wrapper.awaitTransactionSuccessAsync(
            await tokenContract.setApprovalForAll.sendTransactionAsync(to, true, {
                from: tokenOwner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    }
    /*
    public async transferFromAsync(
        tokenAddress: string,
        tokenId: BigNumber,
        currentOwner: string,
        userAddress: string,
    ): Promise<void> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        await this._web3Wrapper.awaitTransactionSuccessAsync(
            await tokenContract.transferFrom.sendTransactionAsync(currentOwner, userAddress, tokenId, {
                from: currentOwner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    }*/
    public async createTokenAsync(tokenAddress: string, tokenUri: string): Promise<BigNumber> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        const tokenIsNonFungible = false;
        const txReceipt = await this._logDecoder.getTxWithDecodedLogsAsync(
            await tokenContract.create.sendTransactionAsync(tokenUri, tokenIsNonFungible),
        );
        const createFungibleTokenLog = txReceipt.logs[0] as LogWithDecodedArgs<DummyERC1155TokenTransferSingleEventArgs>;
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
    /*
    public async burnAsync(tokenAddress: string, tokenId: BigNumber, owner: string): Promise<void> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        await this._web3Wrapper.awaitTransactionSuccessAsync(
            await tokenContract.burn.sendTransactionAsync(owner, tokenId, {
                from: this._contractOwnerAddress,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    }
    */
   /*
    // THIS IS NFT ONLY
    public async ownerOfAsync(tokenAddress: string, tokenId: BigNumber): Promise<string> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        const owner = await tokenContract.ownerOf.callAsync(tokenId);
        return owner;
    }*/
    /*
    public async isOwnerAsync(userAddress: string, tokenAddress: string, tokenId: BigNumber): Promise<boolean> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        const tokenOwner = await tokenContract.ownerOf.callAsync(tokenId);
        const isOwner = tokenOwner === userAddress;
        return isOwner;
    }
    public async isProxyApprovedForAllAsync(userAddress: string, tokenAddress: string): Promise<boolean> {
        this._validateProxyContractExistsOrThrow();
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        const operator = (this._proxyContract as ERC721ProxyContract).address;
        const didApproveAll = await tokenContract.isApprovedForAll.callAsync(userAddress, operator);
        return didApproveAll;
    }
    public async isProxyApprovedAsync(tokenAddress: string, tokenId: BigNumber): Promise<boolean> {
        this._validateProxyContractExistsOrThrow();
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        const approvedAddress = await tokenContract.getApproved.callAsync(tokenId);
        const proxyAddress = (this._proxyContract as ERC721ProxyContract).address;
        const isProxyAnApprovedOperator = approvedAddress === proxyAddress;
        return isProxyAnApprovedOperator;
    }
    public async getBalancesAsync(): Promise<ERC721TokenIdsByOwner> {
        this._validateDummyTokenContractsExistOrThrow();
        this._validateBalancesAndAllowancesSetOrThrow();
        const tokenIdsByOwner: ERC721TokenIdsByOwner = {};
        const tokenOwnerAddresses: string[] = [];
        const tokenInfo: Array<{ tokenId: BigNumber; tokenAddress: string }> = [];
        for (const dummyTokenContract of this._dummyTokenContracts) {
            for (const tokenOwnerAddress of this._tokenOwnerAddresses) {
                const initialTokenOwnerIds = this._initialTokenIdsByOwner[tokenOwnerAddress][
                    dummyTokenContract.address
                ];
                for (const tokenId of initialTokenOwnerIds) {
                    tokenOwnerAddresses.push(await dummyTokenContract.ownerOf.callAsync(tokenId));
                    tokenInfo.push({
                        tokenId,
                        tokenAddress: dummyTokenContract.address,
                    });
                }
            }
        }
        _.forEach(tokenOwnerAddresses, (tokenOwnerAddress, ownerIndex) => {
            const tokenAddress = tokenInfo[ownerIndex].tokenAddress;
            const tokenId = tokenInfo[ownerIndex].tokenId;
            if (_.isUndefined(tokenIdsByOwner[tokenOwnerAddress])) {
                tokenIdsByOwner[tokenOwnerAddress] = {
                    [tokenAddress]: [],
                };
            }
            if (_.isUndefined(tokenIdsByOwner[tokenOwnerAddress][tokenAddress])) {
                tokenIdsByOwner[tokenOwnerAddress][tokenAddress] = [];
            }
            tokenIdsByOwner[tokenOwnerAddress][tokenAddress].push(tokenId);
        });
        return tokenIdsByOwner;
    }
    public getTokenOwnerAddresses(): string[] {
        return this._tokenOwnerAddresses;
    }
    public getTokenAddresses(): string[] {
        const tokenAddresses = _.map(this._dummyTokenContracts, dummyTokenContract => dummyTokenContract.address);
        return tokenAddresses;
    }
        */
    private _getTokenContractFromAssetData(tokenAddress: string): DummyERC1155TokenContract {
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
        if (_.keys(this._initialTokenIdsByOwner).length === 0) {
            throw new Error(
                'Dummy ERC721 balances and allowances not yet set, please call "setBalancesAndAllowancesAsync"',
            );
        }
    }
}
