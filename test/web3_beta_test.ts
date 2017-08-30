import * as chai from 'chai';
import {chaiSetup} from './utils/chai_setup';
import 'mocha';
import {ZeroEx, Order, SubscriptionOpts, TokenEvents, ContractEvent} from '../src';
import {web3Factory} from './utils/web3_factory';

chaiSetup.configure();
const expect = chai.expect;

describe('ZeroEx with beta web3', () => {
    const web3_beta_provider = web3Factory.getProviderBeta();
    const zeroEx = new ZeroEx(web3_beta_provider);
    it('is able to make a call using a beta provider', async () => {
        await zeroEx.tokenRegistry.getTokenAddressesAsync();
    });
});
