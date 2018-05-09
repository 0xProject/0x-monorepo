import { AbstractOrderFilledCancelledFetcher } from '@0xproject/order-utils';
import { BlockParamLiteral } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { ExchangeWrapper } from '../contract_wrappers/exchange_wrapper';

/**
 * Copy on read store for filled/cancelled taker amounts
 */
export class OrderFilledCancelledLazyStore implements AbstractOrderFilledCancelledFetcher {
    private _exchangeWrapper: ExchangeWrapper;
    private _defaultBlock: BlockParamLiteral;
    private _filledTakerAmount: {
        [orderHash: string]: BigNumber;
    };
    private _cancelledTakerAmount: {
        [orderHash: string]: BigNumber;
    };
    constructor(exchange: ExchangeWrapper, defaultBlock: BlockParamLiteral) {
        this._exchangeWrapper = exchange;
        this._defaultBlock = defaultBlock;
        this._filledTakerAmount = {};
        this._cancelledTakerAmount = {};
    }
    public async getFilledTakerAmountAsync(orderHash: string): Promise<BigNumber> {
        if (_.isUndefined(this._filledTakerAmount[orderHash])) {
            const methodOpts = {
                defaultBlock: this._defaultBlock,
            };
            const filledTakerAmount = await this._exchangeWrapper.getFilledTakerAmountAsync(orderHash, methodOpts);
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
                defaultBlock: this._defaultBlock,
            };
            const cancelledTakerAmount = await this._exchangeWrapper.getCancelledTakerAmountAsync(
                orderHash,
                methodOpts,
            );
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
    public async getUnavailableTakerAmountAsync(orderHash: string) {
        return this._exchangeWrapper.getUnavailableTakerAmountAsync(orderHash);
    }
    public getZRXTokenAddress(): string {
        return this._exchangeWrapper.getZRXTokenAddress();
    }
}
