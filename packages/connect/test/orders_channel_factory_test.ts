import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import * as _ from 'lodash';

import 'mocha';

import { ordersChannelFactory } from '../src/orders_channel_factory';

chai.config.includeStack = true;
chai.use(dirtyChai);
const expect = chai.expect;
const emptyOrdersChannelHandler = {
    onUpdate: _.noop.bind(_),
    onError: _.noop.bind(_),
    onClose: _.noop.bind(_),
};

describe('ordersChannelFactory', () => {
    const websocketUrl = 'ws://localhost:8080';
    describe('#createWebSocketOrdersChannelAsync', () => {
        it('throws when input is not a url', () => {
            const badUrlInput = 54;
            expect(
                ordersChannelFactory.createWebSocketOrdersChannelAsync(badUrlInput as any, emptyOrdersChannelHandler),
            ).to.be.rejected();
        });
        it('throws when handler has the incorrect members', () => {
            const badHandlerInput = {};
            expect(
                ordersChannelFactory.createWebSocketOrdersChannelAsync(websocketUrl, badHandlerInput as any),
            ).to.be.rejected();
        });
    });
});
