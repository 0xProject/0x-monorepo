import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { TokenWrapper } from '../contract_wrappers/token_wrapper';
import { BlockParamLiteral } from '../types';

/**
 * Copy on read store for balances/proxyAllowances of tokens/accounts
 */
export class BalanceAndProxyAllowanceLazyStore {
    private _token: TokenWrapper;
    private _defaultBlock: BlockParamLiteral;
    private _balance: {
        [tokenAddress: string]: {
            [userAddress: string]: BigNumber;
        };
    };
    private _proxyAllowance: {
        [tokenAddress: string]: {
            [userAddress: string]: BigNumber;
        };
    };
    constructor(token: TokenWrapper, defaultBlock: BlockParamLiteral) {
        this._token = token;
        this._defaultBlock = defaultBlock;
        this._balance = {};
        this._proxyAllowance = {};
    }
    public async getBalanceAsync(tokenAddress: string, userAddress: string): Promise<BigNumber> {
        if (_.isUndefined(this._balance[tokenAddress]) || _.isUndefined(this._balance[tokenAddress][userAddress])) {
            const methodOpts = {
                defaultBlock: this._defaultBlock,
            };
            const balance = await this._token.getBalanceAsync(tokenAddress, userAddress, methodOpts);
            this.setBalance(tokenAddress, userAddress, balance);
        }
        const cachedBalance = this._balance[tokenAddress][userAddress];
        return cachedBalance;
    }
    public setBalance(tokenAddress: string, userAddress: string, balance: BigNumber): void {
        if (_.isUndefined(this._balance[tokenAddress])) {
            this._balance[tokenAddress] = {};
        }
        this._balance[tokenAddress][userAddress] = balance;
    }
    public deleteBalance(tokenAddress: string, userAddress: string): void {
        if (!_.isUndefined(this._balance[tokenAddress])) {
            delete this._balance[tokenAddress][userAddress];
            if (_.isEmpty(this._balance[tokenAddress])) {
                delete this._balance[tokenAddress];
            }
        }
    }
    public async getProxyAllowanceAsync(tokenAddress: string, userAddress: string): Promise<BigNumber> {
        if (
            _.isUndefined(this._proxyAllowance[tokenAddress]) ||
            _.isUndefined(this._proxyAllowance[tokenAddress][userAddress])
        ) {
            const methodOpts = {
                defaultBlock: this._defaultBlock,
            };
            const proxyAllowance = await this._token.getProxyAllowanceAsync(tokenAddress, userAddress, methodOpts);
            this.setProxyAllowance(tokenAddress, userAddress, proxyAllowance);
        }
        const cachedProxyAllowance = this._proxyAllowance[tokenAddress][userAddress];
        return cachedProxyAllowance;
    }
    public setProxyAllowance(tokenAddress: string, userAddress: string, proxyAllowance: BigNumber): void {
        if (_.isUndefined(this._proxyAllowance[tokenAddress])) {
            this._proxyAllowance[tokenAddress] = {};
        }
        this._proxyAllowance[tokenAddress][userAddress] = proxyAllowance;
    }
    public deleteProxyAllowance(tokenAddress: string, userAddress: string): void {
        if (!_.isUndefined(this._proxyAllowance[tokenAddress])) {
            delete this._proxyAllowance[tokenAddress][userAddress];
            if (_.isEmpty(this._proxyAllowance[tokenAddress])) {
                delete this._proxyAllowance[tokenAddress];
            }
        }
    }
    public deleteAll(): void {
        this._balance = {};
        this._proxyAllowance = {};
    }
}
