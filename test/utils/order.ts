import {SignedOrder} from '../../src/types';
import * as BigNumber from 'bignumber.js';
import * as _ from 'lodash';

export function signedOrderFromJSON(signedOrderJSON: any): SignedOrder {
    const signedOrder = {
        maker: signedOrderJSON.maker.address,
        taker: _.isEmpty(signedOrderJSON.taker.address) ? undefined : signedOrderJSON.taker.address,
        makerTokenAddress: signedOrderJSON.maker.token.address,
        takerTokenAddress: signedOrderJSON.taker.token.address,
        makerTokenAmount: new BigNumber(signedOrderJSON.maker.amount),
        takerTokenAmount: new BigNumber(signedOrderJSON.taker.amount),
        makerFee: new BigNumber(signedOrderJSON.maker.feeAmount),
        takerFee: new BigNumber(signedOrderJSON.taker.feeAmount),
        expirationUnixTimestampSec: new BigNumber(signedOrderJSON.expiration),
        feeRecipient: signedOrderJSON.feeRecipient,
        ecSignature: signedOrderJSON.signature,
        salt: new BigNumber(signedOrderJSON.salt),
    };
    return signedOrder;
}
