import { DevUtilsContract } from '@0x/contract-wrappers';
import { orderCalculationUtils } from '@0x/order-utils';
import { OrderStatus, SignedOrder } from '@0x/types';

import { constants } from '../constants';
import { OrderPrunerOnChainMetadata, SignedOrderWithFillableAmounts } from '../types';

/**
 * Utility class to retrieve order state if needed outside of using the ERC20BridgeSampler
 */
export class OrderStateUtils {
    private readonly _devUtils: DevUtilsContract;

    constructor(devUtils: DevUtilsContract) {
        this._devUtils = devUtils;
    }

    public async getSignedOrdersWithFillableAmountsAsync(
        signedOrders: SignedOrder[],
    ): Promise<SignedOrderWithFillableAmounts[]> {
        const signatures = signedOrders.map(o => o.signature);
        const [ordersInfo, fillableTakerAssetAmounts, isValidSignatures] = await this._devUtils
            .getOrderRelevantStates(signedOrders, signatures)
            .callAsync();
        const ordersOnChainMetadata: OrderPrunerOnChainMetadata[] = ordersInfo.map((orderInfo, index) => {
            return {
                ...orderInfo,
                fillableTakerAssetAmount: fillableTakerAssetAmounts[index],
                isValidSignature: isValidSignatures[index],
            };
        });
        // take orders + on chain information and find the valid orders and fillable makerAsset or takerAsset amounts
        return signedOrders.map(
            (order: SignedOrder, index: number): SignedOrderWithFillableAmounts => {
                const orderMetadata = ordersOnChainMetadata[index];
                const fillableTakerAssetAmount =
                    orderMetadata.isValidSignature && orderMetadata.orderStatus === OrderStatus.Fillable
                        ? orderMetadata.fillableTakerAssetAmount
                        : constants.ZERO_AMOUNT;
                return {
                    ...order,
                    fillableTakerAssetAmount,
                    fillableMakerAssetAmount: orderCalculationUtils.getMakerFillAmount(order, fillableTakerAssetAmount),
                    fillableTakerFeeAmount: orderCalculationUtils.getTakerFeeAmount(order, fillableTakerAssetAmount),
                };
            },
        );
    }
}
