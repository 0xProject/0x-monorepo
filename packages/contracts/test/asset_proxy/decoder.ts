import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { assetProxyUtils, generatePseudoRandomSalt } from '@0xproject/order-utils';
import { AssetData, AssetProxyId, ERC20AssetData, ERC721AssetData } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import BN = require('bn.js');
import * as chai from 'chai';
import { LogWithDecodedArgs, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import ethUtil = require('ethereumjs-util');
import * as Web3 from 'web3';

import { TestAssetDataDecodersContract } from '../../src/contract_wrappers/generated/test_asset_data_decoders';
import { artifacts } from '../../src/utils/artifacts';
import { chaiSetup } from '../../src/utils/chai_setup';
import { constants } from '../../src/utils/constants';
import { provider, txDefaults, web3Wrapper } from '../../src/utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('TestAssetDataDecoders', () => {
    let owner: string;
    let testAssetProxyDecoder: TestAssetDataDecodersContract;
    let testAddress: string;

    before(async () => {
        // Setup accounts & addresses
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        testAddress = accounts[1];
        // Deploy TestLibMem
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
        it('should correctly decode ERC20 asset data)', async () => {
            const encodedAssetData = assetProxyUtils.encodeERC20AssetData(testAddress);
            const expectedDecodedAssetData = assetProxyUtils.decodeERC20AssetData(encodedAssetData);
            let decodedAssetProxyId: number;
            let decodedTokenAddress: string;
            [decodedAssetProxyId, decodedTokenAddress] = await testAssetProxyDecoder.publicDecodeERC20Data.callAsync(
                encodedAssetData,
            );
            expect(decodedAssetProxyId).to.be.equal(expectedDecodedAssetData.assetProxyId);
            expect(decodedTokenAddress).to.be.equal(expectedDecodedAssetData.tokenAddress);
        });

        it('should correctly decode ERC721 asset data', async () => {
            const tokenId = generatePseudoRandomSalt();
            const encodedAssetData = assetProxyUtils.encodeERC721AssetData(testAddress, tokenId);
            const expectedDecodedAssetData = assetProxyUtils.decodeERC721AssetData(encodedAssetData);
            let decodedAssetProxyId: number;
            let decodedTokenAddress: string;
            let decodedTokenId: BigNumber;
            let decodedData: string;
            [
                decodedAssetProxyId,
                decodedTokenAddress,
                decodedTokenId,
                decodedData,
            ] = await testAssetProxyDecoder.publicDecodeERC721Data.callAsync(encodedAssetData);
            expect(decodedAssetProxyId).to.be.equal(expectedDecodedAssetData.assetProxyId);
            expect(decodedTokenAddress).to.be.equal(expectedDecodedAssetData.tokenAddress);
            expect(decodedTokenId).to.be.bignumber.equal(expectedDecodedAssetData.tokenId);
            expect(decodedData).to.be.equal(expectedDecodedAssetData.receiverData);
        });

        it('should correctly decode ERC721 asset data with receiver data', async () => {
            const tokenId = generatePseudoRandomSalt();
            const receiverData =
                ethUtil.bufferToHex(assetProxyUtils.encodeUint256(generatePseudoRandomSalt())) + 'FFFF';
            const encodedAssetData = assetProxyUtils.encodeERC721AssetData(testAddress, tokenId, receiverData);
            const expectedDecodedAssetData = assetProxyUtils.decodeERC721AssetData(encodedAssetData);
            let decodedAssetProxyId: number;
            let decodedTokenAddress: string;
            let decodedTokenId: BigNumber;
            let decodedReceiverData: string;
            [
                decodedAssetProxyId,
                decodedTokenAddress,
                decodedTokenId,
                decodedReceiverData,
            ] = await testAssetProxyDecoder.publicDecodeERC721Data.callAsync(encodedAssetData);
            expect(decodedAssetProxyId).to.be.equal(expectedDecodedAssetData.assetProxyId);
            expect(decodedTokenAddress).to.be.equal(expectedDecodedAssetData.tokenAddress);
            expect(decodedTokenId).to.be.bignumber.equal(expectedDecodedAssetData.tokenId);
            expect(decodedReceiverData).to.be.equal(expectedDecodedAssetData.receiverData);
        });
    });
});
