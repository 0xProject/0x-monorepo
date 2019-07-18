import { SubscriptionManager } from '@0x/base-contract';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0x/dev-utils';
import { Web3ProviderEngine } from '@0x/subproviders';
import { providerUtils } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import * as dirtyChai from 'dirty-chai';

import { EventDummyContract } from '../../output/typescript/event_dummy';
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

describe.only('EventDummy Contract', () => {
    let eventDummy: EventDummyContract;
    before(async () => {
        providerUtils.startProviderEngine(provider);
        eventDummy = await EventDummyContract.deployFrom0xArtifactAsync(artifacts.EventDummy, provider, txDefaults);
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    it('should have SubscriptionManager', async () => {
        const subscriptionManager = await eventDummy.getSubscriptionManagerAsync();
        expect(subscriptionManager).be.instanceOf(SubscriptionManager);
    });
});
