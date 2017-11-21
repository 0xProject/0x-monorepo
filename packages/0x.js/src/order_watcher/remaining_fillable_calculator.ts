import {
    SignedOrder,
} from '../types';
import { BigNumber } from 'bignumber.js';
export class RemainingFillableCalculator {
    private _signedOrder: SignedOrder;
    private _isMakerTokenZRX: boolean;
    private _transferrableMakerTokenAmount: BigNumber;
    private _transferrableMakerFeeTokenAmount: BigNumber;
    private _remainingMakerTokenAmount: BigNumber;
    private _remainingMakerFeeAmount: BigNumber;
    constructor(signedOrder: SignedOrder,
                isMakerTokenZRX: boolean,
                transferrableMakerTokenAmount: BigNumber,
                transferrableMakerFeeTokenAmount: BigNumber,
                remainingMakerTokenAmount: BigNumber) {
        this._signedOrder = signedOrder;
        this._isMakerTokenZRX = isMakerTokenZRX;
        this._transferrableMakerTokenAmount = transferrableMakerTokenAmount;
        this._transferrableMakerFeeTokenAmount = transferrableMakerFeeTokenAmount;
        this._remainingMakerTokenAmount = remainingMakerTokenAmount;
        this._remainingMakerFeeAmount = remainingMakerTokenAmount.times(signedOrder.makerFee)
                                                                 .dividedToIntegerBy(signedOrder.makerTokenAmount);
    }
    public computeRemainingMakerFillable(): BigNumber {
        if (this.hasSufficientFundsForFeeAndTransferAmount()) {
            return this._remainingMakerTokenAmount;
        }
        if (this._signedOrder.makerFee.isZero()) {
            return BigNumber.min(this._remainingMakerTokenAmount, this._transferrableMakerTokenAmount);
        } else {
            return this.calculatePartiallyFillableMakerTokenAmount();
        }
    }
    public computeRemainingTakerFillable(): BigNumber {
        return this.computeRemainingMakerFillable().times(this._signedOrder.takerTokenAmount)
                                                   .dividedToIntegerBy(this._signedOrder.makerTokenAmount);
    }
    private hasSufficientFundsForFeeAndTransferAmount(): boolean {
        if (this._isMakerTokenZRX) {
            const totalZRXTransferAmountRequired = this._remainingMakerTokenAmount.plus(this._remainingMakerFeeAmount);
            return this._transferrableMakerTokenAmount.gte(totalZRXTransferAmountRequired);
        } else {
            const hasSufficientFundsForTransferAmount = this._transferrableMakerTokenAmount.gte(
                                                            this._remainingMakerTokenAmount);
            const hasSufficientFundsForFeeAmount = this._transferrableMakerFeeTokenAmount.gte(
                                                       this._remainingMakerFeeAmount);
            return (hasSufficientFundsForTransferAmount && hasSufficientFundsForFeeAmount);
        }
    }

    private calculatePartiallyFillableMakerTokenAmount(): BigNumber {
        const orderToFeeRatio = this._signedOrder.makerTokenAmount.dividedToIntegerBy(this._signedOrder.makerFee);
        // Maximum number of times the Maker can fill the order, given the fees
        const fillableTimesInFeeTokenUnits = BigNumber.min(this._transferrableMakerFeeTokenAmount,
                                                           this._remainingMakerFeeAmount);
        // Maximum number of times the Maker can fill the order, given the Maker Token Balance
        let fillableTimesInMakerTokenUnits = this._transferrableMakerTokenAmount.dividedToIntegerBy(orderToFeeRatio);
        if (this._isMakerTokenZRX) {
            const totalZRXTokenPooled = this._transferrableMakerTokenAmount;
            // The purchasing power here is less as the tokens are taken from the same Pool
            // For every one number of fills, we have to take an extra ZRX out of the pool
            fillableTimesInMakerTokenUnits = totalZRXTokenPooled.dividedToIntegerBy(
                                                                     orderToFeeRatio.plus(new BigNumber(1)));

        }
        const partiallyFillableMakerTokenAmount = fillableTimesInMakerTokenUnits.times(orderToFeeRatio);
        const partiallyFillableFeeTokenAmount = fillableTimesInFeeTokenUnits.times(orderToFeeRatio);
        return BigNumber.min(partiallyFillableMakerTokenAmount, partiallyFillableFeeTokenAmount);
    }
}
