import * as chai from 'chai';
import {chaiSetup} from './utils/chai_setup';
import {web3Factory} from './utils/web3_factory';
import {ZeroEx} from '../src';
import {TokenTransferProxyWrapper} from '../src/contract_wrappers/token_transfer_proxy_wrapper';

chaiSetup.configure();
const expect = chai.expect;

describe('TokenTransferProxyWrapper', () => {
    let zeroEx: ZeroEx;
    before(async () => {
        const web3 = web3Factory.create();
        zeroEx = new ZeroEx(web3.currentProvider);
    });
    describe('#isAuthorizedAsync', () => {
        it('should return false if the address is not authorized', async () => {
            const isAuthorized = await zeroEx.proxy.isAuthorizedAsync(ZeroEx.NULL_ADDRESS);
            expect(isAuthorized).to.be.false();
        });
    });
    describe('#getAuthorizedAddressesAsync', () => {
        it('should return the list of authorized addresses', async () => {
            const authorizedAddresses = await zeroEx.proxy.getAuthorizedAddressesAsync();
            for (const authorizedAddress of authorizedAddresses) {
                const isAuthorized = await zeroEx.proxy.isAuthorizedAsync(authorizedAddress);
                expect(isAuthorized).to.be.true();
            }
        });
    });
});
