import {SignedOrder} from '../../src/types';
import * as BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import {ZeroEx} from '../../src/0x.js';
import {constants} from './constants';

export async function createSignedOrder(zeroEx: ZeroEx): Promise<SignedOrder> {
    // TODO: fetch properly
    const EXCHANGE_ADDRESS = '0xb69e673309512a9d726f87304c6984054f87a93b';
    const INF_TIMESTAMP = 2524604400;
    const order = {
        maker: '0x5409ed021d9299bf6814279a6a1411a7e866a631',
        taker: undefined,
        makerFee: new BigNumber(0),
        takerFee: new BigNumber(0),
        makerTokenAmount: new BigNumber(5000000000000000000),
        takerTokenAmount: new BigNumber(42000000000000000000),
        makerTokenAddress: '0x07f96aa816c1f244cbc6ef114bb2b023ba54a2eb',
        takerTokenAddress: '0x1e2f9e10d02a6b8f8f69fcbf515e75039d2ea30d',
        salt: ZeroEx.generatePseudoRandomSalt(),
        feeRecipient: constants.NULL_ADDRESS,
        expirationUnixTimestampSec: new BigNumber(INF_TIMESTAMP),
    };
    const orderHash = ZeroEx.getOrderHashHex(EXCHANGE_ADDRESS, order);
    const ecSignature = await zeroEx.signOrderHashAsync(orderHash);
    const signedOrder: SignedOrder = _.assign(order, {ecSignature});
    return signedOrder;
}
