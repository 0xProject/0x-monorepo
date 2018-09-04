// tslint:disable:no-unnecessary-type-assertion
import { AbstractOrderFilledCancelledFetcher } from '@0xproject/order-utils';
import { BigNumber } from '@0xproject/utils';
import { BlockParamLiteral } from 'ethereum-types';

import { ERC20TokenWrapper } from '../contract_wrappers/erc20_token_wrapper';
import { ExchangeWrapper } from '../contract_wrappers/exchange_wrapper';

export class OrderFilledCancelledFetcher implements AbstractOrderFilledCancelledFetcher {
    private readonly _exchange: ExchangeWrapper;
    private readonly _stateLayer: BlockParamLiteral;
    constructor(exchange: ExchangeWrapper, stateLayer: BlockParamLiteral) {
        this._exchange = exchange;
        this._stateLayer = stateLayer;
    }
    public async getFilledTakerAmountAsync(orderHash: string): Promise<BigNumber> {
        const filledTakerAmount = this._exchange.getFilledTakerAssetAmountAsync(orderHash, {
            defaultBlock: this._stateLayer,
        });
        return filledTakerAmount;
    }
    public async isOrderCancelledAsync(orderHash: string): Promise<boolean> {
        const isCancelled = await this._exchange.isCancelledAsync(orderHash);
        return isCancelled;
    }
    public getZRXAssetData(): string {
        const zrxAssetData = this._exchange.getZRXAssetData();
        return zrxAssetData;
    }
}
