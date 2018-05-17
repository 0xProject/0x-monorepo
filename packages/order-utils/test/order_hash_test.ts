import { web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import 'make-promises-safe';
import 'mocha';

import { constants, getOrderHashHex } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;

describe('Order hashing', () => {
    describe('#getOrderHashHex', () => {
        const expectedOrderHash = '0x39da987067a3c9e5f1617694f1301326ba8c8b0498ebef5df4863bed394e3c83';
        const fakeExchangeContractAddress = '0xb69e673309512a9d726f87304c6984054f87a93b';
        const order = {
            maker: constants.NULL_ADDRESS,
            taker: constants.NULL_ADDRESS,
            feeRecipient: constants.NULL_ADDRESS,
            makerTokenAddress: constants.NULL_ADDRESS,
            takerTokenAddress: constants.NULL_ADDRESS,
            exchangeContractAddress: fakeExchangeContractAddress,
            salt: new BigNumber(0),
            makerFee: new BigNumber(0),
            takerFee: new BigNumber(0),
            makerTokenAmount: new BigNumber(0),
            takerTokenAmount: new BigNumber(0),
            expirationUnixTimestampSec: new BigNumber(0),
        };
        it('calculates the order hash', async () => {
            const orderHash = getOrderHashHex(order);
            expect(orderHash).to.be.equal(expectedOrderHash);
        });
        it('throws a readable error message if taker format is invalid', async () => {
            const orderWithInvalidtakerFormat = {
                ...order,
                taker: (null as any) as string,
            };
            const expectedErrorMessage =
                'Order taker must be of type string. If you want anyone to be able to fill an order - pass ZeroEx.NULL_ADDRESS';
            expect(() => getOrderHashHex(orderWithInvalidtakerFormat)).to.throw(expectedErrorMessage);
        });
    });
});
