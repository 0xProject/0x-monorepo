import { LogWithDecodedArgs, TransactionReceiptWithDecodedLogs, ZeroEx } from '0x.js';
import { BlockchainLifecycle, devConstants, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import BN = require('bn.js');
import * as chai from 'chai';
import ethUtil = require('ethereumjs-util');
import * as Web3 from 'web3';

import { TestLibAssetProxyDecoderContract } from '../../src/contract_wrappers/generated/test_lib_asset_proxy_decoder';
import { artifacts } from '../../src/utils/artifacts';
import { assetProxyUtils } from '../../src/utils/asset_proxy_utils';
import { chaiSetup } from '../../src/utils/chai_setup';
import { constants } from '../../src/utils/constants';
import { AssetProxyId, ERC20ProxyData, ERC721ProxyData, ProxyData } from '../../src/utils/types';
import { provider, txDefaults, web3Wrapper } from '../../src/utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;
const blockchainLifecycle = new BlockchainLifecycle(web3Wrapper);

describe('LibAssetProxyDecoder', () => {
    let owner: string;
    let testAssetProxyDecoder: TestLibAssetProxyDecoderContract;
    let testAddress: string;

    before(async () => {
        // Setup accounts & addresses
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owner = accounts[0];
        testAddress = accounts[1];
        // Deploy TestLibMem
        testAssetProxyDecoder = await TestLibAssetProxyDecoderContract.deployFrom0xArtifactAsync(
            artifacts.TestLibAssetProxyDecoder,
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

    describe('LibAssetProxyDecoder', () => {
        it('should correctly decode ERC20 proxy data)', async () => {
            const encodedProxyData = assetProxyUtils.encodeERC20ProxyData(testAddress);
            const expectedDecodedProxyData = assetProxyUtils.decodeERC20ProxyData(encodedProxyData);
            let decodedAssetProxyId: number;
            let decodedTokenAddress: string;
            [decodedAssetProxyId, decodedTokenAddress] = await testAssetProxyDecoder.publicDecodeERC20Data.callAsync(
                encodedProxyData,
            );
            expect(decodedAssetProxyId).to.be.equal(expectedDecodedProxyData.assetProxyId);
            expect(decodedTokenAddress).to.be.equal(expectedDecodedProxyData.tokenAddress);
        });

        it('should correctly decode ERC721 proxy data', async () => {
            const tokenId = ZeroEx.generatePseudoRandomSalt();
            const encodedProxyData = assetProxyUtils.encodeERC721ProxyData(testAddress, tokenId);
            const expectedDecodedProxyData = assetProxyUtils.decodeERC721ProxyData(encodedProxyData);
            let decodedAssetProxyId: number;
            let decodedTokenAddress: string;
            let decodedTokenId: BigNumber;
            let decodedData: string;
            [
                decodedAssetProxyId,
                decodedTokenAddress,
                decodedTokenId,
                decodedData,
            ] = await testAssetProxyDecoder.publicDecodeERC721Data.callAsync(encodedProxyData);
            expect(decodedAssetProxyId).to.be.equal(expectedDecodedProxyData.assetProxyId);
            expect(decodedTokenAddress).to.be.equal(expectedDecodedProxyData.tokenAddress);
            expect(decodedTokenId).to.be.bignumber.equal(expectedDecodedProxyData.tokenId);
            expect(decodedData).to.be.equal(expectedDecodedProxyData.data);
        });

        it('should correctly decode ERC721 proxy data with receiver data', async () => {
            const tokenId = ZeroEx.generatePseudoRandomSalt();
            const data = ethUtil.bufferToHex(assetProxyUtils.encodeUint256(ZeroEx.generatePseudoRandomSalt())) + 'FFFF';
            const encodedProxyData = assetProxyUtils.encodeERC721ProxyData(testAddress, tokenId, data);
            const expectedDecodedProxyData = assetProxyUtils.decodeERC721ProxyData(encodedProxyData);
            let decodedAssetProxyId: number;
            let decodedTokenAddress: string;
            let decodedTokenId: BigNumber;
            let decodedData: string;
            [
                decodedAssetProxyId,
                decodedTokenAddress,
                decodedTokenId,
                decodedData,
            ] = await testAssetProxyDecoder.publicDecodeERC721Data.callAsync(encodedProxyData);
            expect(decodedAssetProxyId).to.be.equal(expectedDecodedProxyData.assetProxyId);
            expect(decodedTokenAddress).to.be.equal(expectedDecodedProxyData.tokenAddress);
            expect(decodedTokenId).to.be.bignumber.equal(expectedDecodedProxyData.tokenId);
            expect(decodedData).to.be.equal(expectedDecodedProxyData.data);
        });
    });
});
