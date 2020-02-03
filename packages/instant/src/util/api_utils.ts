import { BigNumber } from '@0x/utils';

import { ZeroExAPIQuoteResponse } from '../types';

export const apiUtils = {
    convertJSONResponse(resJson: any): ZeroExAPIQuoteResponse {
        return {
            price: new BigNumber(resJson.price as string),
            to: resJson.to as string,
            data: resJson.data as string,
            value: new BigNumber(resJson.value as string),
            gasPrice: new BigNumber(resJson.gasPrice as string),
            gas: new BigNumber(resJson.gas as string),
            protocolFee: new BigNumber(resJson.protocolFee as string),
            buyAmount: new BigNumber(resJson.buyAmount as string),
            sellAmount: new BigNumber(resJson.sellAmount as string),
            orders: [], // TODO
        };
    },
};
