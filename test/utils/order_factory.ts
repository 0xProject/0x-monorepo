import * as _ from 'lodash';
import * as BigNumber from 'bignumber.js';
import {ZeroEx, SignedOrder} from '../../src';

export const orderFactory = {
    async createSignedOrderAsync(
        zeroEx: ZeroEx,
        maker: string,
        taker: string,
        makerFee: BigNumber.BigNumber,
        takerFee: BigNumber.BigNumber,
        makerTokenAmount: BigNumber.BigNumber,
        makerTokenAddress: string,
        takerTokenAmount: BigNumber.BigNumber,
        takerTokenAddress: string,
        exchangeContractAddress: string,
        feeRecipient: string,
        expirationUnixTimestampSec?: BigNumber.BigNumber): Promise<SignedOrder> {
        const defaultExpirationUnixTimestampSec = new BigNumber(2524604400); // Close to infinite
        expirationUnixTimestampSec = _.isUndefined(expirationUnixTimestampSec) ?
            defaultExpirationUnixTimestampSec :
            expirationUnixTimestampSec;
        const order = {
            maker,
            taker,
            makerFee,
            takerFee,
            makerTokenAmount,
            takerTokenAmount,
            makerTokenAddress,
            takerTokenAddress,
            salt: ZeroEx.generatePseudoRandomSalt(),
            exchangeContractAddress,
            feeRecipient,
            expirationUnixTimestampSec,
        };
        const orderHash = ZeroEx.getOrderHashHex(order);
        const ecSignature = await zeroEx.signOrderHashAsync(orderHash, maker);
        const signedOrder: SignedOrder = _.assign(order, {ecSignature});
        return signedOrder;
    },
};
