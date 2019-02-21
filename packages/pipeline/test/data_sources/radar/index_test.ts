import { BigNumber } from '@0x/utils';
import { RadarOrderState, RadarOrderType } from '@radarrelay/types';
import * as chai from 'chai';
import 'mocha';

import { RadarSource } from '../../../src/data_sources/radar';
import { chaiSetup } from '../../utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

const rawResponse = {
    orderHash: '0x60bc235f7887a50801c8fc1fc18fb0625ac5f3962cdc1bd59567a6929db8b2ec',
    type: 'BID',
    state: 'OPEN',
    baseTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    quoteTokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
    remainingBaseTokenAmount: '9.079731811797989766',
    remainingQuoteTokenAmount: '1099.999999999999999889',
    price: '121.14895272244560081697',
    createdDate: '2019-02-13 21:35:53',
    signedOrder: {
        exchangeAddress: '0x4f833a24e1f95d70f028921e27040ca56e09ab0b',
        senderAddress: '0x0000000000000000000000000000000000000000',
        makerAddress: '0x56178a0d5f301baf6cf3e1cd53d9863437345bf9',
        takerAddress: '0x0000000000000000000000000000000000000000',
        makerAssetData: '0xf47261b000000000000000000000000089d24a6b4ccb1b6faa2625fe562bdd9a23260359',
        takerAssetData: '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        feeRecipientAddress: '0xa258b39954cef5cb142fd567a46cddb31a670124',
        makerAssetAmount: '1099999999999999999889',
        takerAssetAmount: '9079731811797989766',
        makerFee: '0',
        takerFee: '0',
        expirationTimeSeconds: '1550094353',
        signature:
            '0x1ce161d02ad63fe7308e9cd5e97583a8873331d1b72d90e9f3863d9fcba2518cb91ab2fe7de94e4afb39742acdc820abbff2dc0622c8d3865917fade62f16322ae03',
        salt: '1550093753237',
    },
};

const parsedResponse = {
    orderHash: '0x60bc235f7887a50801c8fc1fc18fb0625ac5f3962cdc1bd59567a6929db8b2ec',
    type: 'BID' as RadarOrderType,
    state: 'OPEN' as RadarOrderState,
    baseTokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    quoteTokenAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
    remainingBaseTokenAmount: new BigNumber('9.079731811797989766'),
    remainingQuoteTokenAmount: new BigNumber('1099.999999999999999889'),
    price: new BigNumber('121.14895272244560081697'),
    createdDate: '2019-02-13 21:35:53',
    signedOrder: {
        exchangeAddress: '0x4f833a24e1f95d70f028921e27040ca56e09ab0b',
        senderAddress: '0x0000000000000000000000000000000000000000',
        makerAddress: '0x56178a0d5f301baf6cf3e1cd53d9863437345bf9',
        takerAddress: '0x0000000000000000000000000000000000000000',
        makerAssetData: '0xf47261b000000000000000000000000089d24a6b4ccb1b6faa2625fe562bdd9a23260359',
        takerAssetData: '0xf47261b0000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        feeRecipientAddress: '0xa258b39954cef5cb142fd567a46cddb31a670124',
        makerAssetAmount: new BigNumber('1099999999999999999889'),
        takerAssetAmount: new BigNumber('9079731811797989766'),
        makerFee: new BigNumber('0'),
        takerFee: new BigNumber('0'),
        expirationTimeSeconds: new BigNumber('1550094353'),
        signature:
            '0x1ce161d02ad63fe7308e9cd5e97583a8873331d1b72d90e9f3863d9fcba2518cb91ab2fe7de94e4afb39742acdc820abbff2dc0622c8d3865917fade62f16322ae03',
        salt: new BigNumber('1550093753237'),
    },
};

describe('RadarSource', () => {
    describe('parseRadarOrderResponse', () => {
        it('Correctly parses a Radar orderbook response to a RadarBook', () => {
            expect(RadarSource.parseRadarOrderResponse(rawResponse)).deep.equal(parsedResponse);
        });
    });
});
