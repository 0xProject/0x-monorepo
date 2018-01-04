import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { ExchangeWrapper } from '../contract_wrappers/exchange_wrapper';
import { BlockParamLiteral } from '../types';

/**
 * Copy on read store for filled/cancelled taker amounts
 */
export class OrderFilledCancelledLazyStore {
    private _exchange: ExchangeWrapper;
    private _filledTakerAmount: {
        [orderHash: string]: BigNumber;
    };
    private _cancelledTakerAmount: {
        [orderHash: string]: BigNumber;
    };
    constructor(exchange: ExchangeWrapper) {
        this._exchange = exchange;
        this._filledTakerAmount = {};
        this._cancelledTakerAmount = {};
    }
    public async getFilledTakerAmountAsync(orderHash: string): Promise<BigNumber> {
        if (_.isUndefined(this._filledTakerAmount[orderHash])) {
            const methodOpts = {
                defaultBlock: BlockParamLiteral.Pending,
            };
            const filledTakerAmount = await this._exchange.getFilledTakerAmountAsync(orderHash, methodOpts);
            this.setFilledTakerAmount(orderHash, filledTakerAmount);
        }
        const cachedFilled = this._filledTakerAmount[orderHash];
        return cachedFilled;
    }
    public setFilledTakerAmount(orderHash: string, filledTakerAmount: BigNumber): void {
        this._filledTakerAmount[orderHash] = filledTakerAmount;
    }
    public deleteFilledTakerAmount(orderHash: string): void {
        delete this._filledTakerAmount[orderHash];
    }
    public async getCancelledTakerAmountAsync(orderHash: string): Promise<BigNumber> {
        if (_.isUndefined(this._cancelledTakerAmount[orderHash])) {
            const methodOpts = {
                defaultBlock: BlockParamLiteral.Pending,
            };
            const cancelledTakerAmount = await this._exchange.getCancelledTakerAmountAsync(orderHash, methodOpts);
            this.setCancelledTakerAmount(orderHash, cancelledTakerAmount);
        }
        const cachedCancelled = this._cancelledTakerAmount[orderHash];
        return cachedCancelled;
    }
    public setCancelledTakerAmount(orderHash: string, cancelledTakerAmount: BigNumber): void {
        this._cancelledTakerAmount[orderHash] = cancelledTakerAmount;
    }
    public deleteCancelledTakerAmount(orderHash: string): void {
        delete this._cancelledTakerAmount[orderHash];
    }
    public deleteAll(): void {
        this._filledTakerAmount = {};
        this._cancelledTakerAmount = {};
    }
}
