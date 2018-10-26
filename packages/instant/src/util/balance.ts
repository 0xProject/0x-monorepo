import { BuyQuote } from '@0x/asset-buyer';
import { Web3Wrapper } from '@0x/web3-wrapper';
import { Dispatch } from 'redux';

import { ZeroExInstantError } from '../types';

import { errorUtil } from './error';

export const balanceUtil = {
    /**
     * Checks to see if user has enough balance to buy assets
     * If they do not, flash an error and return false
     * If they do, return true
     */
    checkSufficientBalanceAndFlashError: async (
        takerAddress: string,
        buyQuote: BuyQuote,
        web3Wrapper: Web3Wrapper,
        dispatch: Dispatch,
    ) => {
        const balanceWei = await web3Wrapper.getBalanceInWeiAsync(takerAddress);

        if (balanceWei < buyQuote.worstCaseQuoteInfo.totalEthAmount) {
            const balanceError = new Error(ZeroExInstantError.InsufficientBalance);
            errorUtil.errorFlasher.flashNewError(dispatch, balanceError);
            return false;
        }
        return true;
    },
};
