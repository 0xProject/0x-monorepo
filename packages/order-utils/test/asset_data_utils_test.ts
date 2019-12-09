import * as chai from 'chai';

import { AssetProxyId, ERC1155AssetData, ERC20AssetData, ERC721AssetData, MultiAssetData } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { assetDataUtils } from '../src/asset_data_utils';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

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
const KNOWN_ERC1155_ENCODING = {
    tokenAddress: '0x1dc4c1cefef38a777b15aa20260a54e584b16c48',
    tokenIds: [new BigNumber(100), new BigNumber(1001), new BigNumber(10001)],
    tokenValues: [new BigNumber(200), new BigNumber(2001), new BigNumber(20001)],
    callbackData:
        '0x025717920000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c480000000000000000000000000000000000000000000000000000000000000001',
    assetData:
        '0xa7cb5fb70000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c480000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000003e90000000000000000000000000000000000000000000000000000000000002711000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000c800000000000000000000000000000000000000000000000000000000000007d10000000000000000000000000000000000000000000000000000000000004e210000000000000000000000000000000000000000000000000000000000000044025717920000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000',
};
const KNOWN_MULTI_ASSET_ENCODING = {
    amounts: [new BigNumber(70), new BigNumber(1), new BigNumber(18)],
    nestedAssetData: [
        KNOWN_ERC20_ENCODING.assetData,
        KNOWN_ERC721_ENCODING.assetData,
        KNOWN_ERC1155_ENCODING.assetData,
    ],
    assetData:
        '0x94cfcdd7000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000000000046000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000120000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000024f47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044025717920000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c480000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000204a7cb5fb70000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c480000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001800000000000000000000000000000000000000000000000000000000000000003000000000000000000000000000000000000000000000000000000000000006400000000000000000000000000000000000000000000000000000000000003e90000000000000000000000000000000000000000000000000000000000002711000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000c800000000000000000000000000000000000000000000000000000000000007d10000000000000000000000000000000000000000000000000000000000004e210000000000000000000000000000000000000000000000000000000000000044025717920000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c4800000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
};

