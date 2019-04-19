import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { BIG_NUMBER_ZERO, ETH_DECIMALS } from '../constants';

export const format = {
    ethBaseUnitAmount: (
        ethBaseUnitAmount?: BigNumber,
        decimalPlaces: number = 4,
        defaultText: React.ReactNode = '0 ETH',
    ): React.ReactNode => {
        if (ethBaseUnitAmount === undefined) {
            return defaultText;
        }
        const ethUnitAmount = Web3Wrapper.toUnitAmount(ethBaseUnitAmount, ETH_DECIMALS);
        return format.ethUnitAmount(ethUnitAmount, decimalPlaces);
    },
    ethUnitAmount: (
        ethUnitAmount?: BigNumber,
        decimalPlaces: number = 4,
        defaultText: React.ReactNode = '0 ETH',
        minUnitAmountToDisplay: BigNumber = new BigNumber('0.00001'),
    ): React.ReactNode => {
        if (ethUnitAmount === undefined) {
            return defaultText;
        }
        let roundedAmount = ethUnitAmount.decimalPlaces(decimalPlaces).precision(decimalPlaces);

        if (roundedAmount.eq(BIG_NUMBER_ZERO) && ethUnitAmount.isGreaterThan(BIG_NUMBER_ZERO)) {
            // Sometimes for small ETH amounts (i.e. 0.000045) the amount rounded to 4 decimalPlaces is 0
            // If that is the case, show to 1 significant digit
            roundedAmount = new BigNumber(ethUnitAmount.toPrecision(1));
        }

        const displayAmount =
            roundedAmount.isGreaterThan(BIG_NUMBER_ZERO) && roundedAmount.isLessThan(minUnitAmountToDisplay)
                ? `< ${minUnitAmountToDisplay.toString()}`
                : roundedAmount.toString();

        return `${displayAmount} ETH`;
    },
    ethBaseUnitAmountInUsd: (
        ethBaseUnitAmount?: BigNumber,
        ethUsdPrice?: BigNumber,
        decimalPlaces: number = 2,
        defaultText: React.ReactNode = '$0.00',
        minUnitAmountToDisplay: BigNumber = new BigNumber('0.00001'),
    ): React.ReactNode => {
        if (ethBaseUnitAmount === undefined || ethUsdPrice === undefined) {
            return defaultText;
        }
        const ethUnitAmount = Web3Wrapper.toUnitAmount(ethBaseUnitAmount, ETH_DECIMALS);
        return format.ethUnitAmountInUsd(ethUnitAmount, ethUsdPrice, decimalPlaces, minUnitAmountToDisplay);
    },
    ethUnitAmountInUsd: (
        ethUnitAmount?: BigNumber,
        ethUsdPrice?: BigNumber,
        decimalPlaces: number = 2,
        defaultText: React.ReactNode = '$0.00',
    ): React.ReactNode => {
        if (ethUnitAmount === undefined || ethUsdPrice === undefined) {
            return defaultText;
        }
        const rawUsdPrice = ethUnitAmount.multipliedBy(ethUsdPrice);
        const roundedUsdPrice = rawUsdPrice.toFixed(decimalPlaces);
        if (roundedUsdPrice === '0.00' && rawUsdPrice.gt(BIG_NUMBER_ZERO)) {
            return '<$0.01';
        } else {
            return `$${roundedUsdPrice}`;
        }
    },
    ethAddress: (address: string): string => {
        return `0x${address.slice(2, 7)}…${address.slice(-5)}`;
    },
};
