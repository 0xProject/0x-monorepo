import { DecodedLogEvent, SubscriptionManager } from '@0x/base-contract';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0x/dev-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import { DoneCallback } from '@0x/types';
import { providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';
import * as Sinon from 'sinon';

import {
    EventDummyContract,
    EventDummyEvents,
    EventDummyWithdrawalEventArgs,
} from '../../output/typescript/event_dummy';
import { artifacts } from '../src';

const txDefaults = {
    from: devConstants.TESTRPC_FIRST_ADDRESS,
    gas: devConstants.GAS_LIMIT,
};

const provider: Web3ProviderEngine = web3Factory.getRpcProvider({ shouldUseInProcessGanache: true });
const web3Wrapper = new Web3Wrapper(provider);

chai.config.includeStack = true;
chai.use(dirtyChai);
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('EventDummy Contract', () => {
    let eventDummy: EventDummyContract;
    const indexFilterValues = {};
    let stubs: Sinon.SinonStub[] = [];
    before(async () => {
        providerUtils.startProviderEngine(provider);
        eventDummy = await EventDummyContract.deployFrom0xArtifactAsync(artifacts.EventDummy, provider, txDefaults);
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    describe('#subscribe', () => {
        afterEach(async () => {
            await eventDummy.unsubscribeAll();
            stubs.forEach(s => s.restore());
            stubs = [];
        });
        it('Should allow unsubscribeAll to be called successfully after an error', (done: DoneCallback) => {
            (async () => {
                const callback = (err: Error | null, _logEvent?: DecodedLogEvent<EventDummyWithdrawalEventArgs>): any =>
                    eventDummy.subscribe(EventDummyEvents.Withdrawal, indexFilterValues, callback);
                stubs = [
                    Sinon.stub(eventDummy.getWeb3Wrapper(), 'getBlockIfExistsAsync').throws(
                        new Error('JSON RPC error'),
                    ),
                ];
                await eventDummy.unsubscribeAll();
                done();
            })().catch(done);
        });
    });
});
