"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("@0x/utils");
var assert_1 = require("./assert");
exports.affiliateFeeUtils = {
    /**
     * Get the amount of eth to send for a forwarder contract call (includes takerAssetAmount, protocol fees, and specified affiliate fee amount)
     * @param swapQuoteInfo SwapQuoteInfo to generate total eth amount from
     * @param feePercentage Percentage of additive fees to apply to totalTakerAssetAmount + protocol fee.
     */
    getTotalEthAmountWithAffiliateFee: function (swapQuoteInfo, feePercentage) {
        var ethAmount = swapQuoteInfo.protocolFeeInWeiAmount.plus(swapQuoteInfo.totalTakerAssetAmount);
        var ethAmountWithFees = ethAmount.plus(exports.affiliateFeeUtils.getFeeAmount(swapQuoteInfo, feePercentage));
        return ethAmountWithFees;
    },
    /**
     * Get the affiliate fee owed to the forwarder fee recipient.
     * @param swapQuoteInfo SwapQuoteInfo to generate total eth amount from
     * @param feePercentage Percentage of additive fees to apply to totalTakerAssetAmount + protocol fee.
     */
    getFeeAmount: function (swapQuoteInfo, feePercentage) {
        assert_1.assert.assert(feePercentage >= 0, 'feePercentage must be >= 0');
        var ethAmount = swapQuoteInfo.protocolFeeInWeiAmount.plus(swapQuoteInfo.totalTakerAssetAmount);
        // HACK(dekz): This is actually in WEI amount not ETH
        return ethAmount.times(feePercentage).integerValue(utils_1.BigNumber.ROUND_UP);
    },
};
//# sourceMappingURL=affiliate_fee_utils.js.map