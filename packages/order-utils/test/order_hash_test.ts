import { web3Factory } from '@0xproject/dev-utils';
import { Order } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as chai from 'chai';
import 'make-promises-safe';
import 'mocha';

import { constants, orderHashUtils } from '../src';

import { chaiSetup } from './utils/chai_setup';
import { web3Wrapper } from './utils/web3_wrapper';

chaiSetup.configure();
const expect = chai.expect;

describe('Order hashing', () => {
    describe('#getOrderHashHex', () => {
        const expectedOrderHash = '0x367ad7730eb8b5feab8a9c9f47c6fcba77a2d4df125ee6a59cc26ac955710f7e';
        const fakeExchangeContractAddress = '0xb69e673309512a9d726f87304c6984054f87a93b';
        const order: Order = {
            makerAddress: constants.NULL_ADDRESS,
            takerAddress: constants.NULL_ADDRESS,
            senderAddress: constants.NULL_ADDRESS,
            feeRecipientAddress: constants.NULL_ADDRESS,
            makerAssetData: constants.NULL_ADDRESS,
            takerAssetData: constants.NULL_ADDRESS,
            exchangeAddress: fakeExchangeContractAddress,
            salt: new BigNumber(0),
            makerFee: new BigNumber(0),
            takerFee: new BigNumber(0),
            makerAssetAmount: new BigNumber(0),
            takerAssetAmount: new BigNumber(0),
            expirationTimeSeconds: new BigNumber(0),
        };
        it('calculates the order hash', async () => {
            const orderHash = orderHashUtils.getOrderHashHex(order);
            expect(orderHash).to.be.equal(expectedOrderHash);
        });
        it('throws a readable error message if taker format is invalid', async () => {
            const orderWithInvalidtakerFormat = {
                ...order,
                takerAddress: (null as any) as string,
            };
            const expectedErrorMessage =
                'Order taker must be of type string. If you want anyone to be able to fill an order - pass ZeroEx.NULL_ADDRESS';
            expect(() => orderHashUtils.getOrderHashHex(orderWithInvalidtakerFormat)).to.throw(expectedErrorMessage);
        });
    });
});
