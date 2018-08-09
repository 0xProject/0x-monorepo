import { schemas } from '@0xproject/json-schemas';
import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { assert } from './assert';
import { constants } from './constants';
import { rateUtils } from './rate_utils';

export const sortingUtils = {
    /**
     * Takes an array of signed orders and sorts them by takerAsset/makerAsset rate in ascending order (best rate first).
     * Adjusts the rate of each order according to the feeRate and takerFee for that order.
     * @param   signedFeeOrders     An array of objects that conform to the SignedOrder interface. All orders should specify ZRX as
     *                              the makerAsset and WETH as the takerAsset.
     * @param   feeRate             The market rate of ZRX denominated in takerAssetAmount
     *                              (ex. feeRate is 0.1 takerAsset/ZRX if it takes 1 unit of takerAsset to buy 10 ZRX)
     * @return  The input orders sorted by rate in ascending order
     */
    sortOrdersByFeeAdjustedRate(signedOrders: SignedOrder[], feeRate: BigNumber): SignedOrder[] {
        assert.doesConformToSchema('signedOrders', signedOrders, schemas.signedOrdersSchema);
        assert.isBigNumber('feeRate', feeRate);
        const rateCalculator = (signedOrder: SignedOrder) => rateUtils.getFeeAdjustedRateOfOrder(signedOrder, feeRate);
        const sortedOrders = sortOrders(signedOrders, rateCalculator);
        return sortedOrders;
    },
    /**
     * Takes an array of signed fee orders (makerAssetData corresponds to ZRX and takerAssetData corresponds to WETH)
     * and sorts them by rate in ascending order (best rate first). Adjusts the rate according to the takerFee.
     * @param   signedFeeOrders     An array of objects that conform to the SignedOrder interface. All orders should specify ZRX as
     *                              the makerAsset and WETH as the takerAsset.
     * @return  The input orders sorted by rate in ascending order
     */
    sortFeeOrdersByFeeAdjustedRate(signedFeeOrders: SignedOrder[]): SignedOrder[] {
        assert.doesConformToSchema('signedFeeOrders', signedFeeOrders, schemas.signedOrdersSchema);
        const rateCalculator = rateUtils.getFeeAdjustedRateOfFeeOrder;
        const sortedOrders = sortOrders(signedFeeOrders, rateCalculator);
        return sortedOrders;
    },
};

type RateCalculator = (signedOrder: SignedOrder) => BigNumber;

// takes an array of orders, copies them, and sorts the copy based on the rate definition provided by rateCalculator
const sortOrders = (signedOrders: SignedOrder[], rateCalculator: RateCalculator): SignedOrder[] => {
    const copiedOrders = _.cloneDeep(signedOrders);
    const feeOrderComparator = getOrderComparator(rateCalculator);
    copiedOrders.sort(feeOrderComparator);
    return copiedOrders;
};

type Comparator<T> = (first: T, second: T) => number;

// takes a function that calculates rate for a signed order and returns a comparator that sorts based on rate
const getOrderComparator = (rateCalculator: RateCalculator): Comparator<SignedOrder> => (
    firstSignedOrder,
    secondSignedOrder,
) => {
    const firstOrderRate = rateCalculator(firstSignedOrder);
    const secondOrderRate = rateCalculator(secondSignedOrder);
    if (firstOrderRate.lt(secondOrderRate)) {
        return -1;
    } else if (firstOrderRate.gt(secondOrderRate)) {
        return 1;
    } else {
        return 0;
    }
};
