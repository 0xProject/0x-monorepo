// tslint:disable:no-unnecessary-type-assertion
import { AbstractOrderFilledCancelledFetcher, orderHashUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';
import { BlockParamLiteral } from 'ethereum-types';

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
    public async isOrderCancelledAsync(signedOrder: SignedOrder): Promise<boolean> {
        const orderHash = orderHashUtils.getOrderHashHex(signedOrder);
        const isCancelled = await this._exchange.isCancelledAsync(orderHash);
        const orderEpoch = await this._exchange.getOrderEpochAsync(
            signedOrder.makerAddress,
            signedOrder.senderAddress,
            {
                defaultBlock: this._stateLayer,
            },
        );
        const isCancelledByOrderEpoch = orderEpoch > signedOrder.salt;
        return isCancelled || isCancelledByOrderEpoch;
    }
    public getZRXAssetData(): string {
        const zrxAssetData = this._exchange.getZRXAssetData();
        return zrxAssetData;
    }
}
