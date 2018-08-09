import { schemas } from '@0xproject/json-schemas';
import { SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';

import { assert } from './assert';
import { constants } from './constants';

export const rateUtils = {
    /**
     * Takes a signed order and calculates the fee adjusted rate (takerAsset/makerAsset) by calculating how much takerAsset
     * is required to cover the fees (feeRate * takerFee), adding the takerAssetAmount and dividing by makerAssetAmount
     * @param   signedOrder     An object that conforms to the signedOrder interface
     * @param   feeRate         The market rate of ZRX denominated in takerAssetAmount
     *                          (ex. feeRate is 0.1 takerAsset/ZRX if it takes 1 unit of takerAsset to buy 10 ZRX)
     * @return  The rate (takerAsset/makerAsset) of the order adjusted for fees
     */
    getFeeAdjustedRateOfOrder(signedOrder: SignedOrder, feeRate: BigNumber): BigNumber {
        assert.doesConformToSchema('signedOrder', signedOrder, schemas.signedOrderSchema);
        assert.isBigNumber('feeRate', feeRate);
        assert.assert(feeRate.greaterThan(constants.ZERO_AMOUNT), `Expected feeRate: ${feeRate} to be greater than 0`);
        const takerAssetAmountNeededToPayForFees = signedOrder.takerFee.mul(feeRate);
        const totalTakerAssetAmount = takerAssetAmountNeededToPayForFees.plus(signedOrder.takerAssetAmount);
        const rate = totalTakerAssetAmount.div(signedOrder.makerAssetAmount);
        return rate;
    },
    /**
     * Takes a signed fee order (makerAssetData corresponds to ZRX and takerAssetData corresponds to WETH) and calculates
     * the fee adjusted rate (WETH/ZRX) by dividing the takerAssetAmount by the makerAmount minus the takerFee
     * @param   signedFeeOrder    An object that conforms to the signedOrder interface
     * @return  The rate (WETH/ZRX) of the fee order adjusted for fees
     */
    getFeeAdjustedRateOfFeeOrder(signedFeeOrder: SignedOrder): BigNumber {
        assert.doesConformToSchema('signedFeeOrder', signedFeeOrder, schemas.signedOrderSchema);
        const zrxAmountAfterFees = signedFeeOrder.makerAssetAmount.sub(signedFeeOrder.takerFee);
        assert.assert(
            zrxAmountAfterFees.greaterThan(constants.ZERO_AMOUNT),
            `Expected takerFee: ${JSON.stringify(
                signedFeeOrder.takerFee,
            )} to be less than makerAssetAmount: ${JSON.stringify(signedFeeOrder.makerAssetAmount)}`,
        );
        const rate = signedFeeOrder.takerAssetAmount.div(zrxAmountAfterFees);
        return rate;
    },
};
