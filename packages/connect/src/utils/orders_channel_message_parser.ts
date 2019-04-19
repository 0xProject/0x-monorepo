import { assert } from '@0x/assert';
import { schemas } from '@0x/json-schemas';
import * as _ from 'lodash';

import { OrdersChannelMessage, OrdersChannelMessageTypes } from '@0x/types';

import { relayerResponseJsonParsers } from './relayer_response_json_parsers';

export const ordersChannelMessageParser = {
    parse(utf8Data: string): OrdersChannelMessage {
        // parse the message
        const messageObj = JSON.parse(utf8Data);
        // ensure we have a type parameter to switch on
        const type: string = _.get(messageObj, 'type');
        assert.assert(type !== undefined, `Message is missing a type parameter: ${utf8Data}`);
        assert.isString('type', type);
        // ensure we have a request id for the resulting message
        const requestId: string = _.get(messageObj, 'requestId');
        assert.assert(requestId !== undefined, `Message is missing a requestId parameter: ${utf8Data}`);
        assert.isString('requestId', requestId);
        switch (type) {
            case OrdersChannelMessageTypes.Update: {
                assert.doesConformToSchema('message', messageObj, schemas.relayerApiOrdersChannelUpdateSchema);
                const ordersJson = messageObj.payload;
                const orders = relayerResponseJsonParsers.parseAPIOrdersJson(ordersJson);
                return _.assign(messageObj, { payload: orders });
            }
            default: {
                return {
                    type: OrdersChannelMessageTypes.Unknown,
                    requestId,
                    payload: undefined,
                };
            }
        }
    },
};
