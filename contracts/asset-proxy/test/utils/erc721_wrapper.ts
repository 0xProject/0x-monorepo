import { artifacts as erc721Artifacts, DummyERC721TokenContract } from '@0x/contracts-erc721';
import { constants, ERC721TokenIdsByOwner, txDefaults } from '@0x/contracts-test-utils';
import { generatePseudoRandomSalt } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import { ZeroExProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts, ERC721ProxyContract } from '../../src';

export class ERC721Wrapper {
    private readonly _tokenOwnerAddresses: string[];
    private readonly _contractOwnerAddress: string;
    private readonly _provider: ZeroExProvider;
    private readonly _dummyTokenContracts: DummyERC721TokenContract[];
    private _proxyContract?: ERC721ProxyContract;
    private _proxyIdIfExists?: string;
    private _initialTokenIdsByOwner: ERC721TokenIdsByOwner = {};
    constructor(provider: ZeroExProvider, tokenOwnerAddresses: string[], contractOwnerAddress: string) {
        this._provider = provider;
        this._dummyTokenContracts = [];
        this._tokenOwnerAddresses = tokenOwnerAddresses;
        this._contractOwnerAddress = contractOwnerAddress;
    }
    public async deployDummyTokensAsync(): Promise<DummyERC721TokenContract[]> {
        // tslint:disable-next-line:no-unused-variable
        for (const i of _.times(constants.NUM_DUMMY_ERC721_TO_DEPLOY)) {
            this._dummyTokenContracts.push(
                await DummyERC721TokenContract.deployFrom0xArtifactAsync(
                    erc721Artifacts.DummyERC721Token,
                    this._provider,
                    txDefaults,
                    artifacts,
                    constants.DUMMY_TOKEN_NAME,
                    constants.DUMMY_TOKEN_SYMBOL,
                ),
            );
        }
        return this._dummyTokenContracts;
    }
    public async deployProxyAsync(): Promise<ERC721ProxyContract> {
        this._proxyContract = await ERC721ProxyContract.deployFrom0xArtifactAsync(
            artifacts.ERC721Proxy,
            this._provider,
            txDefaults,
            artifacts,
        );
        this._proxyIdIfExists = await this._proxyContract.getProxyId.callAsync();
        return this._proxyContract;
    }
    public getProxyId(): string {
        this._validateProxyContractExistsOrThrow();
        return this._proxyIdIfExists as string;
    }
    public async setBalancesAndAllowancesAsync(): Promise<void> {
        this._validateDummyTokenContractsExistOrThrow();
        this._validateProxyContractExistsOrThrow();
        this._initialTokenIdsByOwner = {};
        for (const dummyTokenContract of this._dummyTokenContracts) {
            for (const tokenOwnerAddress of this._tokenOwnerAddresses) {
                // tslint:disable-next-line:no-unused-variable
                for (const i of _.times(constants.NUM_ERC721_TOKENS_TO_MINT)) {
                    const tokenId = generatePseudoRandomSalt();
                    await this.mintAsync(dummyTokenContract.address, tokenId, tokenOwnerAddress);
                    if (this._initialTokenIdsByOwner[tokenOwnerAddress] === undefined) {
                        this._initialTokenIdsByOwner[tokenOwnerAddress] = {
                            [dummyTokenContract.address]: [],
                        };
                    }
                    if (this._initialTokenIdsByOwner[tokenOwnerAddress][dummyTokenContract.address] === undefined) {
                        this._initialTokenIdsByOwner[tokenOwnerAddress][dummyTokenContract.address] = [];
                    }
                    this._initialTokenIdsByOwner[tokenOwnerAddress][dummyTokenContract.address].push(tokenId);

                    await this.approveProxyAsync(dummyTokenContract.address, tokenId);
                }
            }
        }
    }
    public async doesTokenExistAsync(tokenAddress: string, tokenId: BigNumber): Promise<boolean> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        const owner = await tokenContract.ownerOf.callAsync(tokenId);
        const doesExist = owner !== constants.NULL_ADDRESS;
        return doesExist;
    }
    public async approveProxyAsync(tokenAddress: string, tokenId: BigNumber): Promise<void> {
        const proxyAddress = (this._proxyContract as ERC721ProxyContract).address;
        await this.approveAsync(proxyAddress, tokenAddress, tokenId);
    }
    public async approveProxyForAllAsync(tokenAddress: string, tokenId: BigNumber, isApproved: boolean): Promise<void> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        const tokenOwner = await this.ownerOfAsync(tokenAddress, tokenId);
        const proxyAddress = (this._proxyContract as ERC721ProxyContract).address;
        await tokenContract.setApprovalForAll.awaitTransactionSuccessAsync(
            proxyAddress,
            isApproved,
            { from: tokenOwner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    }
    public async approveAsync(to: string, tokenAddress: string, tokenId: BigNumber): Promise<void> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        const tokenOwner = await this.ownerOfAsync(tokenAddress, tokenId);
        await tokenContract.approve.awaitTransactionSuccessAsync(
            to,
            tokenId,
            { from: tokenOwner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    }
    public async transferFromAsync(
        tokenAddress: string,
        tokenId: BigNumber,
        currentOwner: string,
        userAddress: string,
    ): Promise<void> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        await tokenContract.transferFrom.awaitTransactionSuccessAsync(
            currentOwner,
            userAddress,
            tokenId,
            { from: currentOwner },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    }
    public async mintAsync(tokenAddress: string, tokenId: BigNumber, userAddress: string): Promise<void> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        await tokenContract.mint.awaitTransactionSuccessAsync(
            userAddress,
            tokenId,
            { from: this._contractOwnerAddress },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    }
    public async burnAsync(tokenAddress: string, tokenId: BigNumber, owner: string): Promise<void> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        await tokenContract.burn.awaitTransactionSuccessAsync(
            owner,
            tokenId,
            { from: this._contractOwnerAddress },
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    }
    public async ownerOfAsync(tokenAddress: string, tokenId: BigNumber): Promise<string> {
        const tokenContract = this._getTokenContractFromAssetData(tokenAddress);
        const owner = await tokenContract.ownerOf.callAsync(tokenId);
        return owner;
    }
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
            if (tokenIdsByOwner[tokenOwnerAddress] === undefined) {
                tokenIdsByOwner[tokenOwnerAddress] = {
                    [tokenAddress]: [],
                };
            }
            if (tokenIdsByOwner[tokenOwnerAddress][tokenAddress] === undefined) {
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
    private _getTokenContractFromAssetData(tokenAddress: string): DummyERC721TokenContract {
        const tokenContractIfExists = _.find(this._dummyTokenContracts, c => c.address === tokenAddress);
        if (tokenContractIfExists === undefined) {
            throw new Error(`Token: ${tokenAddress} was not deployed through ERC20Wrapper`);
        }
        return tokenContractIfExists;
    }
    private _validateDummyTokenContractsExistOrThrow(): void {
        if (this._dummyTokenContracts === undefined) {
            throw new Error('Dummy ERC721 tokens not yet deployed, please call "deployDummyTokensAsync"');
        }
    }
    private _validateProxyContractExistsOrThrow(): void {
        if (this._proxyContract === undefined) {
            throw new Error('ERC721 proxy contract not yet deployed, please call "deployProxyAsync"');
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
