import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import * as _ from 'lodash';
import 'mocha';
import * as Sinon from 'sinon';
import * as WebSocket from 'websocket';

import { WebSocketOrderbookChannel } from '../src/ws_orderbook_channel';

chai.config.includeStack = true;
chai.use(dirtyChai);
const expect = chai.expect;
const emptyOrderbookChannelHandler = {
    onSnapshot: () => {
        _.noop();
    },
    onUpdate: () => {
        _.noop();
    },
    onError: () => {
        _.noop();
    },
    onClose: () => {
        _.noop();
    },
};

describe('WebSocketOrderbookChannel', () => {
    const websocketUrl = 'ws://localhost:8080';
    const openClient = new WebSocket.w3cwebsocket(websocketUrl);
    Sinon.stub(openClient, 'readyState').get(() => WebSocket.w3cwebsocket.OPEN);
    Sinon.stub(openClient, 'send').callsFake(_.noop.bind(_));
    const openOrderbookChannel = new WebSocketOrderbookChannel(openClient, emptyOrderbookChannelHandler);
    const subscriptionOpts = {
        baseAssetData: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
        quoteAssetData: '0xef7fff64389b814a946f3e92105513705ca6b990',
        snapshot: true,
        limit: 100,
    };
    describe('#subscribe', () => {
        it('throws when subscriptionOpts does not conform to schema', () => {
            const badSubscribeCall = openOrderbookChannel.subscribe.bind(openOrderbookChannel, {});
            expect(badSubscribeCall).throws(
                'Expected subscriptionOpts to conform to schema /RelayerApiOrderbookChannelSubscribePayload\nEncountered: {}\nValidation errors: instance requires property "baseAssetData", instance requires property "quoteAssetData"',
            );
        });
        it('does not throw when inputs are of correct types', () => {
            const goodSubscribeCall = openOrderbookChannel.subscribe.bind(openOrderbookChannel, subscriptionOpts);
            expect(goodSubscribeCall).to.not.throw();
        });
        it('throws when client is closed', () => {
            const closedClient = new WebSocket.w3cwebsocket(websocketUrl);
            Sinon.stub(closedClient, 'readyState').get(() => WebSocket.w3cwebsocket.CLOSED);
            const closedOrderbookChannel = new WebSocketOrderbookChannel(closedClient, emptyOrderbookChannelHandler);
            const badSubscribeCall = closedOrderbookChannel.subscribe.bind(closedOrderbookChannel, subscriptionOpts);
            expect(badSubscribeCall).throws('WebSocket connection is closed');
        });
    });
});
