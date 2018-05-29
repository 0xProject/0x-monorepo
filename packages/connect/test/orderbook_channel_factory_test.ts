import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import * as _ from 'lodash';
import 'mocha';
import * as WebSocket from 'websocket';

import { orderbookChannelFactory } from '../src/orderbook_channel_factory';

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

describe('orderbookChannelFactory', () => {
    const websocketUrl = 'ws://localhost:8080';
    describe('#createWebSocketOrderbookChannelAsync', () => {
        it('throws when input is not a url', () => {
            const badUrlInput = 54;
            expect(
                orderbookChannelFactory.createWebSocketOrderbookChannelAsync(
                    badUrlInput as any,
                    emptyOrderbookChannelHandler,
                ),
            ).to.be.rejected();
        });
        it('throws when handler has the incorrect members', () => {
            const badHandlerInput = {};
            expect(
                orderbookChannelFactory.createWebSocketOrderbookChannelAsync(websocketUrl, badHandlerInput as any),
            ).to.be.rejected();
        });
    });
});
