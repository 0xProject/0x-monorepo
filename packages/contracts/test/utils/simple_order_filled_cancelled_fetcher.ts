import { AbstractOrderFilledCancelledFetcher } from '@0xproject/order-utils';
import { BigNumber } from '@0xproject/utils';

import { ExchangeWrapper } from './exchange_wrapper';

export class SimpleOrderFilledCancelledFetcher implements AbstractOrderFilledCancelledFetcher {
    private _exchangeWrapper: ExchangeWrapper;
    private _zrxAssetData: string;
    constructor(exchange: ExchangeWrapper, zrxAssetData: string) {
        this._exchangeWrapper = exchange;
        this._zrxAssetData = zrxAssetData;
    }
    public async getFilledTakerAmountAsync(orderHash: string): Promise<BigNumber> {
        const filledTakerAmount = new BigNumber(await this._exchangeWrapper.getTakerAssetFilledAmountAsync(orderHash));
        return filledTakerAmount;
    }
    public async isOrderCancelledAsync(orderHash: string): Promise<boolean> {
        const isCancelled = await this._exchangeWrapper.isCancelledAsync(orderHash);
        return isCancelled;
    }
    public getZRXAssetData(): string {
        return this._zrxAssetData;
    }
}
