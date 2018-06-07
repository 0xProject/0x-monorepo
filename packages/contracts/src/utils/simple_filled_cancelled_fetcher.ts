import { AbstractOrderFilledCancelledFetcher } from '@0xproject/order-utils';
import { BigNumber } from '@0xproject/utils';
import { BlockParamLiteral } from 'ethereum-types';

import {
    CancelContractEventArgs,
    ExchangeContract,
    FillContractEventArgs,
} from '../contract_wrappers/generated/exchange';

export class SimpleOrderFilledCancelledFetcher implements AbstractOrderFilledCancelledFetcher {
    private _exchangeContract: ExchangeContract;
    private _zrxAddress: string;
    constructor(exchange: ExchangeContract, zrxAddress: string) {
        this._exchangeContract = exchange;
        this._zrxAddress = zrxAddress;
    }
    public async getFilledTakerAmountAsync(orderHash: string): Promise<BigNumber> {
        const filledTakerAmount = new BigNumber(await this._exchangeContract.filled.callAsync(orderHash));
        return filledTakerAmount;
    }
    public async isOrderCancelledAsync(orderHash: string): Promise<boolean> {
        const methodOpts = {
            defaultBlock: BlockParamLiteral.Latest,
        };
        const isCancelled = await this._exchangeContract.cancelled.callAsync(orderHash);
        return isCancelled;
    }
    public getZRXTokenAddress(): string {
        return this._zrxAddress;
    }
}
