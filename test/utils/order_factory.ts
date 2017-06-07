import * as _ from 'lodash';
import * as BigNumber from 'bignumber.js';
import {SignedOrder} from '../../src/types';
import {ZeroEx} from '../../src/0x.js';

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
            feeRecipient,
            expirationUnixTimestampSec,
        };
        const orderHash = await zeroEx.getOrderHashHexAsync(order);
        const ecSignature = await zeroEx.signOrderHashAsync(orderHash, maker);
        const signedOrder: SignedOrder = _.assign(order, {ecSignature});
        return signedOrder;
    },
};
