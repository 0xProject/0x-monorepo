import { ReferenceFunctions } from '@0x/contracts-utils';
import { FillResults, Order } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { LibMathRevertErrors } from '.';

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
    const makerFeePaid = safeGetPartialAmountFloor(makerAssetFilledAmount, order.makerAssetAmount, order.makerFee);
    const takerFeePaid = safeGetPartialAmountFloor(takerAssetFilledAmount, order.takerAssetAmount, order.takerFee);
    return {
        makerAssetFilledAmount,
        takerAssetFilledAmount,
        makerFeePaid,
        takerFeePaid,
        protocolFeePaid: safeMul(protocolFeeMultiplier, gasPrice),
    };
}
