import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { AbstractBalanceAndProxyAllowanceFetcher } from '../abstract/abstract_balance_and_proxy_allowance_fetcher';
import { AbstractBalanceAndProxyAllowanceLazyStore } from '../abstract/abstract_balance_and_proxy_allowance_lazy_store';

/**
 * Copy on read store for balances/proxyAllowances of tokens/accounts
 */
export class BalanceAndProxyAllowanceLazyStore implements AbstractBalanceAndProxyAllowanceLazyStore {
    private readonly _balanceAndProxyAllowanceFetcher: AbstractBalanceAndProxyAllowanceFetcher;
    private _balance: {
        [assetData: string]: {
            [userAddress: string]: BigNumber;
        };
    };
    private _proxyAllowance: {
        [assetData: string]: {
            [userAddress: string]: BigNumber;
        };
    };
    /**
     * Instantiates a BalanceAndProxyAllowanceLazyStore
     * @param balanceAndProxyAllowanceFetcher  Class the implements the AbstractBalanceAndProxyAllowanceFetcher
     * @return Instance of BalanceAndProxyAllowanceLazyStore
     */
    constructor(balanceAndProxyAllowanceFetcher: AbstractBalanceAndProxyAllowanceFetcher) {
        this._balanceAndProxyAllowanceFetcher = balanceAndProxyAllowanceFetcher;
        this._balance = {};
        this._proxyAllowance = {};
    }
    /**
     * Get a users balance of an asset
     * @param assetData AssetData of interest
     * @param userAddress Ethereum address of interest
     */
    public async getBalanceAsync(assetData: string, userAddress: string): Promise<BigNumber> {
        if (this._balance[assetData] === undefined || this._balance[assetData][userAddress] === undefined) {
            const balance = await this._balanceAndProxyAllowanceFetcher.getBalanceAsync(assetData, userAddress);
            this.setBalance(assetData, userAddress, balance);
        }
        const cachedBalance = this._balance[assetData][userAddress];
        return cachedBalance;
    }
    /**
     * Set the balance of an asset for a user
     * @param assetData AssetData of interest
     * @param userAddress Ethereum address of interest
     */
    public setBalance(assetData: string, userAddress: string, balance: BigNumber): void {
        if (this._balance[assetData] === undefined) {
            this._balance[assetData] = {};
        }
        this._balance[assetData][userAddress] = balance;
    }
    /**
     * Clear the balance of an asset for a user
     * @param assetData AssetData of interest
     * @param userAddress Ethereum address of interest
     */
    public deleteBalance(assetData: string, userAddress: string): void {
        if (this._balance[assetData] !== undefined) {
            delete this._balance[assetData][userAddress];
            if (_.isEmpty(this._balance[assetData])) {
                delete this._balance[assetData];
            }
        }
    }
    /**
     * Get the 0x asset proxy allowance
     * @param assetData AssetData of interest
     * @param userAddress Ethereum address of interest
     */
    public async getProxyAllowanceAsync(assetData: string, userAddress: string): Promise<BigNumber> {
        if (
            this._proxyAllowance[assetData] === undefined ||
            this._proxyAllowance[assetData][userAddress] === undefined
        ) {
            const proxyAllowance = await this._balanceAndProxyAllowanceFetcher.getProxyAllowanceAsync(
                assetData,
                userAddress,
            );
            this.setProxyAllowance(assetData, userAddress, proxyAllowance);
        }
        const cachedProxyAllowance = this._proxyAllowance[assetData][userAddress];
        return cachedProxyAllowance;
    }
    /**
     * Set the 0x asset proxy allowance
     * @param assetData AssetData of interest
     * @param userAddress Ethereum address of interest
     */
    public setProxyAllowance(assetData: string, userAddress: string, proxyAllowance: BigNumber): void {
        if (this._proxyAllowance[assetData] === undefined) {
            this._proxyAllowance[assetData] = {};
        }
        this._proxyAllowance[assetData][userAddress] = proxyAllowance;
    }
    /**
     * Clear the 0x asset proxy allowance
     * @param assetData AssetData of interest
     * @param userAddress Ethereum address of interest
     */
    public deleteProxyAllowance(assetData: string, userAddress: string): void {
        if (this._proxyAllowance[assetData] !== undefined) {
            delete this._proxyAllowance[assetData][userAddress];
            if (_.isEmpty(this._proxyAllowance[assetData])) {
                delete this._proxyAllowance[assetData];
            }
        }
    }
    /**
     * Delete all balances & allowances
     */
    public deleteAll(): void {
        this._balance = {};
        this._proxyAllowance = {};
    }
}
