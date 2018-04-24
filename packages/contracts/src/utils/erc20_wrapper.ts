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
    private _dummyTokenContracts?: DummyERC20TokenContract[];
    private _proxyContract?: ERC20ProxyContract;
    constructor(deployer: Deployer, provider: Provider, tokenOwnerAddresses: string[], contractOwnerAddress: string) {
        this._deployer = deployer;
        this._provider = provider;
        this._tokenOwnerAddresses = tokenOwnerAddresses;
        this._contractOwnerAddress = contractOwnerAddress;
    }
    public async deployDummyTokensAsync(): Promise<DummyERC20TokenContract[]> {
        const tokenContractInstances = await Promise.all(
            _.times(constants.NUM_DUMMY_ERC20_TO_DEPLOY, () =>
                this._deployer.deployAsync(ContractName.DummyERC20Token, constants.DUMMY_ERC20_TOKEN_ARGS),
            ),
        );
        this._dummyTokenContracts = _.map(
            tokenContractInstances,
            tokenContractInstance =>
                new DummyERC20TokenContract(tokenContractInstance.abi, tokenContractInstance.address, this._provider),
        );
        return this._dummyTokenContracts;
    }
    public async deployProxyAsync(): Promise<ERC20ProxyContract> {
        const proxyContractInstance = await this._deployer.deployAsync(ContractName.ERC20Proxy);
        this._proxyContract = new ERC20ProxyContract(
            proxyContractInstance.abi,
            proxyContractInstance.address,
            this._provider,
        );
        return this._proxyContract;
    }
    public async setBalancesAndAllowancesAsync() {
        this._validateDummyTokenContractsExistOrThrow();
        this._validateProxyContractExistsOrThrow();
        const setBalancePromises: Array<Promise<string>> = [];
        const setAllowancePromises: Array<Promise<string>> = [];
        _.forEach(this._dummyTokenContracts, dummyTokenContract => {
            _.forEach(this._tokenOwnerAddresses, tokenOwnerAddress => {
                setBalancePromises.push(
                    dummyTokenContract.setBalance.sendTransactionAsync(
                        tokenOwnerAddress,
                        constants.INITIAL_ERC20_BALANCE,
                        { from: this._contractOwnerAddress },
                    ),
                );
                setAllowancePromises.push(
                    dummyTokenContract.approve.sendTransactionAsync(
                        (this._proxyContract as ERC20ProxyContract).address,
                        constants.INITIAL_ERC20_ALLOWANCE,
                        { from: tokenOwnerAddress },
                    ),
                );
            });
        });
        await Promise.all([...setBalancePromises, ...setAllowancePromises]);
    }
    public async getBalancesAsync(): Promise<ERC20BalancesByOwner> {
        this._validateDummyTokenContractsExistOrThrow();
        const balancesByOwner: ERC20BalancesByOwner = {};
        const balancePromises: Array<Promise<BigNumber>> = [];
        const balanceInfo: Array<{ tokenOwnerAddress: string; tokenAddress: string }> = [];
        _.forEach(this._dummyTokenContracts, dummyTokenContract => {
            _.forEach(this._tokenOwnerAddresses, tokenOwnerAddress => {
                balancePromises.push(dummyTokenContract.balanceOf.callAsync(tokenOwnerAddress));
                balanceInfo.push({
                    tokenOwnerAddress,
                    tokenAddress: dummyTokenContract.address,
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
        const tokenAddresses = _.map(this._dummyTokenContracts, dummyTokenContract => dummyTokenContract.address);
        return tokenAddresses;
    }
    private _validateDummyTokenContractsExistOrThrow() {
        if (_.isUndefined(this._dummyTokenContracts)) {
            throw new Error('Dummy ERC20 tokens not yet deployed, please call "deployDummyTokensAsync"');
        }
    }
    private _validateProxyContractExistsOrThrow() {
        if (_.isUndefined(this._proxyContract)) {
            throw new Error('ERC20 proxy contract not yet deployed, please call "deployProxyAsync"');
        }
    }
}
