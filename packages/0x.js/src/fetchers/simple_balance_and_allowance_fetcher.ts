import { BlockParamLiteral } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

import {BalanceAndAllowanceFetcher} from '../abstract/balance_and_allowance_fetcher';
import {TokenWrapper} from '../contract_wrappers/token_wrapper';

export class SimpleBalanceAndAllowanceFetcher implements BalanceAndAllowanceFetcher {
    private _token: TokenWrapper;
    private _defaultBlock: BlockParamLiteral;
    constructor(token: TokenWrapper, defaultBlock: BlockParamLiteral) {
        this._token = token;
        this._defaultBlock = defaultBlock;
    }
    public async getBalanceAsync(tokenAddress: string, userAddress: string): Promise<BigNumber> {
        const methodOpts = {
            defaultBlock: this._defaultBlock,
        };
        return this._token.getBalanceAsync(tokenAddress, userAddress, methodOpts);
    }
    public async getProxyAllowanceAsync(tokenAddress: string, userAddress: string): Promise<BigNumber> {
        const methodOpts = {
            defaultBlock: this._defaultBlock,
        };
        return this._token.getProxyAllowanceAsync(tokenAddress, userAddress, methodOpts);
    }
}
