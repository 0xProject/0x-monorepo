"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("@0x/utils");
var RemainingFillableCalculator = /** @class */ (function () {
    function RemainingFillableCalculator(orderFee, orderAssetAmount, isPercentageFee, transferrableAssetAmount, transferrableFeeAmount, remainingOrderAssetAmount) {
        this._orderFee = orderFee;
        this._orderAssetAmount = orderAssetAmount;
        this._isPercentageFee = isPercentageFee;
        this._transferrableAssetAmount = transferrableAssetAmount;
        this._transferrableFeeAmount = transferrableFeeAmount;
        this._remainingOrderAssetAmount = remainingOrderAssetAmount;
        this._remainingOrderFeeAmount = orderAssetAmount.eq(0)
            ? new utils_1.BigNumber(0)
            : remainingOrderAssetAmount.times(orderFee).dividedToIntegerBy(orderAssetAmount);
    }
    RemainingFillableCalculator.prototype.computeRemainingFillable = function () {
        if (this._hasSufficientFundsForFeeAndTransferAmount()) {
            return this._remainingOrderAssetAmount;
        }
        if (this._orderFee.isZero()) {
            return utils_1.BigNumber.min(this._remainingOrderAssetAmount, this._transferrableAssetAmount);
        }
        return this._calculatePartiallyFillableAssetAmount();
    };
    RemainingFillableCalculator.prototype._hasSufficientFundsForFeeAndTransferAmount = function () {
        if (this._isPercentageFee) {
            var totalTransferAmountRequired = this._remainingOrderAssetAmount.plus(this._remainingOrderFeeAmount);
            var hasSufficientFunds = this._transferrableAssetAmount.isGreaterThanOrEqualTo(totalTransferAmountRequired);
            return hasSufficientFunds;
        }
        else {
            var hasSufficientFundsForTransferAmount = this._transferrableAssetAmount.isGreaterThanOrEqualTo(this._remainingOrderAssetAmount);
            var hasSufficientFundsForFeeAmount = this._transferrableFeeAmount.isGreaterThanOrEqualTo(this._remainingOrderFeeAmount);
            var hasSufficientFunds = hasSufficientFundsForTransferAmount && hasSufficientFundsForFeeAmount;
            return hasSufficientFunds;
        }
    };
    RemainingFillableCalculator.prototype._calculatePartiallyFillableAssetAmount = function () {
        // Given an order for 200 wei for 2 Fee wei fee, find 100 wei for 1 Fee wei. Order ratio is then 100:1
        var orderToFeeRatio = this._orderAssetAmount.dividedBy(this._orderFee);
        // The number of times the trader (maker or taker) can fill the order, if each fill only required the transfer of a single
        // baseUnit of fee tokens.
        // Given 2 Fee wei, the maximum amount of times trader can fill this order, in terms of fees, is 2
        var fillableTimesInFeeBaseUnits = utils_1.BigNumber.min(this._transferrableFeeAmount, this._remainingOrderFeeAmount);
        // The number of times the trader can fill the order, given the traders asset Balance
        // Assuming a balance of 150 wei, and an orderToFeeRatio of 100:1, trader can fill this order 1 time.
        var fillableTimesInAssetUnits = this._transferrableAssetAmount.dividedBy(orderToFeeRatio);
        if (this._isPercentageFee) {
            // If Fee is the trader asset, the Fee and the trader fill amount need to be removed from the same pool;
            // 200 Fee wei for 2Fee wei fee can only be filled once (need 202 Fee wei)
            var totalAssetPooled = this._transferrableAssetAmount;
            // The purchasing power here is less as the tokens are taken from the same Pool
            // For every one number of fills, we have to take an extra Fee out of the pool
            fillableTimesInAssetUnits = totalAssetPooled.dividedBy(orderToFeeRatio.plus(new utils_1.BigNumber(1)));
        }
        // When Ratio is not fully divisible there can be remainders which cannot be represented, so they are floored.
        // This can result in a RoundingError being thrown by the Exchange Contract.
        var partiallyFillableAssetAmount = fillableTimesInAssetUnits
            .times(this._orderAssetAmount)
            .dividedToIntegerBy(this._orderFee);
        var partiallyFillableFeeAmount = fillableTimesInFeeBaseUnits
            .times(this._orderAssetAmount)
            .dividedToIntegerBy(this._orderFee);
        var partiallyFillableAmount = utils_1.BigNumber.min(partiallyFillableAssetAmount, partiallyFillableFeeAmount);
        return partiallyFillableAmount;
    };
    return RemainingFillableCalculator;
}());
exports.RemainingFillableCalculator = RemainingFillableCalculator;
//# sourceMappingURL=remaining_fillable_calculator.js.map