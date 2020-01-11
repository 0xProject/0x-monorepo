import { ReferenceFunctions } from '@0x/contracts-utils';
import { FillResults, MatchedFillResults, Order } from '@0x/types';
import { BigNumber, LibMathRevertErrors } from '@0x/utils';

const { safeAdd, safeSub, safeMul, safeDiv } = ReferenceFunctions;

/**
 * Checks if rounding error >= 0.1% when rounding down.
 */
export function isRoundingErrorFloor(numerator: BigNumber, denominator: BigNumber, target: BigNumber): boolean {
    if (denominator.eq(0)) {
        throw new LibMathRevertErrors.DivisionByZeroError();
    }
    if (numerator.eq(0) || target.eq(0)) {
        return false;
    }
    const remainder = numerator.times(target).mod(denominator);
    // Need to do this separately because solidity evaluates RHS of the comparison expression first.
    const rhs = safeMul(numerator, target);
    const lhs = safeMul(remainder, new BigNumber(1000));
    return lhs.gte(rhs);
}

/**
 * Checks if rounding error >= 0.1% when rounding up.
 */
export function isRoundingErrorCeil(numerator: BigNumber, denominator: BigNumber, target: BigNumber): boolean {
    if (denominator.eq(0)) {
        throw new LibMathRevertErrors.DivisionByZeroError();
    }
    if (numerator.eq(0) || target.eq(0)) {
        return false;
    }
    let remainder = numerator.times(target).mod(denominator);
    remainder = safeSub(denominator, remainder).mod(denominator);
    // Need to do this separately because solidity evaluates RHS of the comparison expression first.
    const rhs = safeMul(numerator, target);
    const lhs = safeMul(remainder, new BigNumber(1000));
    return lhs.gte(rhs);
}

/**
 * Calculates partial value given a numerator and denominator rounded down.
 *      Reverts if rounding error is >= 0.1%
 */
export function safeGetPartialAmountFloor(numerator: BigNumber, denominator: BigNumber, target: BigNumber): BigNumber {
    if (isRoundingErrorFloor(numerator, denominator, target)) {
        throw new LibMathRevertErrors.RoundingError(numerator, denominator, target);
    }
    return safeDiv(safeMul(numerator, target), denominator);
}

/**
 * Calculates partial value given a numerator and denominator rounded down.
 *      Reverts if rounding error is >= 0.1%
 */
export function safeGetPartialAmountCeil(numerator: BigNumber, denominator: BigNumber, target: BigNumber): BigNumber {
    if (isRoundingErrorCeil(numerator, denominator, target)) {
        throw new LibMathRevertErrors.RoundingError(numerator, denominator, target);
    }
    return safeDiv(safeAdd(safeMul(numerator, target), safeSub(denominator, new BigNumber(1))), denominator);
}

/**
 * Calculates partial value given a numerator and denominator rounded down.
 */
export function getPartialAmountFloor(numerator: BigNumber, denominator: BigNumber, target: BigNumber): BigNumber {
    return safeDiv(safeMul(numerator, target), denominator);
}

/**
 * Calculates partial value given a numerator and denominator rounded down.
 */
export function getPartialAmountCeil(numerator: BigNumber, denominator: BigNumber, target: BigNumber): BigNumber {
    const sub = safeSub(denominator, new BigNumber(1)); // This is computed first to simulate Solidity's order of operations
    return safeDiv(safeAdd(safeMul(numerator, target), sub), denominator);
}

/**
 * Adds properties of two `FillResults`.
 */
export function addFillResults(a: FillResults, b: FillResults): FillResults {
    return {
        makerAssetFilledAmount: safeAdd(a.makerAssetFilledAmount, b.makerAssetFilledAmount),
        takerAssetFilledAmount: safeAdd(a.takerAssetFilledAmount, b.takerAssetFilledAmount),
        makerFeePaid: safeAdd(a.makerFeePaid, b.makerFeePaid),
        takerFeePaid: safeAdd(a.takerFeePaid, b.takerFeePaid),
        protocolFeePaid: safeAdd(a.protocolFeePaid, b.protocolFeePaid),
    };
}

/**
 * Calculates amounts filled and fees paid by maker and taker.
 */
export function calculateFillResults(
    order: Order,
    takerAssetFilledAmount: BigNumber,
    protocolFeeMultiplier: BigNumber,
    gasPrice: BigNumber,
): FillResults {
    const makerAssetFilledAmount = safeGetPartialAmountFloor(
        takerAssetFilledAmount,
        order.takerAssetAmount,
        order.makerAssetAmount,
    );
    const makerFeePaid = safeGetPartialAmountFloor(takerAssetFilledAmount, order.takerAssetAmount, order.makerFee);
    const takerFeePaid = safeGetPartialAmountFloor(takerAssetFilledAmount, order.takerAssetAmount, order.takerFee);
    return {
        makerAssetFilledAmount,
        takerAssetFilledAmount,
        makerFeePaid,
        takerFeePaid,
        protocolFeePaid: safeMul(protocolFeeMultiplier, gasPrice),
    };
}

/**
 * Calculates amounts filled and fees paid by maker and taker.
 */
