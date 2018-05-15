import { Provider, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { getOrderHashHex } from './order_hash';
import { generatePseudoRandomSalt } from './salt';
import { signOrderHashAsync } from './signature_utils';

const SHOULD_ADD_PERSONAL_MESSAGE_PREFIX = false;

export const orderFactory = {
    async createSignedOrderAsync(
        provider: Provider,
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
            salt: generatePseudoRandomSalt(),
            exchangeContractAddress,
            feeRecipient,
            expirationUnixTimestampSec,
        };
        const orderHash = getOrderHashHex(order);
        const ecSignature = await signOrderHashAsync(provider, orderHash, maker, SHOULD_ADD_PERSONAL_MESSAGE_PREFIX);
        const signedOrder: SignedOrder = _.assign(order, { ecSignature });
        return signedOrder;
    },
};
