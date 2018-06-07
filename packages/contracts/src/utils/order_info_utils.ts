import { assetProxyUtils, OrderStateUtils } from '@0xproject/order-utils';
import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

import { ExchangeContract } from '../contract_wrappers/generated/exchange';

import { constants } from './constants';
import { ERC20Wrapper } from './erc20_wrapper';
import { SimpleERC20BalanceAndProxyAllowanceFetcher } from './simple_erc20_balance_and_allowance_fetcher';
import { SimpleOrderFilledCancelledFetcher } from './simple_filled_cancelled_fetcher';

export class OrderInfoUtils {
    private _orderStateUtils: OrderStateUtils;
    private _erc20Wrapper: ERC20Wrapper;
    constructor(exchangeContract: ExchangeContract, erc20Wrapper: ERC20Wrapper, zrxAddress: string) {
        this._erc20Wrapper = erc20Wrapper;
        const simpleOrderFilledCancelledFetcher = new SimpleOrderFilledCancelledFetcher(exchangeContract, zrxAddress);
        const simpleERC20BalanceAndProxyAllowanceFetcher = new SimpleERC20BalanceAndProxyAllowanceFetcher(erc20Wrapper);
        this._orderStateUtils = new OrderStateUtils(
            simpleERC20BalanceAndProxyAllowanceFetcher,
            simpleOrderFilledCancelledFetcher,
        );
    }
    public async getFillableTakerAssetAmountAsync(signedOrder: SignedOrder, takerAddress: string): Promise<BigNumber> {
        const orderRelevantState = await this._orderStateUtils.getOrderRelevantStateAsync(signedOrder);
        console.log('orderRelevantState', orderRelevantState);
        if (takerAddress === constants.NULL_ADDRESS) {
            return orderRelevantState.remainingFillableTakerAssetAmount;
        }
        const takerAssetData = assetProxyUtils.decodeERC20ProxyData(signedOrder.takerAssetData);
        const takerBalance = await this._erc20Wrapper.getBalanceAsync(takerAddress, takerAssetData.tokenAddress);
        const takerAllowance = await this._erc20Wrapper.getProxyAllowanceAsync(
            takerAddress,
            takerAssetData.tokenAddress,
        );
        // TODO: We also need to make sure taker has sufficient ZRX for fees...
        const fillableTakerAssetAmount = BigNumber.min([
            takerBalance,
            takerAllowance,
            orderRelevantState.remainingFillableTakerAssetAmount,
        ]);
        return fillableTakerAssetAmount;
    }
}
