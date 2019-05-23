// tslint:disable:custom-no-magic-numbers
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';
import * as R from 'ramda';

import { BLOXY_DEX_TRADES_URL, BloxyTrade } from '../../../src/data_sources/bloxy';
import { DexTrade } from '../../../src/entities';
import { _parseBloxyTrade } from '../../../src/parsers/bloxy';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

const baseInput: BloxyTrade = {
    tx_hash: '0xb93a7faf92efbbb5405c9a73cd4efd99702fe27c03ff22baee1f1b1e37b3a0bf',
    tx_time: '2018-11-21T09:06:28.000+00:00',
    tx_date: '2018-11-21',
    tx_sender: '0x00923b9a074762b93650716333b3e1473a15048e',
    tradeIndex: '1',
    smart_contract_id: 7091917,
    smart_contract_address: '0x818e6fecd516ecc3849daf6845e3ec868087b755',
    contract_type: 'DEX/Kyber Network Proxy',
    maker: '0x0000000000000000000000000000000000000001',
    taker: '0x0000000000000000000000000000000000000002',
    amountBuy: 1.011943163078103,
    makerFee: 38.912083,
    buyCurrencyId: 1,
    buySymbol: 'ETH',
    amountSell: 941.4997928436911,
    takerFee: 100.39,
    sellCurrencyId: 16610,
    sellSymbol: 'ELF',
    maker_annotation: 'random annotation',
    taker_annotation: 'random other annotation',
    protocol: 'Kyber Network Proxy',
    buyAddress: '0xbf2179859fc6d5bee9bf9158632dc51678a4100d',
    sellAddress: '0xbf2179859fc6d5bee9bf9158632dc51678a4100e',
};

const baseExpected: DexTrade = {
    sourceUrl: BLOXY_DEX_TRADES_URL,
    txHash: '0xb93a7faf92efbbb5405c9a73cd4efd99702fe27c03ff22baee1f1b1e37b3a0bf',
    tradeIndex: '1',
    txTimestamp: 1542791188000,
    txDate: '2018-11-21',
    txSender: '0x00923b9a074762b93650716333b3e1473a15048e',
    smartContractId: 7091917,
    smartContractAddress: '0x818e6fecd516ecc3849daf6845e3ec868087b755',
    contractType: 'DEX/Kyber Network Proxy',
    maker: '0x0000000000000000000000000000000000000001',
    taker: '0x0000000000000000000000000000000000000002',
    amountBuy: new BigNumber('1.011943163078103'),
    makerFeeAmount: new BigNumber('38.912083'),
    buyCurrencyId: 1,
    buySymbol: 'ETH',
    amountSell: new BigNumber('941.4997928436911'),
    takerFeeAmount: new BigNumber('100.39'),
    sellCurrencyId: 16610,
    sellSymbol: 'ELF',
    makerAnnotation: 'random annotation',
    takerAnnotation: 'random other annotation',
    protocol: 'Kyber Network Proxy',
    buyAddress: '0xbf2179859fc6d5bee9bf9158632dc51678a4100d',
    sellAddress: '0xbf2179859fc6d5bee9bf9158632dc51678a4100e',
};

interface TestCase {
    input: BloxyTrade;
    expected: DexTrade;
}

const testCases: TestCase[] = [
    {
        input: baseInput,
        expected: baseExpected,
    },
    {
        input: R.merge(baseInput, { buyAddress: null, sellAddress: null }),
        expected: R.merge(baseExpected, { buyAddress: null, sellAddress: null }),
    },
    {
        input: R.merge(baseInput, {
            buySymbol:
                'RING\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000',
        }),
        expected: R.merge(baseExpected, { buySymbol: 'RING' }),
    },
];

describe('bloxy', () => {
    describe('_parseBloxyTrade', () => {
        for (const [i, testCase] of testCases.entries()) {
            it(`converts BloxyTrade to DexTrade entity (${i + 1}/${testCases.length})`, () => {
                const actual = _parseBloxyTrade(testCase.input);
                expect(actual).deep.equal(testCase.expected);
            });
        }
    });
});
