import { ReferenceFunctions as ExchangeLibsReferenceFunctions } from '@0x/contracts-exchange-libs';
import { constants } from '@0x/contracts-test-utils';
import { ReferenceFunctions as UtilsReferenceFunctions } from '@0x/contracts-utils';
import { FillResults, MatchedFillResults, OrderWithoutDomain } from '@0x/types';
import { BigNumber } from '@0x/utils';

const { safeGetPartialAmountCeil, safeGetPartialAmountFloor } = ExchangeLibsReferenceFunctions;
const { safeSub } = UtilsReferenceFunctions;

/**
 * Calculates amounts filled and fees paid by maker and taker.
 */
export function calculateFillResults(order: OrderWithoutDomain, takerAssetFilledAmount: BigNumber): FillResults {
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
    };
}

/**
 * Calculates amounts filled and fees paid by maker and taker.
 */
export function calculateMatchedFillResults(
    leftOrder: OrderWithoutDomain,
    rightOrder: OrderWithoutDomain,
    leftOrderTakerAssetFilledAmount: BigNumber,
    rightOrderTakerAssetFilledAmount: BigNumber,
): MatchedFillResults {
    // Get an empty matched fill results object to fill with this data.
    const matchedFillResults = emptyMatchedFillResults();

    // Calculate the remaining amounts of maker and taker assets for both orders.
    const [
        leftMakerAssetAmountRemaining,
        leftTakerAssetAmountRemaining,
        rightMakerAssetAmountRemaining,
        rightTakerAssetAmountRemaining,
    ] = getRemainingFillAmounts(
        leftOrder,
        rightOrder,
        leftOrderTakerAssetFilledAmount,
        rightOrderTakerAssetFilledAmount,
    );

    // Calculate the profit from the matching
    matchedFillResults.profitInLeftMakerAsset = safeSub(
        matchedFillResults.left.makerAssetFilledAmount,
        matchedFillResults.right.takerAssetFilledAmount,
    );

    if (leftTakerAssetAmountRemaining.isGreaterThan(rightMakerAssetAmountRemaining)) {
        // Case 1: Right order is fully filled
        calculateCompleteRightFill(
            leftOrder,
            rightMakerAssetAmountRemaining,
            rightTakerAssetAmountRemaining,
            matchedFillResults,
        );
    } else if (leftTakerAssetAmountRemaining.isLessThan(rightMakerAssetAmountRemaining)) {
        // Case 2: Left order is fully filled
        matchedFillResults.left.makerAssetFilledAmount = leftMakerAssetAmountRemaining;
        matchedFillResults.left.takerAssetFilledAmount = leftTakerAssetAmountRemaining;
        matchedFillResults.right.makerAssetFilledAmount = leftTakerAssetAmountRemaining;
        matchedFillResults.right.takerAssetFilledAmount = safeGetPartialAmountCeil(
            rightOrder.takerAssetAmount,
            rightOrder.makerAssetAmount,
            leftTakerAssetAmountRemaining,
        );
    } else {
        // Case 3: Both orders are fully filled. Technically, this could be captured by the above cases, but
        //         this calculation will be more precise since it does not include rounding.
        calculateCompleteFillBoth(
            leftMakerAssetAmountRemaining,
            leftTakerAssetAmountRemaining,
            rightMakerAssetAmountRemaining,
            rightTakerAssetAmountRemaining,
            matchedFillResults,
        );
    }

    // Compute the fees from the order matching
    calculateFees(
        leftOrder,
        rightOrder,
        matchedFillResults,
    );

    return matchedFillResults;
}

/**
 * Calculates the complete fill of both orders and updates the provided MatchedFillResults object.
 */
export function calculateCompleteFillBoth(
    leftMakerAssetAmountRemaining: BigNumber,
    leftTakerAssetAmountRemaining: BigNumber,
    rightMakerAssetAmountRemaining: BigNumber,
    rightTakerAssetAmountRemaining: BigNumber,
    matchedFillResults?: MatchedFillResults,
): MatchedFillResults {
    if (matchedFillResults === undefined) {
        matchedFillResults = emptyMatchedFillResults(); // tslint:disable-line:no-parameter-reassignment
    }
    matchedFillResults.left.makerAssetFilledAmount = leftMakerAssetAmountRemaining;
    matchedFillResults.left.takerAssetFilledAmount = leftTakerAssetAmountRemaining;
    matchedFillResults.right.makerAssetFilledAmount = rightMakerAssetAmountRemaining;
    matchedFillResults.right.takerAssetFilledAmount = rightTakerAssetAmountRemaining;
    return matchedFillResults;
}

