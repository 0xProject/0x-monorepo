import { assetDataUtils } from '@0x/order-utils';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Provider } from 'ethereum-types';
import * as _ from 'lodash';

import { DummyERC20TokenContract } from '../../generated-wrappers/dummy_erc20_token';
import { ERC20ProxyContract } from '../../generated-wrappers/erc20_proxy';
import { artifacts } from '../../src/artifacts';

import { constants } from './constants';
import { ERC20BalancesByOwner } from './types';
import { txDefaults } from './web3_wrapper';

export class ERC20Wrapper {
    private readonly _tokenOwnerAddresses: string[];
    private readonly _contractOwnerAddress: string;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _provider: Provider;
    private readonly _dummyTokenContracts: DummyERC20TokenContract[];
    private _proxyContract?: ERC20ProxyContract;
    private _proxyIdIfExists?: string;
    /**
     * Instanitates an ERC20Wrapper
     * @param provider Web3 provider to use for all JSON RPC requests
     * @param tokenOwnerAddresses Addresses that we want to endow as owners for dummy ERC20 tokens
     * @param contractOwnerAddress Desired owner of the contract
     * Instance of ERC20Wrapper
     */
    constructor(provider: Provider, tokenOwnerAddresses: string[], contractOwnerAddress: string) {
        this._dummyTokenContracts = [];
        this._web3Wrapper = new Web3Wrapper(provider);
        this._provider = provider;
        this._tokenOwnerAddresses = tokenOwnerAddresses;
        this._contractOwnerAddress = contractOwnerAddress;
    }
    public async deployDummyTokensAsync(
        numberToDeploy: number,
        decimals: BigNumber,
    ): Promise<DummyERC20TokenContract[]> {
        for (let i = 0; i < numberToDeploy; i++) {
            this._dummyTokenContracts.push(
                await DummyERC20TokenContract.deployFrom0xArtifactAsync(
                    artifacts.DummyERC20Token,
                    this._provider,
                    txDefaults,
                    constants.DUMMY_TOKEN_NAME,
                    constants.DUMMY_TOKEN_SYMBOL,
                    decimals,
                    constants.DUMMY_TOKEN_TOTAL_SUPPLY,
                ),
            );
        }
        return this._dummyTokenContracts;
    }
    public async deployProxyAsync(): Promise<ERC20ProxyContract> {
        this._proxyContract = await ERC20ProxyContract.deployFrom0xArtifactAsync(
            artifacts.ERC20Proxy,
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
    public async setBalancesAndAllowancesAsync(): Promise<void> {
        this._validateDummyTokenContractsExistOrThrow();
        this._validateProxyContractExistsOrThrow();
        for (const dummyTokenContract of this._dummyTokenContracts) {
            for (const tokenOwnerAddress of this._tokenOwnerAddresses) {
                await this._web3Wrapper.awaitTransactionSuccessAsync(
                    await dummyTokenContract.setBalance.sendTransactionAsync(
                        tokenOwnerAddress,
                        constants.INITIAL_ERC20_BALANCE,
                        { from: this._contractOwnerAddress },
                    ),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
                await this._web3Wrapper.awaitTransactionSuccessAsync(
                    await dummyTokenContract.approve.sendTransactionAsync(
                        (this._proxyContract as ERC20ProxyContract).address,
                        constants.INITIAL_ERC20_ALLOWANCE,
                        { from: tokenOwnerAddress },
                    ),
                    constants.AWAIT_TRANSACTION_MINED_MS,
                );
            }
        }
    }
    public async getBalanceAsync(userAddress: string, assetData: string): Promise<BigNumber> {
        const tokenContract = this._getTokenContractFromAssetData(assetData);
        const balance = new BigNumber(await tokenContract.balanceOf.callAsync(userAddress));
        return balance;
    }
    public async setBalanceAsync(userAddress: string, assetData: string, amount: BigNumber): Promise<void> {
        const tokenContract = this._getTokenContractFromAssetData(assetData);
        await this._web3Wrapper.awaitTransactionSuccessAsync(
            await tokenContract.setBalance.sendTransactionAsync(userAddress, amount, {
                from: this._contractOwnerAddress,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    }
    public async getProxyAllowanceAsync(userAddress: string, assetData: string): Promise<BigNumber> {
        const tokenContract = this._getTokenContractFromAssetData(assetData);
        const proxyAddress = (this._proxyContract as ERC20ProxyContract).address;
        const allowance = new BigNumber(await tokenContract.allowance.callAsync(userAddress, proxyAddress));
        return allowance;
    }
    public async setAllowanceAsync(userAddress: string, assetData: string, amount: BigNumber): Promise<void> {
        const tokenContract = this._getTokenContractFromAssetData(assetData);
        const proxyAddress = (this._proxyContract as ERC20ProxyContract).address;
        await this._web3Wrapper.awaitTransactionSuccessAsync(
            await tokenContract.approve.sendTransactionAsync(proxyAddress, amount, {
                from: userAddress,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
    }
    public async getBalancesAsync(): Promise<ERC20BalancesByOwner> {
        this._validateDummyTokenContractsExistOrThrow();
        const balancesByOwner: ERC20BalancesByOwner = {};
        const balances: BigNumber[] = [];
        const balanceInfo: Array<{ tokenOwnerAddress: string; tokenAddress: string }> = [];
        for (const dummyTokenContract of this._dummyTokenContracts) {
            for (const tokenOwnerAddress of this._tokenOwnerAddresses) {
                balances.push(await dummyTokenContract.balanceOf.callAsync(tokenOwnerAddress));
                balanceInfo.push({
                    tokenOwnerAddress,
                    tokenAddress: dummyTokenContract.address,
                });
            }
        }
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
    public addDummyTokenContract(dummy: DummyERC20TokenContract): void {
        if (!_.isUndefined(this._dummyTokenContracts)) {
            this._dummyTokenContracts.push(dummy);
        }
    }
    public addTokenOwnerAddress(address: string): void {
        this._tokenOwnerAddresses.push(address);
    }
    public getTokenOwnerAddresses(): string[] {
        return this._tokenOwnerAddresses;
    }
    public getTokenAddresses(): string[] {
        const tokenAddresses = _.map(this._dummyTokenContracts, dummyTokenContract => dummyTokenContract.address);
        return tokenAddresses;
    }
    private _getTokenContractFromAssetData(assetData: string): DummyERC20TokenContract {
        const erc20ProxyData = assetDataUtils.decodeERC20AssetData(assetData);
        const tokenAddress = erc20ProxyData.tokenAddress;
        const tokenContractIfExists = _.find(this._dummyTokenContracts, c => c.address === tokenAddress);
        if (_.isUndefined(tokenContractIfExists)) {
            throw new Error(`Token: ${tokenAddress} was not deployed through ERC20Wrapper`);
        }
        return tokenContractIfExists;
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
