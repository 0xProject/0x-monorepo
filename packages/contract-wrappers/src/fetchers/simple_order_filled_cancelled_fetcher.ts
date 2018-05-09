import { AbstractOrderFilledCancelledFetcher } from '@0xproject/order-utils';
import { BlockParamLiteral } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

import { ExchangeWrapper } from '../contract_wrappers/exchange_wrapper';

export class SimpleOrderFilledCancelledFetcher implements AbstractOrderFilledCancelledFetcher {
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
    public async getUnavailableTakerAmountAsync(orderHash: string) {
        return this._exchangeWrapper.getUnavailableTakerAmountAsync(orderHash);
    }
    public getZRXTokenAddress(): string {
        return this._exchangeWrapper.getZRXTokenAddress();
    }
}
