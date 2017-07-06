import * as chai from 'chai';
import {web3Factory} from './utils/web3_factory';
import {ZeroEx} from '../src/';
import {Web3Wrapper} from '../src/web3_wrapper';
import {constants} from './utils/constants';

chai.config.includeStack = true;
const expect = chai.expect;

describe('Web3Wrapper', () => {
    const web3Provider = web3Factory.create().currentProvider;
    describe('#getNetworkIdIfExistsAsync', () => {
        it('caches network id requests', async () => {
            const web3Wrapper = (new ZeroEx(web3Provider) as any)._web3Wrapper as Web3Wrapper;
            expect((web3Wrapper as any).networkIdIfExists).to.be.undefined();
            const networkIdIfExists = await web3Wrapper.getNetworkIdIfExistsAsync();
            expect((web3Wrapper as any).networkIdIfExists).to.be.equal(constants.TESTRPC_NETWORK_ID);
        });
        it('invalidates network id cache on setProvider call', async () => {
            const web3Wrapper = (new ZeroEx(web3Provider) as any)._web3Wrapper as Web3Wrapper;
            expect((web3Wrapper as any).networkIdIfExists).to.be.undefined();
            const networkIdIfExists = await web3Wrapper.getNetworkIdIfExistsAsync();
            expect((web3Wrapper as any).networkIdIfExists).to.be.equal(constants.TESTRPC_NETWORK_ID);
            const newProvider = web3Factory.create().currentProvider;
            web3Wrapper.setProvider(newProvider);
            expect((web3Wrapper as any).networkIdIfExists).to.be.undefined();
        });
    });
});
