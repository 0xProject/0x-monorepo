import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import * as _ from 'lodash';
import 'mocha';
import * as WebSocket from 'websocket';

import { orderbookChannelFactory } from '../src/orderbook_channel_factory';

chai.config.includeStack = true;
chai.use(dirtyChai);
const expect = chai.expect;

describe('orderbookChannelFactory', () => {
    const websocketUrl = 'ws://localhost:8080';

    describe('#createWebSocketOrderbookChannelAsync', () => {
        it('throws when input is not a url', () => {
            const badInput = 54;
            const badSubscribeCall = orderbookChannelFactory.createWebSocketOrderbookChannelAsync.bind(
                orderbookChannelFactory,
                badInput,
            );
            expect(orderbookChannelFactory.createWebSocketOrderbookChannelAsync(badInput as any)).to.be.rejected();
        });
    });
});
