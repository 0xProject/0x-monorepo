import { BigNumber } from '@0xproject/utils';

import { AbstractBalanceAndProxyAllowanceFetcher } from '../../src/abstract/abstract_balance_and_proxy_allowance_fetcher';

import { ERC20TokenContract } from '../../src/generated_contract_wrappers/e_r_c20_token';

export class SimpleERC20BalanceAndProxyAllowanceFetcher implements AbstractBalanceAndProxyAllowanceFetcher {
    private _erc20TokenContract: ERC20TokenContract;
    private _erc20ProxyAddress: string;
    constructor(erc20TokenWrapper: ERC20TokenContract, erc20ProxyAddress: string) {
        this._erc20TokenContract = erc20TokenWrapper;
        this._erc20ProxyAddress = erc20ProxyAddress;
    }
    public async getBalanceAsync(_assetData: string, userAddress: string): Promise<BigNumber> {
        // HACK: We cheat and don't pass in the assetData since it's always the same token used
        // in our tests.
        const balance = await this._erc20TokenContract.balanceOf.callAsync(userAddress);
        return balance;
    }
    public async getProxyAllowanceAsync(_assetData: string, userAddress: string): Promise<BigNumber> {
        // HACK: We cheat and don't pass in the assetData since it's always the same token used
        // in our tests.
        const proxyAllowance = await this._erc20TokenContract.allowance.callAsync(userAddress, this._erc20ProxyAddress);
        return proxyAllowance;
    }
}
