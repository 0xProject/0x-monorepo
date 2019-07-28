import {
    blockchainTests,
    constants,
    expect,
    FillResults,
    txDefaults,
} from '@0x/contracts-test-utils';
import { Order, SignedOrder } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { artifacts, TestExchangeInternalsContract, TestExchangeMathContract } from '../src';

const emptyOrder: Order = {
    senderAddress: constants.NULL_ADDRESS,
    makerAddress: constants.NULL_ADDRESS,
    takerAddress: constants.NULL_ADDRESS,
    makerFee: new BigNumber(0),
    takerFee: new BigNumber(0),
    makerAssetAmount: new BigNumber(0),
    takerAssetAmount: new BigNumber(0),
    makerAssetData: '0x',
    takerAssetData: '0x',
    makerFeeAssetData: '0x',
    takerFeeAssetData: '0x',
    salt: new BigNumber(0),
    feeRecipientAddress: constants.NULL_ADDRESS,
    expirationTimeSeconds: new BigNumber(0),
    domain: {
        verifyingContractAddress: constants.NULL_ADDRESS,
        chainId: 0, // To be filled in later.
    },
};

const emptySignedOrder: SignedOrder = {
    ...emptyOrder,
    signature: '',
};

blockchainTests.only('Isolated fillOrder()', () => {
    it('foo', async () => {
        expect('foo').to.equal('foo');
    });
    blockchainTests.resets('inner', () => {
        it('bar', async () => {
            return expect(Promise.resolve(true)).to.eventually.be.ok;
        });
    });
    require('./nested');
});
