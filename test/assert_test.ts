import * as chai from 'chai';
import 'mocha';
import {ZeroEx} from '../src/0x.js';
import {assert} from '../src/utils/assert';
import {web3Factory} from './utils/web3_factory';

const expect = chai.expect;

describe('Assertion library', () => {
    const web3 = web3Factory.create();
    const zeroEx = new ZeroEx(web3);
    describe('#isSenderAccountHexAsync', () => {
        it('throws when address is invalid', async () => {
            const address = '0xdeadbeef';
            const varName = 'account';
            return expect(assert.isSenderAddressHexAsync(varName, address, (zeroEx as any).web3Wrapper))
                .to.be.rejectedWith(`Expected ${varName} to be of type ETHAddressHex, encountered: ${address}`);
        });
        it('throws when address is unavailable', async () => {
            const validUnrelatedAddress = '0x8b0292b11a196601eddce54b665cafeca0347d42';
            const varName = 'account';
            return expect(assert.isSenderAddressHexAsync(varName, validUnrelatedAddress, (zeroEx as any).web3Wrapper))
                .to.be.rejectedWith(`Specified ${varName} ${validUnrelatedAddress} \
                isn't available through the supplied web3 instance`);
        });
        it('doesn\'t throw if account is available', async () => {
            const availableAccount = (await zeroEx.getAvailableAddressesAsync())[0];
            const varName = 'account';
            return expect(assert.isSenderAddressHexAsync(varName, availableAccount, (zeroEx as any).web3Wrapper))
                .to.become(undefined);
        });
    });
});
