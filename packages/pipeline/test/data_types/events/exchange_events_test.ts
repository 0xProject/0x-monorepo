import { ExchangeFillEventArgs } from '@0xproject/contract-wrappers';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import { LogWithDecodedArgs } from 'ethereum-types';
import 'mocha';

import { _convertToEntity } from '../../../src/data_types/events/exchange_events';
import { ExchangeFillEvent } from '../../../src/entities/ExchangeFillEvent';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

// tslint:disable:custom-no-magic-numbers
describe('exchange_events', () => {
    describe('_convertToEntity', () => {
        it('converts LogWithDecodedArgs to ExchangeFillEvent entity', () => {
            const input: LogWithDecodedArgs<ExchangeFillEventArgs> = {
                logIndex: 102,
                transactionIndex: 38,
                transactionHash: '0x6dd106d002873746072fc5e496dd0fb2541b68c77bcf9184ae19a42fd33657fe',
                blockHash: '',
                blockNumber: 6276262,
                address: '0x4f833a24e1f95d70f028921e27040ca56e09ab0b',
                data:
                    '0x000000000000000000000000f6da68519f78b0d0bc93c701e86affcb75c92428000000000000000000000000f6da68519f78b0d0bc93c701e86affcb75c92428000000000000000000000000000000000000000000000000002386f26fc10000000000000000000000000000000000000000000000000000016345785d8a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f49800000000000000000000000000000000000000000000000000000000',
                topics: [
                    '0x0bcc4c97732e47d9946f229edb95f5b6323f601300e4690de719993f3c371129',
                    '0x000000000000000000000000f6da68519f78b0d0bc93c701e86affcb75c92428',
                    '0x000000000000000000000000c370d2a5920344aa6b7d8d11250e3e861434cbdd',
                    '0xab12ed2cbaa5615ab690b9da75a46e53ddfcf3f1a68655b5fe0d94c75a1aac4a',
                ],
                event: 'Fill',
                args: {
                    makerAddress: '0xf6da68519f78b0d0bc93c701e86affcb75c92428',
                    feeRecipientAddress: '0xc370d2a5920344aa6b7d8d11250e3e861434cbdd',
                    takerAddress: '0xf6da68519f78b0d0bc93c701e86affcb75c92428',
                    senderAddress: '0xf6da68519f78b0d0bc93c701e86affcb75c92428',
                    makerAssetFilledAmount: new BigNumber('10000000000000000'),
                    takerAssetFilledAmount: new BigNumber('100000000000000000'),
                    makerFeePaid: new BigNumber('0'),
                    takerFeePaid: new BigNumber('0'),
                    orderHash: '0xab12ed2cbaa5615ab690b9da75a46e53ddfcf3f1a68655b5fe0d94c75a1aac4a',
                    makerAssetData: '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
                    takerAssetData: '0xf47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498',
                },
            };
            const expected = new ExchangeFillEvent();
            expected.contractAddress = '0x4f833a24e1f95d70f028921e27040ca56e09ab0b';
            expected.blockNumber = 6276262;
            expected.logIndex = 102;
            expected.rawData =
                '0x000000000000000000000000f6da68519f78b0d0bc93c701e86affcb75c92428000000000000000000000000f6da68519f78b0d0bc93c701e86affcb75c92428000000000000000000000000000000000000000000000000002386f26fc10000000000000000000000000000000000000000000000000000016345785d8a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001600000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000024f47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f49800000000000000000000000000000000000000000000000000000000';
            expected.makerAddress = '0xf6da68519f78b0d0bc93c701e86affcb75c92428';
            expected.takerAddress = '0xf6da68519f78b0d0bc93c701e86affcb75c92428';
            expected.feeRecepientAddress = '0xc370d2a5920344aa6b7d8d11250e3e861434cbdd';
            expected.senderAddress = '0xf6da68519f78b0d0bc93c701e86affcb75c92428';
            expected.makerAssetFilledAmount = '10000000000000000';
            expected.takerAssetFilledAmount = '100000000000000000';
            expected.makerFeePaid = '0';
            expected.takerFeePaid = '0';
            expected.orderHash = '0xab12ed2cbaa5615ab690b9da75a46e53ddfcf3f1a68655b5fe0d94c75a1aac4a';
            expected.rawMakerAssetData = '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
            expected.makerAssetType = 'erc20';
            expected.makerAssetProxyId = '0xf47261b0';
            expected.makerTokenAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
            expected.makerTokenId = null;
            expected.rawTakerAssetData = '0xf47261b0000000000000000000000000e41d2489571d322189246dafa5ebde1f4699f498';
            expected.takerAssetType = 'erc20';
            expected.takerAssetProxyId = '0xf47261b0';
            expected.takerTokenAddress = '0xe41d2489571d322189246dafa5ebde1f4699f498';
            expected.takerTokenId = null;
            const actual = _convertToEntity(input);
            expect(actual).deep.equal(expected);
        });
    });
});
