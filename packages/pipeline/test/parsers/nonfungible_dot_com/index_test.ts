// tslint:disable:custom-no-magic-numbers
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { NONFUNGIBLE_DOT_COM_URL, NonfungibleDotComTrade } from '../../../src/data_sources/nonfungible_dot_com';
import { NftTrade } from '../../../src/entities';
import { _parseNonFungibleDotComTrade } from '../../../src/parsers/non_fungible_dot_com';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

const input: NonfungibleDotComTrade = {
    _id: '5b4cd04244abdb5ac3a8063f',
    assetDescriptor: 'Kitty #1002',
    assetId: '1002',
    blockNumber: 4608542,
    blockTimestamp: '2017-11-23T18:50:19.000Z',
    buyer: '0x316c55d1895a085c4b39a98ecb563f509301aaf7',
    logIndex: 28,
    nftAddress: '0xb1690C08E213a35Ed9bAb7B318DE14420FB57d8C',
    marketAddress: '0xb1690C08E213a35Ed9bAb7B318DE14420FB57d8C',
    tokenTicker: 'eth',
    meta: {
        cattribute_body: 'munchkin',
        cattribute_coloreyes: 'mintgreen',
        cattribute_colorprimary: 'orangesoda',
        cattribute_colorsecondary: 'coffee',
        cattribute_colortertiary: 'kittencream',
        cattribute_eyes: 'thicccbrowz',
        cattribute_mouth: 'soserious',
        cattribute_pattern: 'totesbasic',
        generation: '0',
        is_exclusive: false,
        is_fancy: false,
    },
    seller: '0xba52c75764d6f594735dc735be7f1830cdf58ddf',
    totalDecimalPrice: 0.00975138888888889,
    totalPrice: '9751388888888889',
    transactionHash: '0x468168419be7e442d5ff32d264fab24087b744bc2e37fdbac7024e1e74f4c6c8',
    usdPrice: 3.71957,
    currencyTransfer: {},
    image: '',
    composedOf: '',
    asset_link: '',
    seller_address_link: '',
    buyer_address_link: '',
};

const expected: NftTrade = {
    sourceUrl: NONFUNGIBLE_DOT_COM_URL,
    assetDescriptor: 'Kitty #1002',
    assetId: '1002',
    blockNumber: 4608542,
    blockTimestamp: 1511463019000,
    buyerAddress: '0x316c55d1895a085c4b39a98ecb563f509301aaf7',
    logIndex: 28,
    marketAddress: '0xb1690C08E213a35Ed9bAb7B318DE14420FB57d8C',
    meta: {
        cattribute_body: 'munchkin',
        cattribute_coloreyes: 'mintgreen',
        cattribute_colorprimary: 'orangesoda',
        cattribute_colorsecondary: 'coffee',
        cattribute_colortertiary: 'kittencream',
        cattribute_eyes: 'thicccbrowz',
        cattribute_mouth: 'soserious',
        cattribute_pattern: 'totesbasic',
        generation: '0',
        is_exclusive: false,
        is_fancy: false,
    },
    sellerAddress: '0xba52c75764d6f594735dc735be7f1830cdf58ddf',
    totalPrice: new BigNumber('9751388888888889'),
    transactionHash: '0x468168419be7e442d5ff32d264fab24087b744bc2e37fdbac7024e1e74f4c6c8',
    usdPrice: 3.71957,
};

describe('bloxy', () => {
    describe('_parseNonFungibleDotComTrade', () => {
        it(`converts BloxyTrade to DexTrade entity`, () => {
            const actual = _parseNonFungibleDotComTrade(input);
            expect(actual).deep.equal(expected);
        });
    });
});
