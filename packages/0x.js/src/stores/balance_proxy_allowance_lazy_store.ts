import {BigNumber} from 'bignumber.js';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import {TokenWrapper} from '../contract_wrappers/token_wrapper';
import {BlockParamLiteral} from '../types';

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
            const methodOpts = {
                defaultBlock: BlockParamLiteral.Pending,
            };
            const balance = await this.token.getBalanceAsync(tokenAddress, userAddress, methodOpts);
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
    public deleteBalance(tokenAddress: string, userAddress: string): void {
        if (!_.isUndefined(this.balance[tokenAddress])) {
            delete this.balance[tokenAddress][userAddress];
            if (_.isEmpty(this.balance[tokenAddress])) {
                delete this.balance[tokenAddress];
            }
        }
    }
    public async getProxyAllowanceAsync(tokenAddress: string, userAddress: string): Promise<BigNumber> {
        if (_.isUndefined(this.proxyAllowance[tokenAddress]) ||
            _.isUndefined(this.proxyAllowance[tokenAddress][userAddress])) {
            const methodOpts = {
                defaultBlock: BlockParamLiteral.Pending,
            };
            const proxyAllowance = await this.token.getProxyAllowanceAsync(tokenAddress, userAddress, methodOpts);
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
    public deleteProxyAllowance(tokenAddress: string, userAddress: string): void {
        if (!_.isUndefined(this.proxyAllowance[tokenAddress])) {
            delete this.proxyAllowance[tokenAddress][userAddress];
            if (_.isEmpty(this.proxyAllowance[tokenAddress])) {
                delete this.proxyAllowance[tokenAddress];
            }
        }
    }
    public deleteAll(): void {
        this.balance = {};
        this.proxyAllowance = {};
    }
}
