import { BuyQuote } from '@0x/asset-buyer';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

export const balanceUtil = {
    hasSufficentEth: async (takerAddress: string | undefined, buyQuote: BuyQuote, web3Wrapper: Web3Wrapper) => {
        if (_.isUndefined(takerAddress)) {
            return false;
        }
        const balanceWei = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
        return balanceWei >= buyQuote.worstCaseQuoteInfo.totalEthAmount;
    },
};
