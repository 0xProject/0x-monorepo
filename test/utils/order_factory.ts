import * as _ from 'lodash';
import * as BigNumber from 'bignumber.js';
import {SignedOrder, Token} from '../../src/types';
import {ZeroEx} from '../../src/0x.js';
import {constants} from './constants';
import * as ExchangeArtifacts from '../../src/artifacts/Exchange.json';

export const orderFactory = {
    async createSignedOrderAsync(
        zeroEx: ZeroEx,
        maker: string,
        taker: string,
        makerTokenAmount: BigNumber.BigNumber|number,
        makerTokenAddress: string,
        takerTokenAmount: BigNumber.BigNumber|number,
        takerTokenAddress: string,
        expirationUnixTimestampSec?: BigNumber.BigNumber): Promise<SignedOrder> {
        const INF_TIMESTAMP = new BigNumber(2524604400);
        expirationUnixTimestampSec = _.isUndefined(expirationUnixTimestampSec) ?
            INF_TIMESTAMP :
            expirationUnixTimestampSec;
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
            expirationUnixTimestampSec,
        };
        const orderHash = await zeroEx.getOrderHashHexAsync(order);
        const ecSignature = await zeroEx.signOrderHashAsync(orderHash);
        const signedOrder: SignedOrder = _.assign(order, {ecSignature});
        return signedOrder;
    },
};
