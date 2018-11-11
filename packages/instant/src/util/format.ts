import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { ETH_DECIMALS } from '../constants';

export const format = {
    ethBaseAmount: (
        ethBaseAmount?: BigNumber,
        decimalPlaces: number = 4,
        defaultText: React.ReactNode = '0 ETH',
    ): React.ReactNode => {
        if (_.isUndefined(ethBaseAmount)) {
            return defaultText;
        }
        const ethUnitAmount = Web3Wrapper.toUnitAmount(ethBaseAmount, ETH_DECIMALS);
        return format.ethUnitAmount(ethUnitAmount, decimalPlaces);
    },
    ethUnitAmount: (
        ethUnitAmount?: BigNumber,
        decimalPlaces: number = 4,
        defaultText: React.ReactNode = '0 ETH',
    ): React.ReactNode => {
        if (_.isUndefined(ethUnitAmount)) {
            return defaultText;
        }
        const roundedAmount = ethUnitAmount.round(decimalPlaces).toDigits(decimalPlaces);
        return `${roundedAmount} ETH`;
    },
    ethBaseAmountInUsd: (
        ethBaseAmount?: BigNumber,
        ethUsdPrice?: BigNumber,
        decimalPlaces: number = 2,
        defaultText: React.ReactNode = '$0.00',
    ): React.ReactNode => {
        if (_.isUndefined(ethBaseAmount) || _.isUndefined(ethUsdPrice)) {
            return defaultText;
        }
        const ethUnitAmount = Web3Wrapper.toUnitAmount(ethBaseAmount, ETH_DECIMALS);
        return format.ethUnitAmountInUsd(ethUnitAmount, ethUsdPrice, decimalPlaces);
    },
    ethUnitAmountInUsd: (
        ethUnitAmount?: BigNumber,
        ethUsdPrice?: BigNumber,
        decimalPlaces: number = 2,
        defaultText: React.ReactNode = '$0.00',
    ): React.ReactNode => {
        if (_.isUndefined(ethUnitAmount) || _.isUndefined(ethUsdPrice)) {
            return defaultText;
        }
        return `$${ethUnitAmount.mul(ethUsdPrice).toFixed(decimalPlaces)}`;
    },
    ethAddress: (address: string): string => {
        return `0x${address.slice(2, 7)}…${address.slice(-5)}`;
    },
};
