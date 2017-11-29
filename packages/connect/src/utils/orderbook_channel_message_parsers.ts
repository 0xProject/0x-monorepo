import {assert} from '@0xproject/assert';
import {schemas} from '@0xproject/json-schemas';
import * as _ from 'lodash';

import {
    OrderbookChannelMessage,
    OrderbookChannelMessageTypes,
    SignedOrder,
} from '../types';

import {typeConverters} from './type_converters';

export const orderbookChannelMessageParsers = {
    parser(utf8Data: string): OrderbookChannelMessage {
        const messageObj = JSON.parse(utf8Data);
        const type: string = _.get(messageObj, 'type');
        assert.assert(!_.isUndefined(type), `Message is missing a type parameter: ${utf8Data}`);
        switch (type) {
            case (OrderbookChannelMessageTypes.Snapshot): {
                assert.doesConformToSchema('message', messageObj, schemas.relayerApiOrderbookChannelSnapshotSchema);
                const orderbook = messageObj.payload;
                typeConverters.convertOrderbookStringFieldsToBigNumber(orderbook);
                return {
                    type,
                    payload: orderbook,
                };
            }
            case (OrderbookChannelMessageTypes.Update): {
                assert.doesConformToSchema('message', messageObj, schemas.relayerApiOrderbookChannelUpdateSchema);
                const order = messageObj.payload;
                typeConverters.convertOrderStringFieldsToBigNumber(order);
                return {
                    type,
                    payload: order,
                };
            }
            default: {
                return {
                    type: OrderbookChannelMessageTypes.Unknown,
                    payload: undefined,
                };
            }
        }
    },
};
