import {SignedOrder, Token} from '../../src/types';
import * as BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import {ZeroEx} from '../../src/0x.js';
import {constants} from './constants';

export async function createSignedOrder(
    zeroEx: ZeroEx,
    tokens: Token[],
    makerTokenAmount: BigNumber.BigNumber|number,
    makerTokenSymbol: string,
    takerTokenAmount: BigNumber.BigNumber|number,
    takerTokenSymbol: string): Promise<SignedOrder> {
    // TODO: fetch properly
    const EXCHANGE_ADDRESS = '0xb69e673309512a9d726f87304c6984054f87a93b';
    const INF_TIMESTAMP = 2524604400;
    const makerToken = _.find(tokens, {symbol: makerTokenSymbol});
    const takerToken = _.find(tokens, {symbol: takerTokenSymbol});
    if (_.isUndefined(makerToken)) {
        throw new Error(`Token ${makerTokenSymbol} not found`);
    }
    if (_.isUndefined(takerToken)) {
        throw new Error(`Token ${takerTokenSymbol} not found`);
    }
    const order = {
        maker: '0x5409ed021d9299bf6814279a6a1411a7e866a631',
        taker: undefined,
        makerFee: new BigNumber(0),
        takerFee: new BigNumber(0),
        makerTokenAmount: _.isNumber(makerTokenAmount) ? new BigNumber(makerTokenAmount) : makerTokenAmount,
        takerTokenAmount: _.isNumber(takerTokenAmount) ? new BigNumber(takerTokenAmount) : takerTokenAmount,
        makerTokenAddress: makerToken.address,
        takerTokenAddress: takerToken.address,
        salt: ZeroEx.generatePseudoRandomSalt(),
        feeRecipient: constants.NULL_ADDRESS,
        expirationUnixTimestampSec: new BigNumber(INF_TIMESTAMP),
    };
    const orderHash = ZeroEx.getOrderHashHex(EXCHANGE_ADDRESS, order);
    const ecSignature = await zeroEx.signOrderHashAsync(orderHash);
    const signedOrder: SignedOrder = _.assign(order, {ecSignature});
    return signedOrder;
}
