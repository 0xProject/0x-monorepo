import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import * as _ from 'lodash';
import 'mocha';
import * as Sinon from 'sinon';
import * as WebSocket from 'websocket';

import { WebSocketOrdersChannel } from '../src/ws_orders_channel';

chai.config.includeStack = true;
chai.use(dirtyChai);
const expect = chai.expect;
const emptyOrdersChannelHandler = {
    onUpdate: _.noop.bind(_),
    onError: _.noop.bind(_),
    onClose: _.noop.bind(_),
};

describe('WebSocketOrdersChannel', () => {
    const websocketUrl = 'ws://localhost:8080';
    const openClient = new WebSocket.w3cwebsocket(websocketUrl);
    Sinon.stub(openClient, 'readyState').get(() => WebSocket.w3cwebsocket.OPEN);
    Sinon.stub(openClient, 'send').callsFake(_.noop.bind(_));
    const openOrdersChannel = new WebSocketOrdersChannel(openClient, emptyOrdersChannelHandler);
    const subscriptionOpts = {
        makerAssetProxyId: '0xf47261b0',
        takerAssetAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
        limit: 100,
    };
    describe('#subscribe', () => {
        it('throws when subscriptionOpts does not conform to schema', () => {
            const badSubscribeCall = openOrdersChannel.subscribe.bind(openOrdersChannel, {
                makerAssetData: 5,
            });
            expect(badSubscribeCall).throws();
        });
        it('does not throw when inputs are of correct types', () => {
            const goodSubscribeCall = openOrdersChannel.subscribe.bind(openOrdersChannel, subscriptionOpts);
            expect(goodSubscribeCall).to.not.throw();
        });
        it('throws when client is closed', () => {
            const closedClient = new WebSocket.w3cwebsocket(websocketUrl);
            Sinon.stub(closedClient, 'readyState').get(() => WebSocket.w3cwebsocket.CLOSED);
            const closedOrdersChannel = new WebSocketOrdersChannel(closedClient, emptyOrdersChannelHandler);
            const badSubscribeCall = closedOrdersChannel.subscribe.bind(closedOrdersChannel, subscriptionOpts);
            expect(badSubscribeCall).throws('WebSocket connection is closed');
        });
    });
});