export function calculateMatchResults(
    leftOrder: Order,
    rightOrder: Order,
    protocolFeeMultiplier: BigNumber,
    gasPrice: BigNumber,
    withMaximalFill: boolean = false,
): MatchedFillResults {
    // Initialize empty fill results.
    const leftFillResults: FillResults = {
        makerAssetFilledAmount: new BigNumber(0),
        takerAssetFilledAmount: new BigNumber(0),
        makerFeePaid: new BigNumber(0),
        takerFeePaid: new BigNumber(0),
        protocolFeePaid: new BigNumber(0),
    };
    const rightFillResults: FillResults = {
        makerAssetFilledAmount: new BigNumber(0),
        takerAssetFilledAmount: new BigNumber(0),
        makerFeePaid: new BigNumber(0),
        takerFeePaid: new BigNumber(0),
        protocolFeePaid: new BigNumber(0),
    };
    let profitInLeftMakerAsset = new BigNumber(0);
    let profitInRightMakerAsset = new BigNumber(0);

    // Assert matchable
    if (
        leftOrder.makerAssetAmount
            .times(rightOrder.makerAssetAmount)
            .lt(leftOrder.takerAssetAmount.times(rightOrder.takerAssetAmount))
    ) {
        throw new Error(
            `Orders Cannot Be Matched.\nLeft Order: ${JSON.stringify(leftOrder, null, 4)}\Right Order: ${JSON.stringify(
                rightOrder,
                null,
                4,
            )}`,
        );
    }

    // Asset Transfer Amounts
    if (leftOrder.takerAssetAmount.gt(rightOrder.makerAssetAmount)) {
        leftFillResults.makerAssetFilledAmount = leftOrder.makerAssetAmount
            .multipliedBy(rightOrder.makerAssetAmount)
            .dividedToIntegerBy(leftOrder.takerAssetAmount);
        leftFillResults.takerAssetFilledAmount = rightOrder.makerAssetAmount;
        rightFillResults.makerAssetFilledAmount = rightOrder.makerAssetAmount;
        rightFillResults.takerAssetFilledAmount = rightOrder.takerAssetAmount;
    } else if (withMaximalFill && leftOrder.makerAssetAmount.lt(rightOrder.takerAssetAmount)) {
        leftFillResults.makerAssetFilledAmount = leftOrder.makerAssetAmount;
        leftFillResults.takerAssetFilledAmount = leftOrder.takerAssetAmount;
        rightFillResults.makerAssetFilledAmount = safeGetPartialAmountFloor(
            rightOrder.makerAssetAmount,
            rightOrder.takerAssetAmount,
            leftOrder.makerAssetAmount,
        );
        rightFillResults.takerAssetFilledAmount = leftOrder.makerAssetAmount;
    } else if (!withMaximalFill && leftOrder.takerAssetAmount.lt(rightOrder.makerAssetAmount)) {
        leftFillResults.makerAssetFilledAmount = leftOrder.makerAssetAmount;
        leftFillResults.takerAssetFilledAmount = leftOrder.takerAssetAmount;
        rightFillResults.makerAssetFilledAmount = leftOrder.takerAssetAmount;
        rightFillResults.takerAssetFilledAmount = safeGetPartialAmountCeil(
            rightOrder.takerAssetAmount,
            rightOrder.makerAssetAmount,
            leftOrder.takerAssetAmount,
        );
    } else {
        leftFillResults.makerAssetFilledAmount = leftOrder.makerAssetAmount;
        leftFillResults.takerAssetFilledAmount = leftOrder.takerAssetAmount;
        rightFillResults.makerAssetFilledAmount = rightOrder.makerAssetAmount;
        rightFillResults.takerAssetFilledAmount = rightOrder.takerAssetAmount;
    }

    // Profit
    profitInLeftMakerAsset = leftFillResults.makerAssetFilledAmount.minus(rightFillResults.makerAssetFilledAmount);
    profitInRightMakerAsset = rightFillResults.makerAssetFilledAmount.minus(leftFillResults.makerAssetFilledAmount);

    // Fees
    leftFillResults.makerFeePaid = safeGetPartialAmountFloor(
        leftFillResults.makerAssetFilledAmount,
        leftOrder.makerAssetAmount,
        leftOrder.makerFee,
    );
    leftFillResults.takerFeePaid = safeGetPartialAmountFloor(
        leftFillResults.takerAssetFilledAmount,
        leftOrder.takerAssetAmount,
        leftOrder.takerFee,
    );
    rightFillResults.makerFeePaid = safeGetPartialAmountFloor(
        rightFillResults.makerAssetFilledAmount,
        rightOrder.makerAssetAmount,
        rightOrder.makerFee,
    );
    rightFillResults.takerFeePaid = safeGetPartialAmountFloor(
        rightFillResults.takerAssetFilledAmount,
        rightOrder.takerAssetAmount,
        rightOrder.takerFee,
    );

    // Protocol Fee
    leftFillResults.protocolFeePaid = safeMul(protocolFeeMultiplier, gasPrice);
    rightFillResults.protocolFeePaid = safeMul(protocolFeeMultiplier, gasPrice);

    return {
        left: leftFillResults,
        right: rightFillResults,
        profitInLeftMakerAsset,
        profitInRightMakerAsset,
    };
}

export const LibFractions = {
    add: (n1: BigNumber, d1: BigNumber, n2: BigNumber, d2: BigNumber): [BigNumber, BigNumber] => {
        if (n1.isZero()) {
            return [n2, d2];
        }
        if (n2.isZero()) {
            return [n1, d1];
        }
        const numerator = safeAdd(safeMul(n1, d2), safeMul(n2, d1));
        const denominator = safeMul(d1, d2);
        return [numerator, denominator];
    },
    normalize: (
        numerator: BigNumber,
        denominator: BigNumber,
        maxValue: BigNumber = new BigNumber(2).exponentiatedBy(127),
    ): [BigNumber, BigNumber] => {
        if (numerator.isGreaterThan(maxValue) || denominator.isGreaterThan(maxValue)) {
            let rescaleBase = numerator.isGreaterThanOrEqualTo(denominator) ? numerator : denominator;
            rescaleBase = safeDiv(rescaleBase, maxValue);
            return [safeDiv(numerator, rescaleBase), safeDiv(denominator, rescaleBase)];
        } else {
            return [numerator, denominator];
        }
    },
};
