import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';

import { DummyERC20TokenContract } from '../contract_wrappers/generated/dummy_e_r_c20_token';
import { ERC20ProxyContract } from '../contract_wrappers/generated/e_r_c20_proxy';

import { artifacts } from './artifacts';
import { constants } from './constants';
import { ERC20BalancesByOwner } from './types';
import { txDefaults } from './web3_wrapper';

export class ERC20Wrapper {
    private _tokenOwnerAddresses: string[];
    private _contractOwnerAddress: string;
    private _web3Wrapper: Web3Wrapper;
    private _provider: Provider;
    private _dummyTokenContracts?: DummyERC20TokenContract[];
    private _proxyContract?: ERC20ProxyContract;
    constructor(provider: Provider, tokenOwnerAddresses: string[], contractOwnerAddress: string) {
        this._web3Wrapper = new Web3Wrapper(provider);
        this._provider = provider;
        this._tokenOwnerAddresses = tokenOwnerAddresses;
        this._contractOwnerAddress = contractOwnerAddress;
    }
    public async deployDummyTokensAsync(): Promise<DummyERC20TokenContract[]> {
        this._dummyTokenContracts = await Promise.all(
            _.times(constants.NUM_DUMMY_ERC20_TO_DEPLOY, async () =>
                DummyERC20TokenContract.deployFrom0xArtifactAsync(
                    artifacts.DummyERC20Token,
                    this._provider,
                    txDefaults,
                    constants.DUMMY_TOKEN_NAME,
                    constants.DUMMY_TOKEN_SYMBOL,
                    constants.DUMMY_TOKEN_DECIMALS,
                    constants.DUMMY_TOKEN_TOTAL_SUPPLY,
                ),
            ),
        );
        return this._dummyTokenContracts;
    }
    public async deployProxyAsync(): Promise<ERC20ProxyContract> {
        this._proxyContract = await ERC20ProxyContract.deployFrom0xArtifactAsync(
            artifacts.ERC20Proxy,
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
        const txHashes = await Promise.all([...setBalancePromises, ...setAllowancePromises]);
        await Promise.all(_.map(txHashes, async txHash => this._web3Wrapper.awaitTransactionSuccessAsync(txHash)));
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
    private _validateDummyTokenContractsExistOrThrow(): void {
        if (_.isUndefined(this._dummyTokenContracts)) {
            throw new Error('Dummy ERC20 tokens not yet deployed, please call "deployDummyTokensAsync"');
        }
    }
    private _validateProxyContractExistsOrThrow(): void {
        if (_.isUndefined(this._proxyContract)) {
            throw new Error('ERC20 proxy contract not yet deployed, please call "deployProxyAsync"');
        }
    }
}
