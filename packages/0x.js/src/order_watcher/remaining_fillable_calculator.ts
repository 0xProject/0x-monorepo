import { BigNumber } from '@0xproject/utils';

import { SignedOrder } from '../types';

export class RemainingFillableCalculator {
    private _signedOrder: SignedOrder;
    private _isMakerTokenZRX: boolean;
    // Transferrable Amount is the minimum of Approval and Balance
    private _transferrableMakerTokenAmount: BigNumber;
    private _transferrableMakerFeeTokenAmount: BigNumber;
    private _remainingMakerTokenAmount: BigNumber;
    private _remainingMakerFeeAmount: BigNumber;
    constructor(
        signedOrder: SignedOrder,
        isMakerTokenZRX: boolean,
        transferrableMakerTokenAmount: BigNumber,
        transferrableMakerFeeTokenAmount: BigNumber,
        remainingMakerTokenAmount: BigNumber,
    ) {
        this._signedOrder = signedOrder;
        this._isMakerTokenZRX = isMakerTokenZRX;
        this._transferrableMakerTokenAmount = transferrableMakerTokenAmount;
        this._transferrableMakerFeeTokenAmount = transferrableMakerFeeTokenAmount;
        this._remainingMakerTokenAmount = remainingMakerTokenAmount;
        this._remainingMakerFeeAmount = remainingMakerTokenAmount
            .times(signedOrder.makerFee)
            .dividedToIntegerBy(signedOrder.makerTokenAmount);
    }
    public computeRemainingMakerFillable(): BigNumber {
        if (this._hasSufficientFundsForFeeAndTransferAmount()) {
            return this._remainingMakerTokenAmount;
        }
        if (this._signedOrder.makerFee.isZero()) {
            return BigNumber.min(this._remainingMakerTokenAmount, this._transferrableMakerTokenAmount);
        }
        return this._calculatePartiallyFillableMakerTokenAmount();
    }
    public computeRemainingTakerFillable(): BigNumber {
        return this.computeRemainingMakerFillable()
            .times(this._signedOrder.takerTokenAmount)
            .dividedToIntegerBy(this._signedOrder.makerTokenAmount);
    }
    private _hasSufficientFundsForFeeAndTransferAmount(): boolean {
        if (this._isMakerTokenZRX) {
            const totalZRXTransferAmountRequired = this._remainingMakerTokenAmount.plus(this._remainingMakerFeeAmount);
            const hasSufficientFunds = this._transferrableMakerTokenAmount.greaterThanOrEqualTo(
                totalZRXTransferAmountRequired,
            );
            return hasSufficientFunds;
        } else {
            const hasSufficientFundsForTransferAmount = this._transferrableMakerTokenAmount.greaterThanOrEqualTo(
                this._remainingMakerTokenAmount,
            );
            const hasSufficientFundsForFeeAmount = this._transferrableMakerFeeTokenAmount.greaterThanOrEqualTo(
                this._remainingMakerFeeAmount,
            );
            const hasSufficientFunds = hasSufficientFundsForTransferAmount && hasSufficientFundsForFeeAmount;
            return hasSufficientFunds;
        }
    }
    private _calculatePartiallyFillableMakerTokenAmount(): BigNumber {
        // Given an order for 200 wei for 2 ZRXwei fee, find 100 wei for 1 ZRXwei. Order ratio is then 100:1
        const orderToFeeRatio = this._signedOrder.makerTokenAmount.dividedBy(this._signedOrder.makerFee);
        // The number of times the maker can fill the order, if each fill only required the transfer of a single
        // baseUnit of fee tokens.
        // Given 2 ZRXwei, the maximum amount of times Maker can fill this order, in terms of fees, is 2
        const fillableTimesInFeeTokenBaseUnits = BigNumber.min(
            this._transferrableMakerFeeTokenAmount,
            this._remainingMakerFeeAmount,
        );
        // The number of times the Maker can fill the order, given the Maker Token Balance
        // Assuming a balance of 150 wei, and an orderToFeeRatio of 100:1, maker can fill this order 1 time.
        let fillableTimesInMakerTokenUnits = this._transferrableMakerTokenAmount.dividedBy(orderToFeeRatio);
        if (this._isMakerTokenZRX) {
            // If ZRX is the maker token, the Fee and the Maker amount need to be removed from the same pool;
            // 200 ZRXwei for 2ZRXwei fee can only be filled once (need 202 ZRXwei)
            const totalZRXTokenPooled = this._transferrableMakerTokenAmount;
            // The purchasing power here is less as the tokens are taken from the same Pool
            // For every one number of fills, we have to take an extra ZRX out of the pool
            fillableTimesInMakerTokenUnits = totalZRXTokenPooled.dividedBy(orderToFeeRatio.plus(new BigNumber(1)));
        }
        // When Ratio is not fully divisible there can be remainders which cannot be represented, so they are floored.
        // This can result in a RoundingError being thrown by the Exchange Contract.
        const partiallyFillableMakerTokenAmount = fillableTimesInMakerTokenUnits
            .times(this._signedOrder.makerTokenAmount)
            .dividedToIntegerBy(this._signedOrder.makerFee);
        const partiallyFillableFeeTokenAmount = fillableTimesInFeeTokenBaseUnits
            .times(this._signedOrder.makerTokenAmount)
            .dividedToIntegerBy(this._signedOrder.makerFee);
        const partiallyFillableAmount = BigNumber.min(
            partiallyFillableMakerTokenAmount,
            partiallyFillableFeeTokenAmount,
        );
        return partiallyFillableAmount;
    }
}
