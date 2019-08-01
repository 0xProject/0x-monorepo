import { ReferenceFunctions } from '@0x/contracts-utils';
import { LibMathRevertErrors } from '@0x/order-utils';
import { FillResults } from '@0x/types';
import { BigNumber } from '@0x/utils';

const {
    safeAdd,
    safeSub,
    safeMul,
    safeDiv,
} = ReferenceFunctions;

export function isRoundingErrorFloor(
    numerator: BigNumber,
    denominator: BigNumber,
    target: BigNumber,
): boolean {
    if (denominator.eq(0)) {
        throw new LibMathRevertErrors.DivisionByZeroError();
    }
    if (numerator.eq(0) || target.eq(0)) {
        return false;
    }
    const remainder = numerator.times(target).mod(denominator);
    // Need to do this separately because solidity evaluates RHS of the comparison expression first.
    const rhs = safeMul(numerator, target);
    const lhs = safeMul(new BigNumber(1000), remainder);
    return lhs.gte(rhs);
}

export function isRoundingErrorCeil(
    numerator: BigNumber,
    denominator: BigNumber,
    target: BigNumber,
): boolean {
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
    const lhs = safeMul(new BigNumber(1000), remainder);
    return lhs.gte(rhs);
}

export function safeGetPartialAmountFloor(
    numerator: BigNumber,
    denominator: BigNumber,
    target: BigNumber,
): BigNumber {
    if (isRoundingErrorFloor(numerator, denominator, target)) {
        throw new LibMathRevertErrors.RoundingError(numerator, denominator, target);
    }
    return safeDiv(
        safeMul(numerator, target),
        denominator,
    );
}

export function safeGetPartialAmountCeil(
    numerator: BigNumber,
    denominator: BigNumber,
    target: BigNumber,
): BigNumber {
    if (isRoundingErrorCeil(numerator, denominator, target)) {
        throw new LibMathRevertErrors.RoundingError(numerator, denominator, target);
    }
    return safeDiv(
        safeAdd(
            safeMul(numerator, target),
            safeSub(denominator, new BigNumber(1)),
        ),
        denominator,
    );
}

export function getPartialAmountFloor(
    numerator: BigNumber,
    denominator: BigNumber,
    target: BigNumber,
): BigNumber {
    return safeDiv(
        safeMul(numerator, target),
        denominator,
    );
}

export function getPartialAmountCeil(
    numerator: BigNumber,
    denominator: BigNumber,
    target: BigNumber,
): BigNumber {
    return safeDiv(
        safeAdd(
            safeMul(numerator, target),
            safeSub(denominator, new BigNumber(1)),
        ),
        denominator,
    );
}

export function addFillResults(
    a: FillResults,
    b: FillResults,
): FillResults {
    return {
        makerAssetFilledAmount: safeAdd(a.makerAssetFilledAmount, b.makerAssetFilledAmount),
        takerAssetFilledAmount: safeAdd(a.takerAssetFilledAmount, b.takerAssetFilledAmount),
        makerFeePaid: safeAdd(a.makerFeePaid, b.makerFeePaid),
        takerFeePaid: safeAdd(a.takerFeePaid, b.takerFeePaid),
    };
}
