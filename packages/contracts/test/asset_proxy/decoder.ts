import { BlockchainLifecycle } from '@0xproject/dev-utils';
import { assetProxyUtils, generatePseudoRandomSalt } from '@0xproject/order-utils';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');

import { TestAssetDataDecodersContract } from '../../src/generated_contract_wrappers/test_asset_data_decoders';
import { artifacts } from '../../src/utils/artifacts';
import { chaiSetup } from '../../src/utils/chai_setup';
import { provider, txDefaults, web3Wrapper } from '../../src/utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('TestAssetDataDecoders', () => {
    let testAssetProxyDecoder: TestAssetDataDecodersContract;
    let testAddress: string;

    before(async () => {
        await blockchainLifecycle.startAsync();
    });
    after(async () => {
        await blockchainLifecycle.revertAsync();
    });
    before(async () => {
        // Setup accounts & addresses
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        testAddress = accounts[0];
        testAssetProxyDecoder = await TestAssetDataDecodersContract.deployFrom0xArtifactAsync(
            artifacts.TestAssetDataDecoders,
            provider,
            txDefaults,
        );
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('Asset Data Decoders', () => {
        it('should correctly decode ERC721 asset data', async () => {
            const tokenId = generatePseudoRandomSalt();
            const encodedAssetData = assetProxyUtils.encodeERC721AssetData(testAddress, tokenId);
            console.log(encodedAssetData);
            const expectedDecodedAssetData = assetProxyUtils.decodeERC721AssetData(encodedAssetData);
            let decodedTokenAddress: string;
            let decodedTokenId: BigNumber;
            let decodedData: string;
            [
                decodedTokenAddress,
                decodedTokenId,
                decodedData,
            ] = await testAssetProxyDecoder.publicDecodeERC721Data.callAsync(encodedAssetData);
            expect(decodedTokenAddress).to.be.equal( expectedDecodedAssetData.tokenAddress);
            expect(decodedTokenId).to.be.bignumber.equal(expectedDecodedAssetData.tokenId);
            expect(decodedData).to.be.equal(expectedDecodedAssetData.receiverData);
        });

        it('should correctly decode ERC721 asset data with receiver data', async () => {
            const tokenId = generatePseudoRandomSalt();
            const receiverDataFirst32Bytes = ethUtil.bufferToHex(
                assetProxyUtils.encodeUint256(generatePseudoRandomSalt()),
            );
            const receiverDataExtraBytes = 'FFFF';
            // We add extra bytes to generate a value that doesn't fit perfectly into one word
            const receiverData = receiverDataFirst32Bytes + receiverDataExtraBytes;
            const encodedAssetData = assetProxyUtils.encodeERC721AssetData(testAddress, tokenId, receiverData);
            const expectedDecodedAssetData = assetProxyUtils.decodeERC721AssetData(encodedAssetData);
            let decodedTokenAddress: string;
            let decodedTokenId: BigNumber;
            let decodedReceiverData: string;
            [
                decodedTokenAddress,
                decodedTokenId,
                decodedReceiverData,
            ] = await testAssetProxyDecoder.publicDecodeERC721Data.callAsync(encodedAssetData);
            expect(decodedTokenAddress).to.be.equal(expectedDecodedAssetData.tokenAddress);
            expect(decodedTokenId).to.be.bignumber.equal(expectedDecodedAssetData.tokenId);
            expect(decodedReceiverData).to.be.equal(expectedDecodedAssetData.receiverData);
        });
    });
});
