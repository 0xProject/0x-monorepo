import { BuyQuoteInfo } from '@0x/asset-buyer';
import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import { oc } from 'ts-optchain';

import { BIG_NUMBER_ZERO } from '../constants';

export interface BuyQuoteWeiAmounts {
    assetTotalInWei: BigNumber | undefined;
    feeTotalInWei: BigNumber | undefined;
    grandTotalInWei: BigNumber | undefined;
    pricePerTokenInWei: BigNumber | undefined;
}

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
};
