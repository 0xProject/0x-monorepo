import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { orderHashUtils } from '../src';

import { constants } from '../src/constants';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

describe('Order hashing', () => {
    describe('#getOrderHashHex', () => {
        const expectedOrderHash = '0x331cb7e07a757bae130702da6646c26531798c92bcfaf671817268fd2c188531';
        const fakeExchangeContractAddress = '0x1dc4c1cefef38a777b15aa20260a54e584b16c48';
        const fakeChainID = 50;
        const order: Order = {
            makerAddress: constants.NULL_ADDRESS,
            takerAddress: constants.NULL_ADDRESS,
            senderAddress: constants.NULL_ADDRESS,
            feeRecipientAddress: constants.NULL_ADDRESS,
            makerAssetData: constants.NULL_ADDRESS,
            takerAssetData: constants.NULL_ADDRESS,
            makerFeeAssetData: constants.NULL_ADDRESS,
            takerFeeAssetData: constants.NULL_ADDRESS,
            salt: new BigNumber(0),
            makerFee: new BigNumber(0),
            takerFee: new BigNumber(0),
            makerAssetAmount: new BigNumber(0),
            takerAssetAmount: new BigNumber(0),
            expirationTimeSeconds: new BigNumber(0),
            exchangeAddress: fakeExchangeContractAddress,
            chainId: fakeChainID,
        };
        it('calculates the order hash', async () => {
            const orderHash = orderHashUtils.getOrderHashHex(order);
            expect(orderHash).to.be.equal(expectedOrderHash);
        });
        it('calculates the order hash if amounts are strings', async () => {
            // It's common for developers using javascript to provide the amounts
            // as strings. Since we eventually toString() the BigNumber
            // before encoding we should result in the same orderHash in this scenario
            // tslint:disable-next-line:no-unnecessary-type-assertion
            const orderHash = orderHashUtils.getOrderHashHex({
                ...order,
                makerAssetAmount: '0',
                takerAssetAmount: '0',
                makerFee: '0',
                takerFee: '0',
            } as any);
            expect(orderHash).to.be.equal(expectedOrderHash);
        });
        it('throws a readable error message if taker format is invalid', async () => {
            const orderWithInvalidtakerFormat = {
                ...order,
                takerAddress: (null as any) as string,
            };
            const expectedErrorMessage = `Order taker must be of type string. If you want anyone to be able to fill an order - pass ${
                constants.NULL_ADDRESS
            }`;
            expect(() => orderHashUtils.getOrderHashHex(orderWithInvalidtakerFormat)).to.throw(expectedErrorMessage);
        });
    });
});
