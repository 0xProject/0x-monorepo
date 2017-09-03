import * as chai from 'chai';
import {chaiSetup} from './utils/chai_setup';
import 'mocha';
import {ZeroEx, Order, SubscriptionOpts, TokenEvents, ContractEvent} from '../src';
import {web3Factory} from './utils/web3_factory';

chaiSetup.configure();
const expect = chai.expect;

describe('ZeroEx with beta web3', () => {
    const provider = web3Factory.getRpcProvider();
    const zeroEx = new ZeroEx(provider);
    it.only('is able to make a call using a beta provider', (done: any) => {
        zeroEx.txPool.watch();
    });
});
