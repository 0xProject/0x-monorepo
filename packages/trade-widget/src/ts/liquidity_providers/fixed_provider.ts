import { SignedOrder, ZeroEx } from '0x.js';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
// tslint:disable-next-line:no-var-requires
const delay = require('delay');

import { LiquidityProvider, OrderUpdateCallback, Quote, TokenPair } from '../types';

function convertPortalOrder(json: any): SignedOrder {
    const rawSignedOrder = json.signedOrder;
    rawSignedOrder.makerFee = new BigNumber(rawSignedOrder.makerFee);
    rawSignedOrder.takerFee = new BigNumber(rawSignedOrder.takerFee);
    rawSignedOrder.makerTokenAmount = new BigNumber(rawSignedOrder.makerTokenAmount);
    rawSignedOrder.takerTokenAmount = new BigNumber(rawSignedOrder.takerTokenAmount);
    rawSignedOrder.expirationUnixTimestampSec = new BigNumber(rawSignedOrder.expirationUnixTimestampSec);
    rawSignedOrder.salt = new BigNumber(rawSignedOrder.salt);
    return rawSignedOrder;
}

const portalOrder1 = {
    signedOrder: {
        maker: '0x5409ed021d9299bf6814279a6a1411a7e866a631',
        taker: '0x0000000000000000000000000000000000000000',
        makerFee: '0',
        takerFee: '0',
        makerTokenAmount: '1000000000000000000000',
        takerTokenAmount: '1000000000000000000',
        makerTokenAddress: '0x1d7022f5b17d2f8b695918fb48fa1089c9f85401',
        takerTokenAddress: '0x871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c',
        expirationUnixTimestampSec: '2524568400',
        feeRecipient: '0x0000000000000000000000000000000000000000',
        salt: '67215552252022860266164373844120625064081254049869772666540069256109124838959',
        ecSignature: {
            v: 28,
            r: '0x88784dd46a93108dcd8a6ca5d896f4611fef5aa084ce6496096c0e8d299782b5',
            s: '0x722a6cf0e426ace852aeb38595b81bfcfa82ae52c19a07b2da92dcd767fc0e4b',
        },
        exchangeContractAddress: '0x48bacb9266a570d521063ef5dd96e61686dbe788',
    },
    metadata: {
        makerToken: {
            name: '0x Protocol Token',
            symbol: 'ZRX',
            decimals: 18,
        },
        takerToken: {
            name: 'Ether Token',
            symbol: 'WETH',
            decimals: 18,
        },
    },
};

const portalOrder2 = {
    signedOrder: {
        maker: '0x5409ed021d9299bf6814279a6a1411a7e866a631',
        taker: '0x0000000000000000000000000000000000000000',
        makerFee: '0',
        takerFee: '0',
        makerTokenAmount: '1000000000000000000000',
        takerTokenAmount: '1200000000000000000',
        makerTokenAddress: '0x1d7022f5b17d2f8b695918fb48fa1089c9f85401',
        takerTokenAddress: '0x871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c',
        expirationUnixTimestampSec: '2524568400',
        feeRecipient: '0x0000000000000000000000000000000000000000',
        salt: '54332514913200256223456612707094291912091468868461936362007705030350623198950',
        ecSignature: {
            v: 27,
            r: '0x5813dfc8f3482ef32ead83047f5704c9120fbbcec0253d8dd110b155aacb0d21',
            s: '0x20c4f1dc5da5722b324b0f0bfae4c9dc6abe37517aa16e9c148ae8b4a12f37f6',
        },
        exchangeContractAddress: '0x48bacb9266a570d521063ef5dd96e61686dbe788',
    },
    metadata: {
        makerToken: {
            name: '0x Protocol Token',
            symbol: 'ZRX',
            decimals: 18,
        },
        takerToken: {
            name: 'Ether Token',
            symbol: 'WETH',
            decimals: 18,
        },
    },
};

const portalOrder3 = {
    signedOrder: {
        maker: '0x5409ed021d9299bf6814279a6a1411a7e866a631',
        taker: '0x0000000000000000000000000000000000000000',
        makerFee: '0',
        takerFee: '0',
        makerTokenAmount: '1000000000000000000000',
        takerTokenAmount: '3000000000000000000',
        makerTokenAddress: '0x1d7022f5b17d2f8b695918fb48fa1089c9f85401',
        takerTokenAddress: '0x871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c',
        expirationUnixTimestampSec: '2524568400',
        feeRecipient: '0x0000000000000000000000000000000000000000',
        salt: '86052777744666001499237522342163490182465677538990165166723096070647847958047',
        ecSignature: {
            v: 27,
            r: '0xc2b22206dded34ee444355e05651b0f59365a9d1b8a8fe4d3eec3828ee33fa21',
            s: '0x5b7f7179b4a89d0f4b5adddb141f376af8fe88e0f6fb24bd15b9abc8711eac47',
        },
        exchangeContractAddress: '0x48bacb9266a570d521063ef5dd96e61686dbe788',
    },
    metadata: {
        makerToken: {
            name: '0x Protocol Token',
            symbol: 'ZRX',
            decimals: 18,
        },
        takerToken: {
            name: 'Ether Token',
            symbol: 'WETH',
            decimals: 18,
        },
    },
};
// Source an Order, perhaps from your own Maker
const portalOrderBig = {
    signedOrder: {
        maker: '0x5409ed021d9299bf6814279a6a1411a7e866a631',
        taker: '0x0000000000000000000000000000000000000000',
        makerFee: '0',
        takerFee: '0',
        makerTokenAmount: '10000000000000000000000',
        takerTokenAmount: '10000000000000000000',
        makerTokenAddress: '0x1d7022f5b17d2f8b695918fb48fa1089c9f85401',
        takerTokenAddress: '0x871dd7c2b4b25e1aa18728e9d5f2af4c4e431f5c',
        expirationUnixTimestampSec: '2524626000',
        feeRecipient: '0x0000000000000000000000000000000000000000',
        salt: '52533589029956344021213327064411678088977266951393342018026333015237649941570',
        ecSignature: {
            v: 28,
            r: '0x9b615d85cfaed0745853ced7f446cd7e8956a1ebc45efa1c51c1abdf71b8447c',
            s: '0x18a6b7c49285f591653a31f67bf6e7361444f1dc233909c9a7e387497624cf67',
        },
        exchangeContractAddress: '0x48bacb9266a570d521063ef5dd96e61686dbe788',
    },
    metadata: {
        makerToken: {
            name: '0x Protocol Token',
            symbol: 'ZRX',
            decimals: 18,
        },
        takerToken: {
            name: 'Ether Token',
            symbol: 'WETH',
            decimals: 18,
        },
    },
};

class FixedProvider implements LiquidityProvider {
    public async requestQuoteAsync(amount: BigNumber, pair: TokenPair, networkId: number): Promise<Quote> {
        const latestOrders = await this._fetchOrdersAsync();
        const orderAmount = latestOrders.reduce((prev: BigNumber, order) => {
            return prev.plus(order.takerTokenAmount);
        }, new BigNumber(0));

        return {
            amount,
            pair,
            orders: latestOrders,
            maxAmount: orderAmount,
            networkId,
        };
    }

    // tslint:disable-next-line:prefer-function-over-method
    private async _fetchOrdersAsync(): Promise<SignedOrder[]> {
        await delay(1000);
        const orders = _.map([portalOrder1, portalOrder2, portalOrder3], portalOrder => {
            return convertPortalOrder(portalOrder);
        });
        return orders;
    }
}

export { FixedProvider };
