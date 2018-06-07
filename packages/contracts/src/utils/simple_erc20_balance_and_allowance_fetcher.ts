import { AbstractBalanceAndProxyAllowanceFetcher } from '@0xproject/order-utils';
import { BigNumber } from '@0xproject/utils';

import { ERC20Wrapper } from './erc20_wrapper';

// TODO(fabio): Refactor this to also work for ERC721!
export class SimpleERC20BalanceAndProxyAllowanceFetcher implements AbstractBalanceAndProxyAllowanceFetcher {
    private _erc20TokenWrapper: ERC20Wrapper;
    constructor(erc20TokenWrapper: ERC20Wrapper) {
        this._erc20TokenWrapper = erc20TokenWrapper;
    }
    public async getBalanceAsync(tokenAddress: string, userAddress: string): Promise<BigNumber> {
        const balance = await this._erc20TokenWrapper.getBalanceAsync(userAddress, tokenAddress);
        return balance;
    }
    public async getProxyAllowanceAsync(tokenAddress: string, userAddress: string): Promise<BigNumber> {
        const proxyAllowance = await this._erc20TokenWrapper.getProxyAllowanceAsync(userAddress, tokenAddress);
        return proxyAllowance;
    }
}