/**
 * Calculates the complete fill of the right order and updates the provided MatchedFillResults object.
 */
export function calculateCompleteRightFill(
    leftOrder: OrderWithoutDomain,
    rightMakerAssetAmountRemaining: BigNumber,
    rightTakerAssetAmountRemaining: BigNumber,
    matchedFillResults?: MatchedFillResults,
): MatchedFillResults {
    if (matchedFillResults === undefined) {
        matchedFillResults = emptyMatchedFillResults(); // tslint:disable-line:no-parameter-reassignment
    }
    matchedFillResults.left.makerAssetFilledAmount = safeGetPartialAmountFloor(
        leftOrder.makerAssetAmount,
        leftOrder.takerAssetAmount,
        rightMakerAssetAmountRemaining,
    );
    matchedFillResults.left.takerAssetFilledAmount = rightMakerAssetAmountRemaining;
    matchedFillResults.right.makerAssetFilledAmount = rightMakerAssetAmountRemaining;
    matchedFillResults.right.takerAssetFilledAmount = rightTakerAssetAmountRemaining;
    return matchedFillResults;
}

/**
 * Compute the fees for the left and right orders.
 */
function calculateFees(
    leftOrder: OrderWithoutDomain,
    rightOrder: OrderWithoutDomain,
    matchedFillResults: MatchedFillResults,
): void {
    // Compute fees for left order
    matchedFillResults.left.makerFeePaid = safeGetPartialAmountFloor(
        matchedFillResults.left.makerAssetFilledAmount,
        leftOrder.makerAssetAmount,
        leftOrder.makerFee,
    );
    matchedFillResults.left.takerFeePaid = safeGetPartialAmountFloor(
        matchedFillResults.left.takerAssetFilledAmount,
        leftOrder.takerAssetAmount,
        leftOrder.takerFee,
    );

    // Compute fees for right order
    matchedFillResults.right.makerFeePaid = safeGetPartialAmountFloor(
        matchedFillResults.right.makerAssetFilledAmount,
        rightOrder.makerAssetAmount,
        rightOrder.makerFee,
    );
    matchedFillResults.right.takerFeePaid = safeGetPartialAmountFloor(
        matchedFillResults.right.takerAssetFilledAmount,
        rightOrder.takerAssetAmount,
        rightOrder.takerFee,
    );
}

/**
 * Returns an empty fill results object.
 */
function emptyFillResults(): FillResults {
    return {
        makerAssetFilledAmount: constants.ZERO_AMOUNT,
        takerAssetFilledAmount: constants.ZERO_AMOUNT,
        makerFeePaid: constants.ZERO_AMOUNT,
        takerFeePaid: constants.ZERO_AMOUNT,
    };
}

/**
 * Returns an empty matched fill results object.
 */
function emptyMatchedFillResults(): MatchedFillResults {
    return {
        left: emptyFillResults(),
        right: emptyFillResults(),
        profitInLeftMakerAsset: constants.ZERO_AMOUNT,
        profitInRightMakerAsset: constants.ZERO_AMOUNT,
    };
}

/**
 * Returns the token amounts that are remaining to be filled.
 */
function getRemainingFillAmounts(
    leftOrder: OrderWithoutDomain,
    rightOrder: OrderWithoutDomain,
    leftOrderTakerAssetFilledAmount: BigNumber,
    rightOrderTakerAssetFilledAmount: BigNumber,
): [ BigNumber, BigNumber, BigNumber, BigNumber ] {
    return [
        safeGetPartialAmountFloor(
            leftOrder.makerAssetAmount,
            leftOrder.takerAssetAmount,
            leftOrderTakerAssetFilledAmount
        ),
        safeSub(leftOrder.takerAssetAmount, leftOrderTakerAssetFilledAmount),
        safeGetPartialAmountFloor(
            rightOrder.makerAssetAmount,
            rightOrder.takerAssetAmount,
            rightOrderTakerAssetFilledAmount
        ),
        safeSub(rightOrder.takerAssetAmount, rightOrderTakerAssetFilledAmount),
    ];
}
