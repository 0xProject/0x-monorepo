import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import 'mocha';

import { ordersChannelMessageParser } from '../src/utils/orders_channel_message_parser';

import { orderResponse } from './fixtures/standard_relayer_api/order/0xabc67323774bdbd24d94f977fa9ac94a50f016026fd13f42990861238897721f';
import { unknownOrdersChannelMessage } from './fixtures/standard_relayer_api/unknown_orders_channel_message';
import {
    malformedUpdateOrdersChannelMessage,
    updateOrdersChannelMessage,
} from './fixtures/standard_relayer_api/update_orders_channel_message';

chai.config.includeStack = true;
chai.use(dirtyChai);
const expect = chai.expect;

describe('ordersChannelMessageParser', () => {
    describe('#parser', () => {
        it('parses update messages', () => {
            const updateMessage = ordersChannelMessageParser.parse(updateOrdersChannelMessage);
            expect(updateMessage.type).to.be.equal('update');
            expect(updateMessage.payload).to.be.deep.equal([orderResponse]);
        });
        it('returns unknown message for messages with unsupported types', () => {
            const unknownMessage = ordersChannelMessageParser.parse(unknownOrdersChannelMessage);
            expect(unknownMessage.type).to.be.equal('unknown');
            expect(unknownMessage.payload).to.be.undefined();
        });
        it('throws when message does not include a type', () => {
            const typelessMessage = `{
                "channel": "orders",
                "requestId": "4d8efcee-adde-4475-9601-f0b30962ca2b",
                "payload": []
            }`;
            const badCall = () => ordersChannelMessageParser.parse(typelessMessage);
            expect(badCall).throws(`Message is missing a type parameter: ${typelessMessage}`);
        });
        it('throws when type is not a string', () => {
            const messageWithBadType = `{
                "type": 1,
                "channel": "orders",
                "requestId": "4d8efcee-adde-4475-9601-f0b30962ca2b",
                "payload": []
            }`;
            const badCall = () => ordersChannelMessageParser.parse(messageWithBadType);
            expect(badCall).throws('Expected type to be of type string, encountered: 1');
        });
        it('throws when update message has malformed payload', () => {
            const badCall = () => ordersChannelMessageParser.parse(malformedUpdateOrdersChannelMessage);
            expect(badCall).throws(/^Expected message to conform to schema/);
        });
        it('throws when input message is not valid JSON', () => {
            const nonJsonString = 'h93b{sdfs9fsd f';
            const badCall = () => ordersChannelMessageParser.parse(nonJsonString);
            expect(badCall).throws('Unexpected token h in JSON at position 0');
        });
    });
});
