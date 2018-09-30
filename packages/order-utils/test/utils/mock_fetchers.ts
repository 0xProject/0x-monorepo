import { BigNumber } from '@0xproject/utils';

import { AbstractBalanceAndProxyAllowanceFetcher } from '../../src/abstract/abstract_balance_and_proxy_allowance_fetcher';
import { AbstractOrderFilledCancelledFetcher } from '../../src/abstract/abstract_order_filled_cancelled_fetcher';

export const buildMockBalanceFetcher = (takerBalance: BigNumber): AbstractBalanceAndProxyAllowanceFetcher => {
    const balanceFetcher = {
        async getBalanceAsync(_assetData: string, _userAddress: string): Promise<BigNumber> {
            return takerBalance;
        },
        async getProxyAllowanceAsync(_assetData: string, _userAddress: string): Promise<BigNumber> {
            return takerBalance;
        },
    };
    return balanceFetcher;
};

export const buildMockOrderFilledFetcher = (
    filledAmount: BigNumber = new BigNumber(0),
    cancelled: boolean = false,
): AbstractOrderFilledCancelledFetcher => {
    const orderFetcher = {
        async getFilledTakerAmountAsync(_orderHash: string): Promise<BigNumber> {
            return filledAmount;
        },
        async isOrderCancelledAsync(_orderHash: string): Promise<boolean> {
            return cancelled;
        },
        getZRXAssetData(): string {
            return '';
        },
    };
    return orderFetcher;
};
