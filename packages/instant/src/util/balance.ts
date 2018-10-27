import { BuyQuote } from '@0x/asset-buyer';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

export const balanceUtil = {
    hasSufficientFunds: async (takerAddress: string | undefined, buyQuote: BuyQuote, web3Wrapper: Web3Wrapper) => {
        if (_.isUndefined(takerAddress)) {
            return false;
        }
        const balanceWei = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
        console.log('balanceWei', balanceWei.toString());
        console.log(
            'buyQuote.worstCaseQuoteInfo.totalEthAmount',
            buyQuote.worstCaseQuoteInfo.totalEthAmount.toString(),
        );
        return balanceWei >= buyQuote.worstCaseQuoteInfo.totalEthAmount;
    },
};
