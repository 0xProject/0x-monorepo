import { web3Factory } from '@0xproject/dev-utils';
import * as chai from 'chai';

import { ZeroEx } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { constants } from './utils/constants';

chaiSetup.configure();
const expect = chai.expect;
const web3 = web3Factory.create();

describe('TokenTransferProxyWrapper', () => {
    let zeroEx: ZeroEx;
    const config = {
        networkId: constants.TESTRPC_NETWORK_ID,
    };
    before(async () => {
        zeroEx = new ZeroEx(web3.currentProvider, config);
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
