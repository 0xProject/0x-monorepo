import { chaiSetup, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import * as chai from 'chai';

import { artifacts, TestConstantsContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('Libs', () => {
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('LibConstants', () => {
        describe('ZRX_ASSET_DATA', () => {
            it('should have the correct ZRX_ASSET_DATA', async () => {
                const testConstants = await TestConstantsContract.deployFrom0xArtifactAsync(
                    artifacts.TestConstants,
                    provider,
                    txDefaults,
                    artifacts,
                );
                const isValid = await testConstants.assertValidZrxAssetData.callAsync();
                expect(isValid).to.be.equal(true);
            });
        });
    });
});
