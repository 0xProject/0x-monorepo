import 'mocha';
import * as chai from 'chai';
import * as _ from 'lodash';
import * as Sinon from 'sinon';
import * as Web3 from 'web3';
import BigNumber from 'bignumber.js';
import {chaiSetup} from './utils/chai_setup';
import {web3Factory} from './utils/web3_factory';
import {Web3Wrapper} from '../src/web3_wrapper';
import {OrderStateWatcher} from '../src/mempool/order_state_watcher';
import {
    ZeroEx,
    LogEvent,
    DecodedLogEvent,
} from '../src';
import {DoneCallback} from '../src/types';

chaiSetup.configure();
const expect = chai.expect;

describe('EventWatcher', () => {
    let web3: Web3;
    let stubs: Sinon.SinonStub[] = [];
    let orderStateWatcher: OrderStateWatcher;
    before(async () => {
        web3 = web3Factory.create();
        const mempoolPollingIntervalMs = 10;
        const orderStateWatcherConfig = {
            mempoolPollingIntervalMs,
        };
        orderStateWatcher = new OrderStateWatcher(web3.currentProvider, orderStateWatcherConfig);
    });
    afterEach(() => {
        // clean up any stubs after the test has completed
        _.each(stubs, s => s.restore());
        stubs = [];
        orderStateWatcher.unsubscribe();
    });
    it.skip('TODO', () => {
        // TODO
    });
});
