import { BigNumber } from '@0x/utils';
import 'mocha';
import * as R from 'ramda';
import 'reflect-metadata';
import { Repository } from 'typeorm';

import { SraOrder, SraOrdersObservedTimeStamp } from '../../src/entities';
import { AssetType } from '../../src/types';
import { createDbConnectionOnceAsync } from '../db_setup';
import { chaiSetup } from '../utils/chai_setup';

import { testSaveAndFindEntityAsync } from './util';

chaiSetup.configure();

const baseOrder = {
    sourceUrl: 'https://api.radarrelay.com/0x/v2',
    exchangeAddress: '0x4f833a24e1f95d70f028921e27040ca56e09ab0b',
    makerAddress: '0xb45df06e38540a675fdb5b598abf2c0dbe9d6b81',
    takerAddress: '0x0000000000000000000000000000000000000000',
    feeRecipientAddress: '0xa258b39954cef5cb142fd567a46cddb31a670124',
    senderAddress: '0x0000000000000000000000000000000000000000',
    makerAssetAmount: new BigNumber('1619310371000000000'),
    takerAssetAmount: new BigNumber('8178335207070707070707'),
    makerFee: new BigNumber('100'),
    takerFee: new BigNumber('200'),
    expirationTimeSeconds: new BigNumber('1538529488'),
    salt: new BigNumber('1537924688891'),
    signature: '0x1b5a5d672b0d647b5797387ccbb89d8',
    rawMakerAssetData: '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    makerAssetProxyId: '0xf47261b0',
    makerTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    rawTakerAssetData: '0xf47261b000000000000000000000000042d6622dece394b54999fbd73d108123806f6a18',
    takerAssetProxyId: '0xf47261b0',
    takerTokenAddress: '0x42d6622dece394b54999fbd73d108123806f6a18',
    metadataJson: '{"isThisArbitraryData":true,"powerLevel":9001}',
};

const erc20Order = R.merge(baseOrder, {
    orderHashHex: '0x1bdbeb0d088a33da28b9ee6d94e8771452f90f4a69107da2fa75195d61b9a1c9',
    makerAssetType: 'erc20' as AssetType,
    makerTokenId: null,
    takerAssetType: 'erc20' as AssetType,
    takerTokenId: null,
});

const erc721Order = R.merge(baseOrder, {
    orderHashHex: '0x1bdbeb0d088a33da28b9ee6d94e8771452f90f4a69107da2fa75195d61b9a1d0',
    makerAssetType: 'erc721' as AssetType,
    makerTokenId: '19378573',
    takerAssetType: 'erc721' as AssetType,
    takerTokenId: '63885673888',
});

// tslint:disable:custom-no-magic-numbers
describe('SraOrder and SraOrdersObservedTimeStamp entities', () => {
    // Note(albrow): SraOrder and SraOrdersObservedTimeStamp are tightly coupled
    // and timestamps have a foreign key constraint such that they have to point
    // to an existing SraOrder. For these reasons, we are testing them together
    // in the same test.
    it('save/find', async () => {
        const connection = await createDbConnectionOnceAsync();
        const orderRepository = connection.getRepository(SraOrder);
        const timestampRepository = connection.getRepository(SraOrdersObservedTimeStamp);
        const orders = [erc20Order, erc721Order];
        for (const order of orders) {
            await testOrderWithTimestampAsync(orderRepository, timestampRepository, order);
        }
    });
});

async function testOrderWithTimestampAsync(
    orderRepository: Repository<SraOrder>,
    timestampRepository: Repository<SraOrdersObservedTimeStamp>,
    order: SraOrder,
): Promise<void> {
    await testSaveAndFindEntityAsync(orderRepository, order);
    const timestamp = new SraOrdersObservedTimeStamp();
    timestamp.exchangeAddress = order.exchangeAddress;
    timestamp.orderHashHex = order.orderHashHex;
    timestamp.sourceUrl = order.sourceUrl;
    timestamp.observedTimestamp = 1543377376153;
    await testSaveAndFindEntityAsync(timestampRepository, timestamp);
}
