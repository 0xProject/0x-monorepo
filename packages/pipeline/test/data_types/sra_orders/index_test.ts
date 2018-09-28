import { APIOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import 'mocha';
import { Connection, createConnection } from 'typeorm';

import { _convertToEntity } from '../../../src/data_types/sra_orders';
import { SraOrder } from '../../../src/entities/SraOrder';
import { chaiSetup } from '../../utils/chai_setup';

import { config } from '../../../src/ormconfig';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('sra_orders', () => {
    describe('_convertToEntity', () => {
        before(async () => {
            // HACK(albrow): We don't actually use this connection but it seems
            // to be required because chai calls the inspect method of the
            // entity and that method requires a "default" connection.
            await createConnection(config);
        });
        it('converts ApiOrder to SraOrder entity', () => {
            const input: APIOrder = {
                order: {
                    makerAddress: '0xb45df06e38540a675fdb5b598abf2c0dbe9d6b81',
                    takerAddress: '0x0000000000000000000000000000000000000000',
                    feeRecipientAddress: '0xa258b39954cef5cb142fd567a46cddb31a670124',
                    senderAddress: '0x0000000000000000000000000000000000000000',
                    makerAssetAmount: new BigNumber('1619310371000000000'),
                    takerAssetAmount: new BigNumber('8178335207070707070707'),
                    makerFee: new BigNumber('0'),
                    takerFee: new BigNumber('0'),
                    exchangeAddress: '0x4f833a24e1f95d70f028921e27040ca56e09ab0b',
                    expirationTimeSeconds: new BigNumber('1538529488'),
                    signature:
                        '0x1b5a5d672b0d647b5797387ccbb89d822d5d2e873346b014f4ff816ff0783f2a7a0d2824d2d7042ec8ea375bc7f870963e1cb8248f1db03ddf125e27b5963aa11f03',
                    salt: new BigNumber('1537924688891'),
                    makerAssetData: '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                    takerAssetData: '0xf47261b000000000000000000000000042d6622dece394b54999fbd73d108123806f6a18',
                },
                metaData: { isThisArbitraryData: true, powerLevel: 9001 },
            };
            const expected = new SraOrder();
            expected.exchangeAddress = '0x4f833a24e1f95d70f028921e27040ca56e09ab0b';
            expected.orderHashHex = '0x1bdbeb0d088a33da28b9ee6d94e8771452f90f4a69107da2fa75195d61b9a1c9';
            expected.lastUpdatedTimestamp = 0;
            expected.firstSeenTimestamp = 0;
            expected.makerAddress = '0xb45df06e38540a675fdb5b598abf2c0dbe9d6b81';
            expected.takerAddress = '0x0000000000000000000000000000000000000000';
            expected.feeRecipientAddress = '0xa258b39954cef5cb142fd567a46cddb31a670124';
            expected.senderAddress = '0x0000000000000000000000000000000000000000';
            expected.makerAssetAmount = '1619310371000000000';
            expected.takerAssetAmount = '8178335207070707070707';
            expected.makerFee = '0';
            expected.takerFee = '0';
            expected.expirationTimeSeconds = '1538529488';
            expected.salt = '1537924688891';
            expected.signature =
                '0x1b5a5d672b0d647b5797387ccbb89d822d5d2e873346b014f4ff816ff0783f2a7a0d2824d2d7042ec8ea375bc7f870963e1cb8248f1db03ddf125e27b5963aa11f03';
            expected.rawMakerAssetData = '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
            expected.makerAssetType = 'erc20';
            expected.makerAssetProxyId = '0xf47261b0';
            expected.makerTokenAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
            expected.makerTokenId = null;
            expected.rawTakerAssetData = '0xf47261b000000000000000000000000042d6622dece394b54999fbd73d108123806f6a18';
            expected.takerAssetType = 'erc20';
            expected.takerAssetProxyId = '0xf47261b0';
            expected.takerTokenAddress = '0x42d6622dece394b54999fbd73d108123806f6a18';
            expected.takerTokenId = null;
            expected.metaDataJson = '{"isThisArbitraryData":true,"powerLevel":9001}';

            const actual = _convertToEntity(input);
            expect(actual).deep.equal(expected);
        });
    });
});
