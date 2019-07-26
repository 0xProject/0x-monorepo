import { SignedOrder } from '@0x/types';
import { providerUtils } from '@0x/utils';
import { SupportedProvider, ZeroExProvider } from '@0x/web3-wrapper';
import {
    OrderMapper,
    OrderType,
    ZeroExV2MultiOrder as DydxMultiOrder,
    ZeroExV2Order as DydxOrder,
} from '@dydxprotocol/exchange-wrappers';
import * as _ from 'lodash';

import { constants } from '../constants';
import { SwapQuoteConsumerOpts } from '../types';
import { assert } from '../utils/assert';

// TODO(david) finish
export class ExchangeWrappersUtils {
    public readonly provider: ZeroExProvider;
    public readonly networkId: number;

    private readonly _dydxOrderMapper: OrderMapper;

    constructor(supportedProvider: SupportedProvider, options: Partial<SwapQuoteConsumerOpts> = {}) {
        const { networkId } = _.merge({}, constants.DEFAULT_SWAP_QUOTER_OPTS, options);
        assert.isNumber('networkId', networkId);

        const provider = providerUtils.standardizeOrThrow(supportedProvider);
        this._dydxOrderMapper = new OrderMapper(networkId);
        this.provider = provider;
        this.networkId = networkId;
    }

    public generateDydxExchangeWrapperOrderData(orders: SignedOrder[]): { orderData: string; to: string } {
        const order: DydxMultiOrder = {
            type: OrderType.ZeroExV2MultiOrder,
            orders: _.map(orders, (o: SignedOrder) => this._convertSignedOrderToDyDxOrder(o)),
        };
        const { bytes, exchangeWrapperAddress } = this._dydxOrderMapper.mapOrder(order);
        return {
            to: exchangeWrapperAddress,
            orderData: new Buffer(bytes).toString('hex'),
        };
    }

    // tslint:disable-next-line: prefer-function-over-method
    private _convertSignedOrderToDyDxOrder(order: SignedOrder): DydxOrder {
        return {
            type: OrderType.ZeroExV2,
            ...order,
        };
    }
}
