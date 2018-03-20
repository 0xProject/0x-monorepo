import { SignedOrder } from '0x.js';
import { BigNumber } from '@0xproject/utils';

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

// Source an Order, perhaps from your own Maker
const portalOrder = {
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
    private _orderUpdateCallback: OrderUpdateCallback;
    constructor(orderUpdateCallback: OrderUpdateCallback) {
        this._orderUpdateCallback = orderUpdateCallback;
    }

    public async start() {
        const latestOrder = await this._fetchLatestOrderAsync();
        this._orderUpdateCallback(latestOrder);
    }

    // tslint:disable-next-line:prefer-function-over-method no-empty
    public async stop() {}

    public async requestQuoteAsync(amount: BigNumber, pair: TokenPair): Promise<Quote> {
        const latestOrder = await this._fetchLatestOrderAsync();
        return {
            amount,
            pair,
            orders: [latestOrder],
            maxAmount: amount,
        };
    }

    // tslint:disable-next-line:prefer-function-over-method
    private async _fetchLatestOrderAsync(): Promise<SignedOrder> {
        return convertPortalOrder(portalOrder);
    }
}

export { FixedProvider };
