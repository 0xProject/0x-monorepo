import * as _ from 'lodash';
import {BigNumber} from 'bignumber.js';
import {TokenWrapper} from '../contract_wrappers/token_wrapper';

/**
 * Copy on read store for balances/proxyAllowances of tokens/accounts
 */
export class BalanceAndProxyAllowanceLazyStore {
    private token: TokenWrapper;
    private balance: {
        [tokenAddress: string]: {
            [userAddress: string]: BigNumber,
        },
    };
    private proxyAllowance: {
        [tokenAddress: string]: {
            [userAddress: string]: BigNumber,
        },
    };
    constructor(token: TokenWrapper) {
        this.token = token;
        this.balance = {};
        this.proxyAllowance = {};
    }
    public async getBalanceAsync(tokenAddress: string, userAddress: string): Promise<BigNumber> {
        if (_.isUndefined(this.balance[tokenAddress]) || _.isUndefined(this.balance[tokenAddress][userAddress])) {
            const balance = await this.token.getBalanceAsync(tokenAddress, userAddress);
            this.setBalance(tokenAddress, userAddress, balance);
        }
        const cachedBalance = this.balance[tokenAddress][userAddress];
        return cachedBalance;
    }
    public setBalance(tokenAddress: string, userAddress: string, balance: BigNumber): void {
        if (_.isUndefined(this.balance[tokenAddress])) {
            this.balance[tokenAddress] = {};
        }
        this.balance[tokenAddress][userAddress] = balance;
    }
    public async getProxyAllowanceAsync(tokenAddress: string, userAddress: string): Promise<BigNumber> {
        if (_.isUndefined(this.proxyAllowance[tokenAddress]) ||
            _.isUndefined(this.proxyAllowance[tokenAddress][userAddress])) {
            const proxyAllowance = await this.token.getProxyAllowanceAsync(tokenAddress, userAddress);
            this.setProxyAllowance(tokenAddress, userAddress, proxyAllowance);
        }
        const cachedProxyAllowance = this.proxyAllowance[tokenAddress][userAddress];
        return cachedProxyAllowance;
    }
    public setProxyAllowance(tokenAddress: string, userAddress: string, proxyAllowance: BigNumber): void {
        if (_.isUndefined(this.proxyAllowance[tokenAddress])) {
            this.proxyAllowance[tokenAddress] = {};
        }
        this.proxyAllowance[tokenAddress][userAddress] = proxyAllowance;
    }
}