describe('assetDataUtils', () => {
    it('should encode ERC20', () => {
        const assetData = assetDataUtils.encodeERC20AssetData(KNOWN_ERC20_ENCODING.address);
        expect(assetData).to.equal(KNOWN_ERC20_ENCODING.assetData);
    });
    it('should decode ERC20', () => {
        const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(
            KNOWN_ERC20_ENCODING.assetData,
        ) as ERC20AssetData; // tslint:disable-line:no-unnecessary-type-assertion
        expect(decodedAssetData.tokenAddress).to.equal(KNOWN_ERC20_ENCODING.address);
        expect(decodedAssetData.assetProxyId).to.equal(AssetProxyId.ERC20);
    });
    it('should encode ERC721', () => {
        const assetData = assetDataUtils.encodeERC721AssetData(
            KNOWN_ERC721_ENCODING.address,
            KNOWN_ERC721_ENCODING.tokenId,
        );
        expect(assetData).to.equal(KNOWN_ERC721_ENCODING.assetData);
    });
    it('should decode ERC721', () => {
        const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(
            KNOWN_ERC721_ENCODING.assetData,
        ) as ERC721AssetData; // tslint:disable-line:no-unnecessary-type-assertion
        expect(decodedAssetData.tokenAddress).to.equal(KNOWN_ERC721_ENCODING.address);
        expect(decodedAssetData.assetProxyId).to.equal(AssetProxyId.ERC721);
        expect(decodedAssetData.tokenId).to.be.bignumber.equal(KNOWN_ERC721_ENCODING.tokenId);
    });
    it('should encode ERC1155', () => {
        const assetData = assetDataUtils.encodeERC1155AssetData(
            KNOWN_ERC1155_ENCODING.tokenAddress,
            KNOWN_ERC1155_ENCODING.tokenIds,
            KNOWN_ERC1155_ENCODING.tokenValues,
            KNOWN_ERC1155_ENCODING.callbackData,
        );
        expect(assetData).to.equal(KNOWN_ERC1155_ENCODING.assetData);
    });
    it('should decode ERC1155', () => {
        const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(
            KNOWN_ERC1155_ENCODING.assetData,
        ) as ERC1155AssetData; // tslint:disable-line:no-unnecessary-type-assertion
        expect(decodedAssetData.assetProxyId).to.be.equal(AssetProxyId.ERC1155);
        expect(decodedAssetData.tokenAddress).to.be.equal(KNOWN_ERC1155_ENCODING.tokenAddress);
        expect(decodedAssetData.tokenValues).to.be.deep.equal(KNOWN_ERC1155_ENCODING.tokenValues);
        expect(decodedAssetData.tokenIds).to.be.deep.equal(KNOWN_ERC1155_ENCODING.tokenIds);
        expect(decodedAssetData.callbackData).to.be.equal(KNOWN_ERC1155_ENCODING.callbackData);
    });
    it('should encode ERC20, ERC721 and ERC1155 multiAssetData', () => {
        const assetData = assetDataUtils.encodeMultiAssetData(
            KNOWN_MULTI_ASSET_ENCODING.amounts,
            KNOWN_MULTI_ASSET_ENCODING.nestedAssetData,
        );
        expect(assetData).to.equal(KNOWN_MULTI_ASSET_ENCODING.assetData);
    });
    it('should decode ERC20, ERC721 and ERC1155 multiAssetData', () => {
        const decodedAssetData = assetDataUtils.decodeAssetDataOrThrow(
            KNOWN_MULTI_ASSET_ENCODING.assetData,
        ) as MultiAssetData; // tslint:disable-line:no-unnecessary-type-assertion
        expect(decodedAssetData.assetProxyId).to.equal(AssetProxyId.MultiAsset);
        expect(decodedAssetData.amounts).to.deep.equal(KNOWN_MULTI_ASSET_ENCODING.amounts);
        expect(decodedAssetData.nestedAssetData).to.deep.equal(KNOWN_MULTI_ASSET_ENCODING.nestedAssetData);
    });
    it('should recursively decode ERC20 and ERC721 multiAssetData', () => {
        const decodedAssetData = assetDataUtils.decodeMultiAssetDataRecursively(KNOWN_MULTI_ASSET_ENCODING.assetData);
        expect(decodedAssetData.assetProxyId).to.equal(AssetProxyId.MultiAsset);
        expect(decodedAssetData.amounts).to.deep.equal(KNOWN_MULTI_ASSET_ENCODING.amounts);
        expect(decodedAssetData.nestedAssetData.length).to.equal(3);
        // tslint:disable-next-line:no-unnecessary-type-assertion
        const decodedErc20AssetData = decodedAssetData.nestedAssetData[0] as ERC20AssetData;
        expect(decodedErc20AssetData.tokenAddress).to.equal(KNOWN_ERC20_ENCODING.address);
        expect(decodedErc20AssetData.assetProxyId).to.equal(AssetProxyId.ERC20);
        // tslint:disable-next-line:no-unnecessary-type-assertion
        const decodedErc721AssetData = decodedAssetData.nestedAssetData[1] as ERC721AssetData;
        expect(decodedErc721AssetData.tokenAddress).to.equal(KNOWN_ERC721_ENCODING.address);
        expect(decodedErc721AssetData.assetProxyId).to.equal(AssetProxyId.ERC721);
        expect(decodedErc721AssetData.tokenId).to.be.bignumber.equal(KNOWN_ERC721_ENCODING.tokenId);
        // tslint:disable-next-line:no-unnecessary-type-assertion
        const decodedErc1155AssetData = decodedAssetData.nestedAssetData[2] as ERC1155AssetData;
        expect(decodedErc1155AssetData.tokenAddress).to.be.equal(KNOWN_ERC1155_ENCODING.tokenAddress);
        expect(decodedErc1155AssetData.tokenValues).to.be.deep.equal(KNOWN_ERC1155_ENCODING.tokenValues);
        expect(decodedErc1155AssetData.tokenIds).to.be.deep.equal(KNOWN_ERC1155_ENCODING.tokenIds);
        expect(decodedErc1155AssetData.callbackData).to.be.equal(KNOWN_ERC1155_ENCODING.callbackData);
    });
    it('should recursively decode nested assetData within multiAssetData', () => {
        // setup test parameters
        const erc20Amount = new BigNumber(1);
        const erc721Amount = new BigNumber(1);
        const erc1155Amount = new BigNumber(15);
        const nestedAssetsAmount = new BigNumber(2);
        const amounts = [erc20Amount, erc721Amount, erc1155Amount, nestedAssetsAmount];
        const nestedAssetData = [
            KNOWN_ERC20_ENCODING.assetData,
            KNOWN_ERC721_ENCODING.assetData,
            KNOWN_ERC1155_ENCODING.assetData,
            KNOWN_MULTI_ASSET_ENCODING.assetData,
        ];
        const assetData = assetDataUtils.encodeMultiAssetData(amounts, nestedAssetData);
        // execute test
        const decodedAssetData = assetDataUtils.decodeMultiAssetDataRecursively(assetData);
        // validate asset data
        expect(decodedAssetData.assetProxyId).to.equal(AssetProxyId.MultiAsset);
        const expectedAmounts = [
            erc20Amount,
            erc721Amount,
            erc1155Amount,
            KNOWN_MULTI_ASSET_ENCODING.amounts[0].times(nestedAssetsAmount),
            KNOWN_MULTI_ASSET_ENCODING.amounts[1].times(nestedAssetsAmount),
            KNOWN_MULTI_ASSET_ENCODING.amounts[2].times(nestedAssetsAmount),
        ];
        expect(decodedAssetData.amounts).to.deep.equal(expectedAmounts);
        const expectedNestedAssetDataLength = 6;
        expect(decodedAssetData.nestedAssetData.length).to.be.equal(expectedNestedAssetDataLength);
        // validate nested asset data (outer)
        let nestedAssetDataIndex = 0;
        // tslint:disable-next-line:no-unnecessary-type-assertion
        const decodedErc20AssetData1 = decodedAssetData.nestedAssetData[nestedAssetDataIndex++] as ERC20AssetData;
        expect(decodedErc20AssetData1.tokenAddress).to.equal(KNOWN_ERC20_ENCODING.address);
        expect(decodedErc20AssetData1.assetProxyId).to.equal(AssetProxyId.ERC20);
        // tslint:disable-next-line:no-unnecessary-type-assertion
        const decodedErc721AssetData1 = decodedAssetData.nestedAssetData[nestedAssetDataIndex++] as ERC721AssetData;
        expect(decodedErc721AssetData1.tokenAddress).to.equal(KNOWN_ERC721_ENCODING.address);
        expect(decodedErc721AssetData1.assetProxyId).to.equal(AssetProxyId.ERC721);
        // tslint:disable-next-line:no-unnecessary-type-assertion
        const decodedErc1155AssetData1 = decodedAssetData.nestedAssetData[nestedAssetDataIndex++] as ERC1155AssetData;
        expect(decodedErc1155AssetData1.tokenAddress).to.be.equal(KNOWN_ERC1155_ENCODING.tokenAddress);
        expect(decodedErc1155AssetData1.tokenValues).to.be.deep.equal(KNOWN_ERC1155_ENCODING.tokenValues);
        expect(decodedErc1155AssetData1.tokenIds).to.be.deep.equal(KNOWN_ERC1155_ENCODING.tokenIds);
        expect(decodedErc1155AssetData1.callbackData).to.be.equal(KNOWN_ERC1155_ENCODING.callbackData);
        // validate nested asset data (inner)
        // tslint:disable-next-line:no-unnecessary-type-assertion
        const decodedErc20AssetData2 = decodedAssetData.nestedAssetData[nestedAssetDataIndex++] as ERC20AssetData;
        expect(decodedErc20AssetData2.tokenAddress).to.equal(KNOWN_ERC20_ENCODING.address);
        expect(decodedErc20AssetData2.assetProxyId).to.equal(AssetProxyId.ERC20);
        // tslint:disable-next-line:no-unnecessary-type-assertion
        const decodedErc721AssetData2 = decodedAssetData.nestedAssetData[nestedAssetDataIndex++] as ERC721AssetData;
        expect(decodedErc721AssetData2.tokenAddress).to.equal(KNOWN_ERC721_ENCODING.address);
        expect(decodedErc721AssetData2.assetProxyId).to.equal(AssetProxyId.ERC721);
        // tslint:disable-next-line:no-unnecessary-type-assertion
        const decodedErc1155AssetData2 = decodedAssetData.nestedAssetData[nestedAssetDataIndex++] as ERC1155AssetData;
        expect(decodedErc1155AssetData2.tokenAddress).to.be.equal(KNOWN_ERC1155_ENCODING.tokenAddress);
        expect(decodedErc1155AssetData2.tokenValues).to.be.deep.equal(KNOWN_ERC1155_ENCODING.tokenValues);
        expect(decodedErc1155AssetData2.tokenIds).to.be.deep.equal(KNOWN_ERC1155_ENCODING.tokenIds);
        expect(decodedErc1155AssetData2.callbackData).to.be.equal(KNOWN_ERC1155_ENCODING.callbackData);
    });
});
