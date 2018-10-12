import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';

import { ethDecimals } from '../constants';

export const format = {
    ethBaseAmount: (ethBaseAmount?: BigNumber, decimalPlaces: number = 4, defaultText: string = '0 ETH'): string => {
        if (_.isUndefined(ethBaseAmount)) {
            return defaultText;
        }
        const ethUnitAmount = Web3Wrapper.toUnitAmount(ethBaseAmount, ethDecimals);
        return format.ethUnitAmount(ethUnitAmount, decimalPlaces);
    },
    ethUnitAmount: (ethUnitAmount?: BigNumber, decimalPlaces: number = 4, defaultText: string = '0 ETH'): string => {
        if (_.isUndefined(ethUnitAmount)) {
            return defaultText;
        }
        const roundedAmount = ethUnitAmount.round(decimalPlaces);
        return `${roundedAmount} ETH`;
    },
    ethBaseAmountInUsd: (
        ethBaseAmount?: BigNumber,
        ethUsdPrice?: BigNumber,
        decimalPlaces: number = 2,
        defaultText: string = '$0.00',
    ): string => {
        if (_.isUndefined(ethBaseAmount) || _.isUndefined(ethUsdPrice)) {
            return defaultText;
        }
        const ethUnitAmount = Web3Wrapper.toUnitAmount(ethBaseAmount, ethDecimals);
        return format.ethUnitAmountInUsd(ethUnitAmount, ethUsdPrice, decimalPlaces);
    },
    ethUnitAmountInUsd: (
        ethUnitAmount?: BigNumber,
        ethUsdPrice?: BigNumber,
        decimalPlaces: number = 2,
        defaultText: string = '$0.00',
    ): string => {
        if (_.isUndefined(ethUnitAmount) || _.isUndefined(ethUsdPrice)) {
            return defaultText;
        }
        return `$${ethUnitAmount.mul(ethUsdPrice).round(decimalPlaces)}`;
    },
};
