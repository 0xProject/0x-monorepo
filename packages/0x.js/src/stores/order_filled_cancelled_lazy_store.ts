import {BigNumber} from 'bignumber.js';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import {ExchangeWrapper} from '../contract_wrappers/exchange_wrapper';
import {BlockParamLiteral} from '../types';

/**
 * Copy on read store for filled/cancelled taker amounts
 */
export class OrderFilledCancelledLazyStore {
    private exchange: ExchangeWrapper;
    private filledTakerAmount: {
        [orderHash: string]: BigNumber,
    };
    private cancelledTakerAmount: {
        [orderHash: string]: BigNumber,
    };
    constructor(exchange: ExchangeWrapper) {
        this.exchange = exchange;
        this.filledTakerAmount = {};
        this.cancelledTakerAmount = {};
    }
    public async getFilledTakerAmountAsync(orderHash: string): Promise<BigNumber> {
        if (_.isUndefined(this.filledTakerAmount[orderHash])) {
            const methodOpts = {
                defaultBlock: BlockParamLiteral.Pending,
            };
            const filledTakerAmount = await this.exchange.getFilledTakerAmountAsync(orderHash, methodOpts);
            this.setFilledTakerAmount(orderHash, filledTakerAmount);
        }
        const cachedFilled = this.filledTakerAmount[orderHash];
        return cachedFilled;
    }
    public setFilledTakerAmount(orderHash: string, filledTakerAmount: BigNumber): void {
        this.filledTakerAmount[orderHash] = filledTakerAmount;
    }
    public deleteFilledTakerAmount(orderHash: string): void {
        delete this.filledTakerAmount[orderHash];
    }
    public async getCancelledTakerAmountAsync(orderHash: string): Promise<BigNumber> {
        if (_.isUndefined(this.cancelledTakerAmount[orderHash])) {
            const methodOpts = {
                defaultBlock: BlockParamLiteral.Pending,
            };
            const cancelledTakerAmount = await this.exchange.getCancelledTakerAmountAsync(orderHash, methodOpts);
            this.setCancelledTakerAmount(orderHash, cancelledTakerAmount);
        }
        const cachedCancelled = this.cancelledTakerAmount[orderHash];
        return cachedCancelled;
    }
    public setCancelledTakerAmount(orderHash: string, cancelledTakerAmount: BigNumber): void {
        this.cancelledTakerAmount[orderHash] = cancelledTakerAmount;
    }
    public deleteCancelledTakerAmount(orderHash: string): void {
        delete this.cancelledTakerAmount[orderHash];
    }
    public deleteAll(): void {
        this.filledTakerAmount = {};
        this.cancelledTakerAmount = {};
    }
}
