import * as chai from 'chai';

import { chaiSetup, provider, txDefaults, web3Wrapper } from '@0x/contracts-test-utils';
import { BlockchainLifecycle } from '@0x/dev-utils';
import { AssetProxyId } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { artifacts, LibAssetDataContract } from '../src';

chaiSetup.configure();
const expect = chai.expect;

const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

const KNOWN_ERC20_ENCODING = {
    address: '0x1dc4c1cefef38a777b15aa20260a54e584b16c48',
    assetData: '0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48',
};
const KNOWN_ERC721_ENCODING = {
    address: '0x1dc4c1cefef38a777b15aa20260a54e584b16c48',
    tokenId: new BigNumber(1),
    assetData:
        '0x025717920000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c480000000000000000000000000000000000000000000000000000000000000001',
};

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

    it('should encode ERC20 asset data', async () => {
        expect(await libAssetData.encodeERC20AssetData.callAsync(KNOWN_ERC20_ENCODING.address)).to.equal(
            KNOWN_ERC20_ENCODING.assetData,
        );
    });

    it('should decode ERC20 asset data', async () => {
        expect(await libAssetData.decodeERC20AssetData.callAsync(KNOWN_ERC20_ENCODING.assetData)).to.deep.equal([
            AssetProxyId.ERC20,
            KNOWN_ERC20_ENCODING.address,
        ]);
    });

    it('should encode ERC721 asset data', async () => {
        expect(
            await libAssetData.encodeERC721AssetData.callAsync(
                KNOWN_ERC721_ENCODING.address,
                KNOWN_ERC721_ENCODING.tokenId,
            ),
        ).to.equal(KNOWN_ERC721_ENCODING.assetData);
    });

    it('should decode ERC721 asset data', async () => {
        expect(await libAssetData.decodeERC721AssetData.callAsync(KNOWN_ERC721_ENCODING.assetData)).to.deep.equal([
            AssetProxyId.ERC721,
            KNOWN_ERC721_ENCODING.address,
            KNOWN_ERC721_ENCODING.tokenId,
        ]);
    });
});
