import * as chai from 'chai';
import 'mocha';

import { ZeroEx } from '../src';
import { assert } from '../src/utils/assert';

import { constants } from './utils/constants';
import { web3Factory } from './utils/web3_factory';

const expect = chai.expect;

describe('Assertion library', () => {
    const web3 = web3Factory.create();
    const config = {
        networkId: constants.TESTRPC_NETWORK_ID,
    };
    const zeroEx = new ZeroEx(web3.currentProvider, config);
    describe('#isSenderAddressHexAsync', () => {
        it('throws when address is invalid', async () => {
            const address = '0xdeadbeef';
            const varName = 'address';
            return expect(
                assert.isSenderAddressAsync(varName, address, (zeroEx as any)._web3Wrapper),
            ).to.be.rejectedWith(`Expected ${varName} to be of type ETHAddressHex, encountered: ${address}`);
        });
        it('throws when address is unavailable', async () => {
            const validUnrelatedAddress = '0x8b0292b11a196601eddce54b665cafeca0347d42';
            const varName = 'address';
            return expect(
                assert.isSenderAddressAsync(varName, validUnrelatedAddress, (zeroEx as any)._web3Wrapper),
            ).to.be.rejectedWith(
                `Specified ${varName} ${validUnrelatedAddress} isn't available through the supplied web3 provider`,
            );
        });
        it("doesn't throw if address is available", async () => {
            const availableAddress = (await zeroEx.getAvailableAddressesAsync())[0];
            const varName = 'address';
            return expect(
                assert.isSenderAddressAsync(varName, availableAddress, (zeroEx as any)._web3Wrapper),
            ).to.become(undefined);
        });
    });
});
