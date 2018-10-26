import { BuyQuote } from '@0x/asset-buyer';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';
import { Dispatch } from 'redux';

import { ZeroExInstantError } from '../types';

import { errorUtil } from './error';

const hasSufficientFunds = async (takerAddress: string | undefined, buyQuote: BuyQuote, web3Wrapper: Web3Wrapper) => {
    if (_.isUndefined(takerAddress)) {
        return false;
    }
    const balanceWei = await web3Wrapper.getBalanceInWeiAsync(takerAddress);
    return balanceWei >= buyQuote.worstCaseQuoteInfo.totalEthAmount;
};

export const balanceUtil = {
    /**
     * Checks to see if user has enough balance to buy assets
     * If they do not, flash an error and return false
     * If they do, return true
     */
    checkInsufficientEthBalanceAndFlashError: async (
        takerAddress: string | undefined,
        buyQuote: BuyQuote,
        web3Wrapper: Web3Wrapper,
        dispatch: Dispatch,
    ) => {
        const hasEnoughFunds = await hasSufficientFunds(takerAddress, buyQuote, web3Wrapper);
        if (hasEnoughFunds) {
            return true;
        }
        const balanceError = new Error(ZeroExInstantError.InsufficientBalance);
        errorUtil.errorFlasher.flashNewError(dispatch, balanceError);
        return false;
    },
};
