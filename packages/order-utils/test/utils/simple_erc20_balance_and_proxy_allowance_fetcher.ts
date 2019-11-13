import { ERC20TokenContract } from '@0x/abi-gen-wrappers';
import { BigNumber } from '@0x/utils';

import { AbstractBalanceAndProxyAllowanceFetcher } from '../../src/abstract/abstract_balance_and_proxy_allowance_fetcher';

export class SimpleERC20BalanceAndProxyAllowanceFetcher implements AbstractBalanceAndProxyAllowanceFetcher {
    private readonly _erc20TokenContract: ERC20TokenContract;
    private readonly _erc20ProxyAddress: string;
    constructor(erc20TokenWrapper: ERC20TokenContract, erc20ProxyAddress: string) {
        this._erc20TokenContract = erc20TokenWrapper;
        this._erc20ProxyAddress = erc20ProxyAddress;
    }
    public async getBalanceAsync(_assetData: string, userAddress: string): Promise<BigNumber> {
        // HACK: We cheat and don't pass in the assetData since it's always the same token used
        // in our tests.
        const balance = await this._erc20TokenContract.balanceOf(userAddress).callAsync();
        return balance;
    }
    public async getProxyAllowanceAsync(_assetData: string, userAddress: string): Promise<BigNumber> {
        // HACK: We cheat and don't pass in the assetData since it's always the same token used
        // in our tests.
        const proxyAllowance = await this._erc20TokenContract
            .allowance(userAddress, this._erc20ProxyAddress)
            .callAsync();
        return proxyAllowance;
    }
}
