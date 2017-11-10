import * as _ from 'lodash';
import * as Web3 from 'web3';
import {BigNumber} from 'bignumber.js';
import {ExchangeWrapper} from '../contract_wrappers/exchange_wrapper';

/**
 * Copy on read store for filled/cancelled taker  amounts
 */
export class OrderFilledCancelledLazyStore {
    private exchange: ExchangeWrapper;
    private defaultBlock: Web3.BlockParam;
    private filledTakerAmount: {
        [orderHash: string]: BigNumber,
    };
    private cancelledTakerAmount: {
        [orderHash: string]: BigNumber,
    };
    constructor(exchange: ExchangeWrapper, defaultBlock: Web3.BlockParam) {
        this.exchange = exchange;
        this.defaultBlock = defaultBlock;
        this.filledTakerAmount = {};
        this.cancelledTakerAmount = {};
    }
    public async getFilledTakerAmountAsync(orderHash: string): Promise<BigNumber> {
        if (_.isUndefined(this.filledTakerAmount[orderHash])) {
            const methodOpts = {
                defaultBlock: this.defaultBlock,
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
    public async getCancelledTakerAmountAsync(orderHash: string): Promise<BigNumber> {
        if (_.isUndefined(this.cancelledTakerAmount[orderHash])) {
            const methodOpts = {
                defaultBlock: this.defaultBlock,
            };
            const cancelledTakerAmount = await this.exchange.getCanceledTakerAmountAsync(orderHash, methodOpts);
            this.setCancelledTakerAmount(orderHash, cancelledTakerAmount);
        }
        const cachedCancelled = this.cancelledTakerAmount[orderHash];
        return cachedCancelled;
    }
    public setCancelledTakerAmount(orderHash: string, cancelledTakerAmount: BigNumber): void {
        this.cancelledTakerAmount[orderHash] = cancelledTakerAmount;
    }
}
