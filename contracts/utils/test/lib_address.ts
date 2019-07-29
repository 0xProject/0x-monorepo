import { chaiSetup, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import * as chai from 'chai';

import { artifacts, TestLibAddressContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('LibAddress', () => {
    let lib: TestLibAddressContract;
    let nonContract: string;

    before(async () => {
        await blockchainLifecycle.startAsync();
        nonContract = (await web3Wrapper.getAvailableAddressesAsync())[0];
        // Deploy LibAddress
        lib = await TestLibAddressContract.deployFrom0xArtifactAsync(
            artifacts.TestLibAddress,
            provider,
            txDefaults,
        );
    });

    after(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('isContract', () => {
        it('should return false for a non-contract address', async () => {
            const isContract = await lib.externalIsContract.callAsync(nonContract);
            expect(isContract).to.be.false();
        });

        it('should return true for a non-contract address', async () => {
            const isContract = await lib.externalIsContract.callAsync(lib.address);
            expect(isContract).to.be.true();
        });
    });
});
