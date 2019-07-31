import { constants, FillResults } from '@0x/contracts-test-utils';
import { LibMathRevertErrors } from '@0x/order-utils';
import { OrderWithoutDomain } from '@0x/types';
import { AnyRevertError, BigNumber, SafeMathRevertErrors } from '@0x/utils';

const { MAX_UINT256 } = constants;

export function isRoundingErrorFloor(
    numerator: BigNumber,
    denominator: BigNumber,
    target: BigNumber,
): boolean {
    if (denominator.eq(0)) {
        throw new LibMathRevertErrors.DivisionByZeroError();
    }
    if (numerator.eq(0)) {
        return false;
    }
    if (target.eq(0)) {
        return false;
    }
    const product = numerator.multipliedBy(target);
    const remainder = product.mod(denominator);
    const remainderTimes1000 = remainder.multipliedBy('1000');
    const isError = remainderTimes1000.gte(product);
    if (remainderTimes1000.isGreaterThan(MAX_UINT256)) {
        // Solidity implementation won't actually throw.
        throw new AnyRevertError();
    }
    return isError;
}

export function IsRoundingErrorCeil(
    numerator: BigNumber,
    denominator: BigNumber,
    target: BigNumber,
): boolean {
    if (denominator.eq(0)) {
        throw new LibMathRevertErrors.DivisionByZeroError();
    }
    if (numerator.eq(0)) {
        return false;
    }
    if (target.eq(0)) {
        return false;
    }
    const product = numerator.multipliedBy(target);
    const remainder = product.mod(denominator);
    const error = denominator.minus(remainder).mod(denominator);
    const errorTimes1000 = error.multipliedBy('1000');
    const isError = errorTimes1000.gte(product);
    if (errorTimes1000.isGreaterThan(MAX_UINT256)) {
        // Solidity implementation won't actually throw.
        throw new AnyRevertError();
    }
    return isError;
}

export function safeGetPartialAmountFloor(
    numerator: BigNumber,
    denominator: BigNumber,
    target: BigNumber,
): BigNumber {
    if (denominator.eq(0)) {
        throw new LibMathRevertErrors.DivisionByZeroError();
    }
    const isRoundingError = isRoundingErrorFloor(numerator, denominator, target);
    if (isRoundingError) {
        throw new LibMathRevertErrors.RoundingError(numerator, denominator, target);
    }
    const product = numerator.multipliedBy(target);
    if (product.isGreaterThan(MAX_UINT256)) {
        throw new SafeMathRevertErrors.SafeMathError(
            SafeMathRevertErrors.SafeMathErrorCodes.Uint256MultiplicationOverflow,
            numerator,
            denominator,
        );
    }
    return product.dividedToIntegerBy(denominator);
}

export function calculateFillResults(
    order: OrderWithoutDomain,
    takerAssetFilledAmount: BigNumber,
): FillResults {
    const makerAssetFilledAmount = safeGetPartialAmountFloor(
        takerAssetFilledAmount,
        order.takerAssetAmount,
        order.makerAssetAmount,
    );
    const makerFeePaid = safeGetPartialAmountFloor(
        makerAssetFilledAmount,
        order.makerAssetAmount,
        order.makerFee,
    );
    const takerFeePaid = safeGetPartialAmountFloor(
        takerAssetFilledAmount,
        order.takerAssetAmount,
        order.takerFee,
    );
    return {
        makerAssetFilledAmount,
        takerAssetFilledAmount,
        makerFeePaid,
        takerFeePaid,
    };
}
