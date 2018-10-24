import * as chai from 'chai';

import { ERC20AssetData } from '@0x/types';

import { assetDataUtils } from '../src/asset_data_utils';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

const KNOWN_ENCODINGS = [
    {
        address: '0x1dc4c1cefef38a777b15aa20260a54e584b16c48',
        assetData: '0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48',
    },
];

const ERC20_ASSET_PROXY_ID = '0xf47261b0';

describe('assetDataUtils', () => {
    it('should encode', () => {
        const assetData = assetDataUtils.encodeERC20AssetData(KNOWN_ENCODINGS[0].address);
        expect(assetData).to.equal(KNOWN_ENCODINGS[0].assetData);
    });
    it('should decode', () => {
        const assetData: ERC20AssetData = assetDataUtils.decodeERC20AssetData(KNOWN_ENCODINGS[0].assetData);
        expect(assetData.tokenAddress).to.equal(KNOWN_ENCODINGS[0].address);
        expect(assetData.assetProxyId).to.equal(ERC20_ASSET_PROXY_ID);
    });
});
