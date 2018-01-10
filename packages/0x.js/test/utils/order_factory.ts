import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { SignedOrder, ZeroEx } from '../../src';

export const orderFactory = {
    async createSignedOrderAsync(
        zeroEx: ZeroEx,
        maker: string,
        taker: string,
        makerFee: BigNumber,
        takerFee: BigNumber,
        makerTokenAmount: BigNumber,
        makerTokenAddress: string,
        takerTokenAmount: BigNumber,
        takerTokenAddress: string,
        exchangeContractAddress: string,
        feeRecipient: string,
        expirationUnixTimestampSecIfExists?: BigNumber,
    ): Promise<SignedOrder> {
        const defaultExpirationUnixTimestampSec = new BigNumber(2524604400); // Close to infinite
        const expirationUnixTimestampSec = _.isUndefined(expirationUnixTimestampSecIfExists)
            ? defaultExpirationUnixTimestampSec
            : expirationUnixTimestampSecIfExists;
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
        const signedOrder: SignedOrder = _.assign(order, { ecSignature });
        return signedOrder;
    },
};
