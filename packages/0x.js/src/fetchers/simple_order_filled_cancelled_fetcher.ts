import { BlockParamLiteral } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

import { OrderFilledCancelledFetcher } from '../abstract/order_filled_cancelled_fetcher';
import { ExchangeWrapper } from '../contract_wrappers/exchange_wrapper';

export class SimpleOrderFilledCancelledFetcher implements OrderFilledCancelledFetcher {
    private _exchangeWrapper: ExchangeWrapper;
    private _defaultBlock: BlockParamLiteral;
    constructor(exchange: ExchangeWrapper, defaultBlock: BlockParamLiteral) {
        this._exchangeWrapper = exchange;
        this._defaultBlock = defaultBlock;
    }
    public async getFilledTakerAmountAsync(orderHash: string): Promise<BigNumber> {
        const methodOpts = {
            defaultBlock: this._defaultBlock,
        };
        const filledTakerAmount = this._exchangeWrapper.getFilledTakerAmountAsync(orderHash, methodOpts);
        return filledTakerAmount;
    }
    public async getCancelledTakerAmountAsync(orderHash: string): Promise<BigNumber> {
        const methodOpts = {
            defaultBlock: this._defaultBlock,
        };
        const cancelledTakerAmount = this._exchangeWrapper.getCancelledTakerAmountAsync(orderHash, methodOpts);
        return cancelledTakerAmount;
    }
}
