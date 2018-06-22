import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import * as _ from 'lodash';
import 'mocha';

import { WebSocketOrderbookChannel } from '../src/ws_orderbook_channel';

chai.config.includeStack = true;
chai.use(dirtyChai);
const expect = chai.expect;

describe('WebSocketOrderbookChannel', () => {
    const websocketUrl = 'ws://localhost:8080';
    const orderbookChannel = new WebSocketOrderbookChannel(websocketUrl);
    const subscriptionOpts = {
        baseTokenAddress: '0x323b5d4c32345ced77393b3530b1eed0f346429d',
        quoteTokenAddress: '0xef7fff64389b814a946f3e92105513705ca6b990',
        snapshot: true,
        limit: 100,
    };
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
    describe('#subscribe', () => {
        it('throws when subscriptionOpts does not conform to schema', () => {
            const badSubscribeCall = orderbookChannel.subscribe.bind(
                orderbookChannel,
                {},
                emptyOrderbookChannelHandler,
            );
            expect(badSubscribeCall).throws(
                'Expected subscriptionOpts to conform to schema /RelayerApiOrderbookChannelSubscribePayload\nEncountered: {}\nValidation errors: instance requires property "baseTokenAddress", instance requires property "quoteTokenAddress"',
            );
        });
        it('throws when handler has the incorrect members', () => {
            const badSubscribeCall = orderbookChannel.subscribe.bind(orderbookChannel, subscriptionOpts, {});
            expect(badSubscribeCall).throws(
                'Expected handler.onSnapshot to be of type function, encountered: undefined',
            );
        });
        it('does not throw when inputs are of correct types', () => {
            const goodSubscribeCall = orderbookChannel.subscribe.bind(
                orderbookChannel,
                subscriptionOpts,
                emptyOrderbookChannelHandler,
            );
            expect(goodSubscribeCall).to.not.throw();
        });
    });
});
