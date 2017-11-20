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
                zrxAddress: string,
                transferrableMakerTokenAmount: BigNumber,
                transferrableMakerFeeTokenAmount: BigNumber,
                remainingMakerTokenAmount: BigNumber) {
        this._signedOrder = signedOrder;
        this._isMakerTokenZRX = signedOrder.makerTokenAddress === zrxAddress;
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
            const totalZRXTransferAmount = this._remainingMakerTokenAmount.plus(this._remainingMakerFeeAmount);
            return this._transferrableMakerTokenAmount.gte(totalZRXTransferAmount);
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
        const fillableTimesInFeeToken = BigNumber.min(this._transferrableMakerFeeTokenAmount,
                                                      this._remainingMakerFeeAmount);
        let fillableTimesInMakerToken = this._transferrableMakerTokenAmount.dividedToIntegerBy(orderToFeeRatio);
        if (this._isMakerTokenZRX) {
            // when zrx == maker token transferrable maker == transfer
            const totalZRXTokenPooled = this._transferrableMakerTokenAmount;
            fillableTimesInMakerToken = totalZRXTokenPooled.dividedToIntegerBy(
                                                             orderToFeeRatio.plus(new BigNumber(1)));

        }
        const partiallyFillableMakerTokenAmount = fillableTimesInMakerToken.times(orderToFeeRatio);
        const partiallyFillableFeeTokenAmount = fillableTimesInFeeToken.times(orderToFeeRatio);
        return BigNumber.min(partiallyFillableMakerTokenAmount, partiallyFillableFeeTokenAmount);
    }
}
