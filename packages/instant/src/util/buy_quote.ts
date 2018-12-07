import { BuyQuoteInfo } from '@0x/asset-buyer';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import { oc } from 'ts-optchain';

import { format } from '../util/format';

import { BIG_NUMBER_ZERO } from '../constants';

export interface DisplayAmounts {
    pricePerToken: React.ReactNode;
    assetTotal: React.ReactNode;
    feeTotal: React.ReactNode;
    primaryGrandTotal: React.ReactNode;
    secondaryGrandTotal?: React.ReactNode;
}

export interface BuyQuoteWeiAmounts {
    assetTotalInWei: BigNumber | undefined;
    feeTotalInWei: BigNumber | undefined;
    grandTotalInWei: BigNumber | undefined;
    pricePerTokenInWei: BigNumber | undefined;
}

const ethDisplayFormat = (amountInWei?: BigNumber) => {
    return format.ethBaseUnitAmount(amountInWei, 4, '');
};
const usdDisplayFormat = (amountInWei?: BigNumber, ethUsdPrice?: BigNumber) => {
    return format.ethBaseUnitAmountInUsd(amountInWei, ethUsdPrice, 2, '');
};

export const buyQuoteUtil = {
    getWeiAmounts: (
        selectedAssetUnitAmount: BigNumber | undefined,
        buyQuoteInfo: BuyQuoteInfo | undefined,
    ): BuyQuoteWeiAmounts => {
        const buyQuoteAccessor = oc(buyQuoteInfo);
        const assetTotalInWei = buyQuoteAccessor.assetEthAmount();
        const pricePerTokenInWei =
            !_.isUndefined(assetTotalInWei) &&
            !_.isUndefined(selectedAssetUnitAmount) &&
            !selectedAssetUnitAmount.eq(BIG_NUMBER_ZERO)
                ? assetTotalInWei.div(selectedAssetUnitAmount).ceil()
                : undefined;

        return {
            assetTotalInWei,
            feeTotalInWei: buyQuoteAccessor.feeEthAmount(),
            grandTotalInWei: buyQuoteAccessor.totalEthAmount(),
            pricePerTokenInWei,
        };
    },
    displayAmountsEth: (weiAmounts: BuyQuoteWeiAmounts, ethUsdPrice?: BigNumber): DisplayAmounts => {
        return {
            pricePerToken: ethDisplayFormat(weiAmounts.pricePerTokenInWei),
            assetTotal: ethDisplayFormat(weiAmounts.assetTotalInWei),
            feeTotal: ethDisplayFormat(weiAmounts.feeTotalInWei),
            primaryGrandTotal: ethDisplayFormat(weiAmounts.grandTotalInWei),
            secondaryGrandTotal: usdDisplayFormat(weiAmounts.grandTotalInWei, ethUsdPrice),
        };
    },
    displayAmountsUsd: (weiAmounts: BuyQuoteWeiAmounts, ethUsdPrice?: BigNumber): DisplayAmounts => {
        return {
            pricePerToken: usdDisplayFormat(weiAmounts.pricePerTokenInWei, ethUsdPrice),
            assetTotal: usdDisplayFormat(weiAmounts.assetTotalInWei, ethUsdPrice),
            feeTotal: usdDisplayFormat(weiAmounts.feeTotalInWei, ethUsdPrice),
            primaryGrandTotal: usdDisplayFormat(weiAmounts.grandTotalInWei, ethUsdPrice),
            secondaryGrandTotal: ethDisplayFormat(weiAmounts.grandTotalInWei),
        };
    },
};
