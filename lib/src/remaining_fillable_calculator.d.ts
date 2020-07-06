import { BigNumber } from '@0x/utils';
export declare class RemainingFillableCalculator {
    private readonly _isPercentageFee;
    private readonly _transferrableAssetAmount;
    private readonly _transferrableFeeAmount;
    private readonly _remainingOrderAssetAmount;
    private readonly _remainingOrderFeeAmount;
    private readonly _orderFee;
    private readonly _orderAssetAmount;
    constructor(orderFee: BigNumber, orderAssetAmount: BigNumber, isPercentageFee: boolean, transferrableAssetAmount: BigNumber, transferrableFeeAmount: BigNumber, remainingOrderAssetAmount: BigNumber);
    computeRemainingFillable(): BigNumber;
    private _hasSufficientFundsForFeeAndTransferAmount;
    private _calculatePartiallyFillableAssetAmount;
}
//# sourceMappingURL=remaining_fillable_calculator.d.ts.map