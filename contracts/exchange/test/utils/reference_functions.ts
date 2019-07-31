import { ReferenceFunctions as ExchangeLibsReferenceFunctions } from '@0x/contracts-exchange-libs';
import { FillResults, OrderWithoutDomain } from '@0x/types';
import { BigNumber } from '@0x/utils';

const { safeGetPartialAmountFloor } = ExchangeLibsReferenceFunctions;

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
