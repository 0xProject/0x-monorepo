import { assert } from '@0xproject/assert';
import { schemas } from '@0xproject/json-schemas';
import * as _ from 'lodash';

import { OrderbookChannelMessage, OrderbookChannelMessageTypes } from '../types';

import { relayerResponseJsonParsers } from './relayer_response_json_parsers';

export const orderbookChannelMessageParser = {
    parse(utf8Data: string): OrderbookChannelMessage {
        // parse the message
        const messageObj = JSON.parse(utf8Data);
        // ensure we have a type parameter to switch on
        const type: string = _.get(messageObj, 'type');
        assert.assert(!_.isUndefined(type), `Message is missing a type parameter: ${utf8Data}`);
        assert.isString('type', type);
        // ensure we have a request id for the resulting message
        const requestId: number = _.get(messageObj, 'requestId');
        assert.assert(!_.isUndefined(requestId), `Message is missing a requestId parameter: ${utf8Data}`);
        assert.isNumber('requestId', requestId);
        switch (type) {
            case OrderbookChannelMessageTypes.Snapshot: {
                assert.doesConformToSchema('message', messageObj, schemas.relayerApiOrderbookChannelSnapshotSchema);
                const orderbookJson = messageObj.payload;
                const orderbook = relayerResponseJsonParsers.parseOrderbookResponseJson(orderbookJson);
                return _.assign(messageObj, { payload: orderbook });
            }
            case OrderbookChannelMessageTypes.Update: {
                assert.doesConformToSchema('message', messageObj, schemas.relayerApiOrderbookChannelUpdateSchema);
                const orderJson = messageObj.payload;
                const order = relayerResponseJsonParsers.parseOrderJson(orderJson);
                return _.assign(messageObj, { payload: order });
            }
            default: {
                return {
                    type: OrderbookChannelMessageTypes.Unknown,
                    requestId,
                    payload: undefined,
                };
            }
        }
    },
};
