import {BigNumber} from 'bignumber.js';

import {SignedOrder} from '../types';

export class RemainingFillableCalculator {
    private signedOrder: SignedOrder;
    private isMakerTokenZRX: boolean;
    // Transferrable Amount is the minimum of Approval and Balance
    private transferrableMakerTokenAmount: BigNumber;
    private transferrableMakerFeeTokenAmount: BigNumber;
    private remainingMakerTokenAmount: BigNumber;
    private remainingMakerFeeAmount: BigNumber;
    constructor(signedOrder: SignedOrder,
                isMakerTokenZRX: boolean,
                transferrableMakerTokenAmount: BigNumber,
                transferrableMakerFeeTokenAmount: BigNumber,
                remainingMakerTokenAmount: BigNumber) {
        this.signedOrder = signedOrder;
        this.isMakerTokenZRX = isMakerTokenZRX;
        this.transferrableMakerTokenAmount = transferrableMakerTokenAmount;
        this.transferrableMakerFeeTokenAmount = transferrableMakerFeeTokenAmount;
        this.remainingMakerTokenAmount = remainingMakerTokenAmount;
        this.remainingMakerFeeAmount = remainingMakerTokenAmount.times(signedOrder.makerFee)
                                                                .dividedToIntegerBy(signedOrder.makerTokenAmount);
    }
    public computeRemainingMakerFillable(): BigNumber {
        if (this.hasSufficientFundsForFeeAndTransferAmount()) {
            return this.remainingMakerTokenAmount;
        }
        if (this.signedOrder.makerFee.isZero()) {
            return BigNumber.min(this.remainingMakerTokenAmount, this.transferrableMakerTokenAmount);
        }
        return this.calculatePartiallyFillableMakerTokenAmount();
    }
    public computeRemainingTakerFillable(): BigNumber {
        return this.computeRemainingMakerFillable().times(this.signedOrder.takerTokenAmount)
                                                   .dividedToIntegerBy(this.signedOrder.makerTokenAmount);
    }
    private hasSufficientFundsForFeeAndTransferAmount(): boolean {
        if (this.isMakerTokenZRX) {
            const totalZRXTransferAmountRequired = this.remainingMakerTokenAmount.plus(this.remainingMakerFeeAmount);
            const hasSufficientFunds = this.transferrableMakerTokenAmount.greaterThanOrEqualTo(
                                                                            totalZRXTransferAmountRequired);
            return hasSufficientFunds;
        } else {
            const hasSufficientFundsForTransferAmount = this.transferrableMakerTokenAmount.greaterThanOrEqualTo(
                                                            this.remainingMakerTokenAmount);
            const hasSufficientFundsForFeeAmount = this.transferrableMakerFeeTokenAmount.greaterThanOrEqualTo(
                                                       this.remainingMakerFeeAmount);
            const hasSufficientFunds = hasSufficientFundsForTransferAmount && hasSufficientFundsForFeeAmount;
            return hasSufficientFunds;
        }
    }
    private calculatePartiallyFillableMakerTokenAmount(): BigNumber {
        // Given an order for 200 wei for 2 ZRXwei fee, find 100 wei for 1 ZRXwei. Order ratio is then 100:1
        const orderToFeeRatio = this.signedOrder.makerTokenAmount.dividedBy(this.signedOrder.makerFee);
        // The number of times the maker can fill the order, if each fill only required the transfer of a single
        // baseUnit of fee tokens.
        // Given 2 ZRXwei, the maximum amount of times Maker can fill this order, in terms of fees, is 2
        const fillableTimesInFeeTokenBaseUnits = BigNumber.min(this.transferrableMakerFeeTokenAmount,
                                                               this.remainingMakerFeeAmount);
        // The number of times the Maker can fill the order, given the Maker Token Balance
        // Assuming a balance of 150 wei, and an orderToFeeRatio of 100:1, maker can fill this order 1 time.
        let fillableTimesInMakerTokenUnits = this.transferrableMakerTokenAmount.dividedBy(orderToFeeRatio);
        if (this.isMakerTokenZRX) {
            // If ZRX is the maker token, the Fee and the Maker amount need to be removed from the same pool;
            // 200 ZRXwei for 2ZRXwei fee can only be filled once (need 202 ZRXwei)
            const totalZRXTokenPooled = this.transferrableMakerTokenAmount;
            // The purchasing power here is less as the tokens are taken from the same Pool
            // For every one number of fills, we have to take an extra ZRX out of the pool
            fillableTimesInMakerTokenUnits = totalZRXTokenPooled.dividedBy(
                                                                     orderToFeeRatio.plus(new BigNumber(1)));

        }
        // When Ratio is not fully divisible there can be remainders which cannot be represented, so they are floored.
        // This can result in a RoundingError being thrown by the Exchange Contract.
        const partiallyFillableMakerTokenAmount = fillableTimesInMakerTokenUnits
                                                     .times(this.signedOrder.makerTokenAmount)
                                                     .dividedToIntegerBy(this.signedOrder.makerFee);
        const partiallyFillableFeeTokenAmount = fillableTimesInFeeTokenBaseUnits
                                                     .times(this.signedOrder.makerTokenAmount)
                                                     .dividedToIntegerBy(this.signedOrder.makerFee);
        const partiallyFillableAmount = BigNumber.min(partiallyFillableMakerTokenAmount,
                                                      partiallyFillableFeeTokenAmount);
        return partiallyFillableAmount;
    }
}
