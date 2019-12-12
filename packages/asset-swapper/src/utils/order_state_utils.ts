import { DevUtilsContract } from '@0x/contract-wrappers';
import { orderCalculationUtils } from '@0x/order-utils';
import { OrderStatus, SignedOrder } from '@0x/types';
import * as _ from 'lodash';

import { OrderPrunerOnChainMetadata, SignedOrderWithFillableAmounts } from '../types';

export class OrderStateUtils {
    private readonly _devUtils: DevUtilsContract;

    constructor(devUtils: DevUtilsContract) {
        this._devUtils = devUtils;
    }

    public async getSignedOrdersWithFillableAmountsAsync(signedOrders: SignedOrder[]): Promise<SignedOrderWithFillableAmounts[]> {
        const signatures = _.map(signedOrders, o => o.signature);
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
        return this._filterForFillableOrders(signedOrders, ordersOnChainMetadata);
    }

    // tslint:disable-next-line: prefer-function-over-method
    private _filterForFillableOrders(
        orders: SignedOrder[],
        ordersOnChainMetadata: OrderPrunerOnChainMetadata[],
    ): SignedOrderWithFillableAmounts[] {
        const result = _.chain(orders)
            .filter(
                (order: SignedOrder, index: number): boolean => {
                    const { isValidSignature, orderStatus } = ordersOnChainMetadata[index];
                    return (
                        isValidSignature &&
                        orderStatus === OrderStatus.Fillable
                    );
                },
            )
            .map(
                (order: SignedOrder, index: number): SignedOrderWithFillableAmounts => {
                    const { fillableTakerAssetAmount } = ordersOnChainMetadata[index];
                    return {
                        ...order,
                        fillableTakerAssetAmount,
                        fillableMakerAssetAmount: orderCalculationUtils.getMakerFillAmount(
                            order,
                            fillableTakerAssetAmount,
                        ),
                        fillableTakerFeeAmount: orderCalculationUtils.getTakerFeeAmount(
                            order,
                            fillableTakerAssetAmount,
                        ),
                    };
                },
            )
            .value();
        return result;
    }
}
