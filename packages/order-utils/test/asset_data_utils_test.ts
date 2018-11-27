import * as chai from 'chai';

import { ERC20AssetData, ERC721AssetData } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { assetDataUtils } from '../src/asset_data_utils';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

const KNOWN_ENCODINGS = [
    {
        address: '0x1dc4c1cefef38a777b15aa20260a54e584b16c48',
        assetData: '0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48',
    },
    {
        address: '0x1dc4c1cefef38a777b15aa20260a54e584b16c48',
        tokenId: new BigNumber(1),
        assetData:
            '0x025717920000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c480000000000000000000000000000000000000000000000000000000000000001',
    },
];

const ERC20_ASSET_PROXY_ID = '0xf47261b0';
const ERC721_ASSET_PROXY_ID = '0x02571792';

describe('assetDataUtils', () => {
    it('should encode ERC20', () => {
        const assetData = assetDataUtils.encodeERC20AssetData(KNOWN_ENCODINGS[0].address);
        expect(assetData).to.equal(KNOWN_ENCODINGS[0].assetData);
    });
    it('should decode ERC20', () => {
        const assetData: ERC20AssetData = assetDataUtils.decodeERC20AssetData(KNOWN_ENCODINGS[0].assetData);
        expect(assetData.tokenAddress).to.equal(KNOWN_ENCODINGS[0].address);
        expect(assetData.assetProxyId).to.equal(ERC20_ASSET_PROXY_ID);
    });
    it('should encode ERC721', () => {
        const assetData = assetDataUtils.encodeERC721AssetData(KNOWN_ENCODINGS[1].address, KNOWN_ENCODINGS[1]
            .tokenId as BigNumber);
        expect(assetData).to.equal(KNOWN_ENCODINGS[1].assetData);
    });
    it('should decode ERC721', () => {
        const assetData: ERC721AssetData = assetDataUtils.decodeERC721AssetData(KNOWN_ENCODINGS[1].assetData);
        expect(assetData.tokenAddress).to.equal(KNOWN_ENCODINGS[1].address);
        expect(assetData.assetProxyId).to.equal(ERC721_ASSET_PROXY_ID);
        expect(assetData.tokenId).to.be.bignumber.equal(KNOWN_ENCODINGS[1].tokenId);
    });
});
