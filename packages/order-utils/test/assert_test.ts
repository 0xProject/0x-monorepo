import * as chai from 'chai';
import 'mocha';

import { assert } from '../src/assert';

import { chaiSetup } from './utils/chai_setup';
import { web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;

describe('Assertion library', () => {
    describe('#isSenderAddressHexAsync', () => {
        it('throws when address is invalid', async () => {
            const address = '0xdeadbeef';
            const varName = 'address';
            return expect(assert.isSenderAddressAsync(varName, address, web3Wrapper)).to.be.rejectedWith(
                `Expected ${varName} to be of type ETHAddressHex, encountered: ${address}`,
            );
        });
        it('throws when address is unavailable', async () => {
            const validUnrelatedAddress = '0x8b0292b11a196601eddce54b665cafeca0347d42';
            const varName = 'address';
            return expect(assert.isSenderAddressAsync(varName, validUnrelatedAddress, web3Wrapper)).to.be.rejectedWith(
                `Specified ${varName} ${validUnrelatedAddress} isn't available through the supplied web3 provider`,
            );
        });
        it("doesn't throw if address is available", async () => {
            const availableAddress = (await web3Wrapper.getAvailableAddressesAsync())[0];
            const varName = 'address';
            return expect(assert.isSenderAddressAsync(varName, availableAddress, web3Wrapper)).to.become(undefined);
        });
    });
});
