import {SignedOrder, Token} from '../../src/types';
import * as BigNumber from 'bignumber.js';
import * as _ from 'lodash';
import {ZeroEx} from '../../src/0x.js';
import {constants} from './constants';
import * as ExchangeArtifacts from '../../src/artifacts/Exchange.json';

export const orderFactory = {
    async createSignedOrderAsync(
        zeroEx: ZeroEx,
        networkId: number,
        maker: string,
        taker: string,
        makerTokenAmount: BigNumber.BigNumber|number,
        makerTokenAddress: string,
        takerTokenAmount: BigNumber.BigNumber|number,
        takerTokenAddress: string): Promise<SignedOrder> {
        // TODO refactor and check
        const exchangeAddress: string = (ExchangeArtifacts as any).networks[networkId].address;
        const INF_TIMESTAMP = 2524604400;
        const order = {
            maker,
            taker,
            makerFee: new BigNumber(0),
            takerFee: new BigNumber(0),
            makerTokenAmount: _.isNumber(makerTokenAmount) ? new BigNumber(makerTokenAmount) : makerTokenAmount,
            takerTokenAmount: _.isNumber(takerTokenAmount) ? new BigNumber(takerTokenAmount) : takerTokenAmount,
            makerTokenAddress,
            takerTokenAddress,
            salt: ZeroEx.generatePseudoRandomSalt(),
            feeRecipient: constants.NULL_ADDRESS,
            expirationUnixTimestampSec: new BigNumber(INF_TIMESTAMP),
        };
        const orderHash = ZeroEx.getOrderHashHex(exchangeAddress, order);
        const ecSignature = await zeroEx.signOrderHashAsync(orderHash);
        const signedOrder: SignedOrder = _.assign(order, {ecSignature});
        return signedOrder;
    }
}
