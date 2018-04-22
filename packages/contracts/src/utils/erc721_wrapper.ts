import { ZeroEx } from '0x.js';
import { Deployer } from '@0xproject/deployer';
import { Provider } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { DummyERC721TokenContract } from '../contract_wrappers/generated/dummy_e_r_c721_token';
import { ERC721ProxyContract } from '../contract_wrappers/generated/e_r_c721_proxy';

import { constants } from './constants';
import { ContractName, ERC721BalancesByOwner } from './types';

export class ERC721Wrapper {
    private _tokenOwnerAddresses: string[];
    private _contractOwnerAddress: string;
    private _deployer: Deployer;
    private _provider: Provider;
    private _dummyERC721TokenContracts?: DummyERC721TokenContract[];
    private _erc721ProxyContract?: ERC721ProxyContract;
    private _initialERC721BalancesByOwner?: ERC721BalancesByOwner;
    constructor(deployer: Deployer, provider: Provider, tokenOwnerAddresses: string[], contractOwnerAddress: string) {
        this._deployer = deployer;
        this._provider = provider;
        this._tokenOwnerAddresses = tokenOwnerAddresses;
        this._contractOwnerAddress = contractOwnerAddress;
    }
    public async deployDummyERC721TokensAsync(): Promise<DummyERC721TokenContract[]> {
        const tokenContractInstances = await Promise.all(
            _.map(this._tokenOwnerAddresses, tokenOwnerAddress =>
                this._deployer.deployAsync(ContractName.DummyERC721Token, constants.DUMMY_ERC721_TOKEN_ARGS),
            ),
        );
        this._dummyERC721TokenContracts = _.map(
            tokenContractInstances,
            tokenContractInstance =>
                new DummyERC721TokenContract(tokenContractInstance.abi, tokenContractInstance.address, this._provider),
        );
        return this._dummyERC721TokenContracts;
    }
    public async deployERC721ProxyAsync(): Promise<ERC721ProxyContract> {
        const proxyContractInstance = await this._deployer.deployAsync(ContractName.ERC721Proxy);
        this._erc721ProxyContract = new ERC721ProxyContract(
            proxyContractInstance.abi,
            proxyContractInstance.address,
            this._provider,
        );
        return this._erc721ProxyContract;
    }
    public async setBalancesAndAllowancesAsync() {
        if (_.isUndefined(this._dummyERC721TokenContracts)) {
            throw new Error('Dummy ERC721 tokens not yet deployed, please call "deployDummyERC721TokensAsync"');
        }
        if (_.isUndefined(this._erc721ProxyContract)) {
            throw new Error('ERC721 proxy contract not yet deployed, please call "deployERC721ProxyAsync"');
        }
        const setBalancePromises: any[] = [];
        const setAllowancePromises: any[] = [];
        this._initialERC721BalancesByOwner = {};
        _.forEach(this._dummyERC721TokenContracts, dummyERC721TokenContract => {
            _.forEach(this._tokenOwnerAddresses, tokenOwnerAddress => {
                _.forEach(_.range(constants.NUM_ERC721_TOKENS_TO_MINT), () => {
                    const tokenId = ZeroEx.generatePseudoRandomSalt();
                    setBalancePromises.push(
                        dummyERC721TokenContract.mint.sendTransactionAsync(tokenOwnerAddress, tokenId, {
                            from: this._contractOwnerAddress,
                        }),
                    );
                    if (
                        _.isUndefined((this._initialERC721BalancesByOwner as ERC721BalancesByOwner)[tokenOwnerAddress])
                    ) {
                        (this._initialERC721BalancesByOwner as ERC721BalancesByOwner)[tokenOwnerAddress] = {
                            [dummyERC721TokenContract.address]: [],
                        };
                    }
                    if (
                        _.isUndefined(
                            (this._initialERC721BalancesByOwner as ERC721BalancesByOwner)[tokenOwnerAddress][
                                dummyERC721TokenContract.address
                            ],
                        )
                    ) {
                        (this._initialERC721BalancesByOwner as ERC721BalancesByOwner)[tokenOwnerAddress][
                            dummyERC721TokenContract.address
                        ] = [];
                    }
                    (this._initialERC721BalancesByOwner as ERC721BalancesByOwner)[tokenOwnerAddress][
                        dummyERC721TokenContract.address
                    ].push(tokenId);
                });
                const approval = true;
                setAllowancePromises.push(
                    dummyERC721TokenContract.setApprovalForAll.sendTransactionAsync(
                        (this._erc721ProxyContract as ERC721ProxyContract).address,
                        approval,
                        { from: tokenOwnerAddress },
                    ),
                );
            });
        });
        await Promise.all([...setBalancePromises, ...setAllowancePromises]);
    }
    public async getBalancesAsync(): Promise<ERC721BalancesByOwner> {
        if (_.isUndefined(this._dummyERC721TokenContracts)) {
            throw new Error('Dummy ERC721 tokens not yet deployed, please call "deployDummyERC721TokensAsync"');
        }
        if (_.isUndefined(this._initialERC721BalancesByOwner)) {
            throw new Error(
                'Dummy ERC721 balances and allowances not yet set, please call "setBalancesAndAllowancesAsync"',
            );
        }
        const balancesByOwner: ERC721BalancesByOwner = {};
        const tokenOwnerPromises: any[] = [];
        const tokenInfo: Array<{ tokenId: BigNumber; tokenAddress: string }> = [];
        _.forEach(this._dummyERC721TokenContracts, dummyERC721TokenContract => {
            _.forEach(this._tokenOwnerAddresses, tokenOwnerAddress => {
                const initialTokenOwnerIds = (this._initialERC721BalancesByOwner as ERC721BalancesByOwner)[
                    tokenOwnerAddress
                ][dummyERC721TokenContract.address];
                _.forEach(initialTokenOwnerIds, tokenId => {
                    tokenOwnerPromises.push(dummyERC721TokenContract.ownerOf.callAsync(tokenId));
                    tokenInfo.push({
                        tokenId,
                        tokenAddress: dummyERC721TokenContract.address,
                    });
                });
            });
        });
        const tokenOwnerAddresses = await Promise.all(tokenOwnerPromises);
        _.forEach(tokenOwnerAddresses, (tokenOwnerAddress, ownerIndex) => {
            const tokenAddress = tokenInfo[ownerIndex].tokenAddress;
            const tokenId = tokenInfo[ownerIndex].tokenId;
            if (_.isUndefined(balancesByOwner[tokenOwnerAddress])) {
                balancesByOwner[tokenOwnerAddress] = {
                    [tokenAddress]: [],
                };
            }
            if (_.isUndefined(balancesByOwner[tokenOwnerAddress][tokenAddress])) {
                balancesByOwner[tokenOwnerAddress][tokenAddress] = [];
            }
            balancesByOwner[tokenOwnerAddress][tokenAddress].push(tokenId);
        });
        return balancesByOwner;
    }
    public getTokenOwnerAddresses(): string[] {
        return this._tokenOwnerAddresses;
    }
    public getTokenAddresses(): string[] {
        const tokenAddresses = _.map(
            this._dummyERC721TokenContracts,
            dummyERC721TokenContract => dummyERC721TokenContract.address,
        );
        return tokenAddresses;
    }
}
