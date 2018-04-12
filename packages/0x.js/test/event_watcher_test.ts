import { web3Factory } from '@0xproject/dev-utils';
import { LogEntry } from '@0xproject/types';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';
import * as _ from 'lodash';
import 'mocha';
import * as Sinon from 'sinon';

import { LogEvent } from '../src';
import { EventWatcher } from '../src/order_watcher/event_watcher';
import { DoneCallback } from '../src/types';

import { chaiSetup } from './utils/chai_setup';
import { reportNodeCallbackErrors } from './utils/report_callback_errors';
import { provider } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;

describe('EventWatcher', () => {
    let stubs: Sinon.SinonStub[] = [];
    let eventWatcher: EventWatcher;
    let web3Wrapper: Web3Wrapper;
    const logA: LogEntry = {
        address: '0x71d271f8b14adef568f8f28f1587ce7271ac4ca5',
        blockHash: null,
        blockNumber: null,
        data: '',
        logIndex: null,
        topics: [],
        transactionHash: '0x004881d38cd4a8f72f1a0d68c8b9b8124504706041ff37019c1d1ed6bfda8e17',
        transactionIndex: 0,
    };
    const logB: LogEntry = {
        address: '0x8d12a197cb00d4747a1fe03395095ce2a5cc6819',
        blockHash: null,
        blockNumber: null,
        data: '',
        logIndex: null,
        topics: ['0xf341246adaac6f497bc2a656f546ab9e182111d630394f0c57c710a59a2cb567'],
        transactionHash: '0x01ef3c048b18d9b09ea195b4ed94cf8dd5f3d857a1905ff886b152cfb1166f25',
        transactionIndex: 0,
    };
    const logC: LogEntry = {
        address: '0x1d271f8b174adef58f1587ce68f8f27271ac4ca5',
        blockHash: null,
        blockNumber: null,
        data: '',
        logIndex: null,
        topics: ['0xf341246adaac6f497bc2a656f546ab9e182111d630394f0c57c710a59a2cb567'],
        transactionHash: '0x01ef3c048b18d9b09ea195b4ed94cf8dd5f3d857a1905ff886b152cfb1166f25',
        transactionIndex: 0,
    };
    before(async () => {
        const pollingIntervalMs = 10;
        web3Wrapper = new Web3Wrapper(provider);
        eventWatcher = new EventWatcher(web3Wrapper, pollingIntervalMs);
    });
    afterEach(() => {
        // clean up any stubs after the test has completed
        _.each(stubs, s => s.restore());
        stubs = [];
        eventWatcher.unsubscribe();
    });
    it('correctly emits initial log events', (done: DoneCallback) => {
        const logs: LogEntry[] = [logA, logB];
        const expectedLogEvents = [
            {
                removed: false,
                ...logA,
            },
            {
                removed: false,
                ...logB,
            },
        ];
        const getLogsStub = Sinon.stub(web3Wrapper, 'getLogsAsync');
        getLogsStub.onCall(0).returns(logs);
        stubs.push(getLogsStub);
        const expectedToBeCalledOnce = false;
        const callback = reportNodeCallbackErrors(done, expectedToBeCalledOnce)((event: LogEvent) => {
            const expectedLogEvent = expectedLogEvents.shift();
            expect(event).to.be.deep.equal(expectedLogEvent);
            if (_.isEmpty(expectedLogEvents)) {
                done();
            }
        });
        eventWatcher.subscribe(callback);
    });
    it('correctly computes the difference and emits only changes', (done: DoneCallback) => {
        const initialLogs: LogEntry[] = [logA, logB];
        const changedLogs: LogEntry[] = [logA, logC];
        const expectedLogEvents = [
            {
                removed: false,
                ...logA,
            },
            {
                removed: false,
                ...logB,
            },
            {
                removed: true,
                ...logB,
            },
            {
                removed: false,
                ...logC,
            },
        ];
        const getLogsStub = Sinon.stub(web3Wrapper, 'getLogsAsync');
        getLogsStub.onCall(0).returns(initialLogs);
        getLogsStub.onCall(1).returns(changedLogs);
        stubs.push(getLogsStub);
        const expectedToBeCalledOnce = false;
        const callback = reportNodeCallbackErrors(done, expectedToBeCalledOnce)((event: LogEvent) => {
            const expectedLogEvent = expectedLogEvents.shift();
            expect(event).to.be.deep.equal(expectedLogEvent);
            if (_.isEmpty(expectedLogEvents)) {
                done();
            }
        });
        eventWatcher.subscribe(callback);
    });
});
