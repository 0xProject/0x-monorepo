import { BigNumber } from '@0x/utils';
import 'mocha';
import * as R from 'ramda';
import 'reflect-metadata';

import { DexTrade } from '../../src/entities';
import { createDbConnectionOnceAsync } from '../db_setup';
import { chaiSetup } from '../utils/chai_setup';

import { testSaveAndFindEntityAsync } from './util';

chaiSetup.configure();

const baseTrade = {
    sourceUrl: 'https://bloxy.info/api/dex/trades',
    txTimestamp: 1543447585938,
    txDate: '2018-11-21',
    txSender: '0x00923b9a074762b93650716333b3e1473a15048e',
    smartContractId: 7091917,
    smartContractAddress: '0x818e6fecd516ecc3849daf6845e3ec868087b755',
    contractType: 'DEX/Kyber Network Proxy',
    maker: '0xbf2179859fc6d5bee9bf9158632dc51678a4100c',
    taker: '0xbf2179859fc6d5bee9bf9158632dc51678a4100d',
    amountBuy: new BigNumber('1.011943163078103'),
    makerFeeAmount: new BigNumber(0),
    buyCurrencyId: 1,
    buySymbol: 'ETH',
    amountSell: new BigNumber('941.4997928436911'),
    takerFeeAmount: new BigNumber(0),
    sellCurrencyId: 16610,
    sellSymbol: 'ELF',
    makerAnnotation: '',
    takerAnnotation: '',
    protocol: 'Kyber Network Proxy',
    sellAddress: '0xbf2179859fc6d5bee9bf9158632dc51678a4100e',
    tradeIndex: '3',
};

const tradeWithNullAddresses: DexTrade = R.merge(baseTrade, {
    txHash: '0xb93a7faf92efbbb5405c9a73cd4efd99702fe27c03ff22baee1f1b1e37b3a0bf',
    buyAddress: '0xbf2179859fc6d5bee9bf9158632dc51678a4100e',
    sellAddress: '0xbf2179859fc6d5bee9bf9158632dc51678a4100f',
});

const tradeWithNonNullAddresses: DexTrade = R.merge(baseTrade, {
    txHash: '0xb93a7faf92efbbb5405c9a73cd4efd99702fe27c03ff22baee1f1b1e37b3a0be',
    buyAddress: null,
    sellAddress: null,
});

// tslint:disable:custom-no-magic-numbers
describe('DexTrade entity', () => {
    it('save/find', async () => {
        const connection = await createDbConnectionOnceAsync();
        const trades = [tradeWithNullAddresses, tradeWithNonNullAddresses];
        const tradesRepository = connection.getRepository(DexTrade);
        for (const trade of trades) {
            await testSaveAndFindEntityAsync(tradesRepository, trade);
        }
    });
});
