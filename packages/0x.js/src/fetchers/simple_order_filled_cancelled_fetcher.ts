import { BlockParamLiteral } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

import {OrderFilledCancelledFetcher} from '../abstract/order_filled_cancelled_fetcher';
import {ExchangeWrapper} from '../contract_wrappers/exchange_wrapper';

export class SimpleOrderFilledCancelledFetcher implements OrderFilledCancelledFetcher {
    private _exchange: ExchangeWrapper;
    constructor(exchange: ExchangeWrapper) {
        this._exchange = exchange;
    }
    public async getFilledTakerAmountAsync(orderHash: string): Promise<BigNumber> {
        const methodOpts = {
            defaultBlock: BlockParamLiteral.Pending,
        };
        return this._exchange.getFilledTakerAmountAsync(orderHash, methodOpts);
    }
    public async getCancelledTakerAmountAsync(orderHash: string): Promise<BigNumber> {
        const methodOpts = {
            defaultBlock: BlockParamLiteral.Pending,
        };
        return this._exchange.getCancelledTakerAmountAsync(orderHash, methodOpts);
    }
}
