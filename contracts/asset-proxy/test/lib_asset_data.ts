import * as chai from 'chai';

import { chaiSetup, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';

import { artifacts, LibAssetDataContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('LibAssetData', () => {
    let libAssetData: LibAssetDataContract;

    before(async () => {
        await blockchainLifecycle.startAsync();
        libAssetData = await LibAssetDataContract.deployFrom0xArtifactAsync(
            artifacts.LibAssetData,
            provider,
            txDefaults,
        );
    });

    after(async () => {
        await blockchainLifecycle.revertAsync();
    });

    it('should have a deployed-to address', () => {
        expect(libAssetData.address.slice(0, 2)).to.equal('0x');
    });
});
