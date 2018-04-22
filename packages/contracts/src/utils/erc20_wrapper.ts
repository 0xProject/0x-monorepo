import { Deployer } from '@0xproject/deployer';
import { Provider } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { DummyERC20TokenContract } from '../contract_wrappers/generated/dummy_e_r_c20_token';
import { ERC20ProxyContract } from '../contract_wrappers/generated/e_r_c20_proxy';

import { constants } from './constants';
import { ContractName, ERC20BalancesByOwner } from './types';

export class ERC20Wrapper {
    private _tokenOwnerAddresses: string[];
    private _contractOwnerAddress: string;
    private _deployer: Deployer;
    private _provider: Provider;
    private _dummyERC20TokenContracts?: DummyERC20TokenContract[];
    private _erc20ProxyContract?: ERC20ProxyContract;
    constructor(deployer: Deployer, provider: Provider, tokenOwnerAddresses: string[], contractOwnerAddress: string) {
        this._deployer = deployer;
        this._provider = provider;
        this._tokenOwnerAddresses = tokenOwnerAddresses;
        this._contractOwnerAddress = contractOwnerAddress;
    }
    public async deployDummyERC20TokensAsync(): Promise<DummyERC20TokenContract[]> {
        const tokenContractInstances = await Promise.all(
            _.map(this._tokenOwnerAddresses, tokenOwnerAddress =>
                this._deployer.deployAsync(ContractName.DummyERC20Token, constants.DUMMY_ERC20_TOKEN_ARGS),
            ),
        );
        this._dummyERC20TokenContracts = _.map(
            tokenContractInstances,
            tokenContractInstance =>
                new DummyERC20TokenContract(tokenContractInstance.abi, tokenContractInstance.address, this._provider),
        );
        return this._dummyERC20TokenContracts;
    }
    public async deployERC20ProxyAsync(): Promise<ERC20ProxyContract> {
        const proxyContractInstance = await this._deployer.deployAsync(ContractName.ERC20Proxy);
        this._erc20ProxyContract = new ERC20ProxyContract(
            proxyContractInstance.abi,
            proxyContractInstance.address,
            this._provider,
        );
        return this._erc20ProxyContract;
    }
    public async setBalancesAndAllowancesAsync() {
        if (_.isUndefined(this._dummyERC20TokenContracts)) {
            throw new Error('Dummy ERC20 tokens not yet deployed, please call "deployDummyERC20TokensAsync"');
        }
        if (_.isUndefined(this._erc20ProxyContract)) {
            throw new Error('ERC20 proxy contract not yet deployed, please call "deployERC20ProxyAsync"');
        }
        const setBalancePromises: any[] = [];
        const setAllowancePromises: any[] = [];
        _.forEach(this._dummyERC20TokenContracts, dummyERC20TokenContract => {
            _.forEach(this._tokenOwnerAddresses, tokenOwnerAddress => {
                setBalancePromises.push(
                    dummyERC20TokenContract.setBalance.sendTransactionAsync(
                        tokenOwnerAddress,
                        constants.INITIAL_ERC20_BALANCE,
                        { from: this._contractOwnerAddress },
                    ),
                );
                setAllowancePromises.push(
                    dummyERC20TokenContract.approve.sendTransactionAsync(
                        (this._erc20ProxyContract as ERC20ProxyContract).address,
                        constants.INITIAL_ERC20_ALLOWANCE,
                        { from: tokenOwnerAddress },
                    ),
                );
            });
        });
        await Promise.all([...setBalancePromises, ...setAllowancePromises]);
    }
    public async getBalancesAsync(): Promise<ERC20BalancesByOwner> {
        if (_.isUndefined(this._dummyERC20TokenContracts)) {
            throw new Error('Dummy ERC20 tokens not yet deployed, please call "deployDummyTokensAsync"');
        }
        const balancesByOwner: ERC20BalancesByOwner = {};
        const balancePromises: any[] = [];
        const balanceInfo: Array<{ tokenOwnerAddress: string; tokenAddress: string }> = [];
        _.forEach(this._dummyERC20TokenContracts, dummyERC20TokenContract => {
            _.forEach(this._tokenOwnerAddresses, tokenOwnerAddress => {
                balancePromises.push(dummyERC20TokenContract.balanceOf.callAsync(tokenOwnerAddress));
                balanceInfo.push({
                    tokenOwnerAddress,
                    tokenAddress: dummyERC20TokenContract.address,
                });
            });
        });
        const balances = await Promise.all(balancePromises);
        _.forEach(balances, (balance, balanceIndex) => {
            const tokenAddress = balanceInfo[balanceIndex].tokenAddress;
            const tokenOwnerAddress = balanceInfo[balanceIndex].tokenOwnerAddress;
            if (_.isUndefined(balancesByOwner[tokenOwnerAddress])) {
                balancesByOwner[tokenOwnerAddress] = {};
            }
            const wrappedBalance = new BigNumber(balance);
            balancesByOwner[tokenOwnerAddress][tokenAddress] = wrappedBalance;
        });
        return balancesByOwner;
    }
    public getTokenOwnerAddresses(): string[] {
        return this._tokenOwnerAddresses;
    }
    public getTokenAddresses(): string[] {
        const tokenAddresses = _.map(
            this._dummyERC20TokenContracts,
            dummyERC20TokenContract => dummyERC20TokenContract.address,
        );
        return tokenAddresses;
    }
}
