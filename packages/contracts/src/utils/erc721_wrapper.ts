import { generatePseudoRandomSalt } from '@0xproject/order-utils';
import { Provider } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';

import { DummyERC721TokenContract } from '../contract_wrappers/generated/dummy_e_r_c721_token';
import { ERC721ProxyContract } from '../contract_wrappers/generated/e_r_c721_proxy';

import { artifacts } from './artifacts';
import { constants } from './constants';
import { ERC721TokenIdsByOwner } from './types';
import { txDefaults } from './web3_wrapper';

export class ERC721Wrapper {
    private _tokenOwnerAddresses: string[];
    private _contractOwnerAddress: string;
    private _web3Wrapper: Web3Wrapper;
    private _provider: Provider;
    private _dummyTokenContracts?: DummyERC721TokenContract[];
    private _proxyContract?: ERC721ProxyContract;
    private _initialTokenIdsByOwner: ERC721TokenIdsByOwner = {};
    constructor(provider: Provider, tokenOwnerAddresses: string[], contractOwnerAddress: string) {
        this._web3Wrapper = new Web3Wrapper(provider);
        this._provider = provider;
        this._tokenOwnerAddresses = tokenOwnerAddresses;
        this._contractOwnerAddress = contractOwnerAddress;
    }
    public async deployDummyTokensAsync(): Promise<DummyERC721TokenContract[]> {
        this._dummyTokenContracts = await Promise.all(
            _.times(constants.NUM_DUMMY_ERC721_TO_DEPLOY, async () =>
                DummyERC721TokenContract.deployFrom0xArtifactAsync(
                    artifacts.DummyERC721Token,
                    this._provider,
                    txDefaults,
                    constants.DUMMY_TOKEN_NAME,
                    constants.DUMMY_TOKEN_SYMBOL,
                ),
            ),
        );
        return this._dummyTokenContracts;
    }
    public async deployProxyAsync(): Promise<ERC721ProxyContract> {
        this._proxyContract = await ERC721ProxyContract.deployFrom0xArtifactAsync(
            artifacts.ERC721Proxy,
            this._provider,
            txDefaults,
        );
        return this._proxyContract;
    }
    public async setBalancesAndAllowancesAsync(): Promise<void> {
        this._validateDummyTokenContractsExistOrThrow();
        this._validateProxyContractExistsOrThrow();
        const setBalancePromises: Array<Promise<string>> = [];
        const setAllowancePromises: Array<Promise<string>> = [];
        this._initialTokenIdsByOwner = {};
        _.forEach(this._dummyTokenContracts, dummyTokenContract => {
            _.forEach(this._tokenOwnerAddresses, tokenOwnerAddress => {
                _.forEach(_.range(constants.NUM_ERC721_TOKENS_TO_MINT), () => {
                    const tokenId = generatePseudoRandomSalt();
                    setBalancePromises.push(
                        dummyTokenContract.mint.sendTransactionAsync(tokenOwnerAddress, tokenId, {
                            from: this._contractOwnerAddress,
                        }),
                    );
                    if (_.isUndefined(this._initialTokenIdsByOwner[tokenOwnerAddress])) {
                        this._initialTokenIdsByOwner[tokenOwnerAddress] = {
                            [dummyTokenContract.address]: [],
                        };
                    }
                    if (_.isUndefined(this._initialTokenIdsByOwner[tokenOwnerAddress][dummyTokenContract.address])) {
                        this._initialTokenIdsByOwner[tokenOwnerAddress][dummyTokenContract.address] = [];
                    }
                    this._initialTokenIdsByOwner[tokenOwnerAddress][dummyTokenContract.address].push(tokenId);
                });
                const shouldApprove = true;
                setAllowancePromises.push(
                    dummyTokenContract.setApprovalForAll.sendTransactionAsync(
                        (this._proxyContract as ERC721ProxyContract).address,
                        shouldApprove,
                        { from: tokenOwnerAddress },
                    ),
                );
            });
        });
        const txHashes = await Promise.all([...setBalancePromises, ...setAllowancePromises]);
        await Promise.all(_.map(txHashes, async txHash => this._web3Wrapper.awaitTransactionSuccessAsync(txHash)));
    }
    public async getBalancesAsync(): Promise<ERC721TokenIdsByOwner> {
        this._validateDummyTokenContractsExistOrThrow();
        this._validateBalancesAndAllowancesSetOrThrow();
        const tokenIdsByOwner: ERC721TokenIdsByOwner = {};
        const tokenOwnerPromises: Array<Promise<string>> = [];
        const tokenInfo: Array<{ tokenId: BigNumber; tokenAddress: string }> = [];
        _.forEach(this._dummyTokenContracts, dummyTokenContract => {
            _.forEach(this._tokenOwnerAddresses, tokenOwnerAddress => {
                const initialTokenOwnerIds = this._initialTokenIdsByOwner[tokenOwnerAddress][
                    dummyTokenContract.address
                ];
                _.forEach(initialTokenOwnerIds, tokenId => {
                    tokenOwnerPromises.push(dummyTokenContract.ownerOf.callAsync(tokenId));
                    tokenInfo.push({
                        tokenId,
                        tokenAddress: dummyTokenContract.address,
                    });
                });
            });
        });
        const tokenOwnerAddresses = await Promise.all(tokenOwnerPromises);
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
    private _validateDummyTokenContractsExistOrThrow(): void {
        if (_.isUndefined(this._dummyTokenContracts)) {
            throw new Error('Dummy ERC721 tokens not yet deployed, please call "deployDummyTokensAsync"');
        }
    }
    private _validateProxyContractExistsOrThrow(): void {
        if (_.isUndefined(this._proxyContract)) {
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
