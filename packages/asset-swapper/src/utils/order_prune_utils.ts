import { DevUtilsContract, OrderStatus } from '@0x/contract-wrappers';
import { orderCalculationUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    OrderPrunerOpts,
    PrunedSignedOrder,
} from '../types';
import { utils } from '../utils/utils';

export class OrderPruner {
    public readonly expiryBufferMs: number;

    private readonly _devUtils: DevUtilsContract;

    // TODO(dave4506): OrderPruneCalculator can be more powerful if it takes in a specified takerAddress
    constructor(devUtils: DevUtilsContract, opts: OrderPrunerOpts ) {
        this.expiryBufferMs = opts.expiryBufferMs;
        this._devUtils = devUtils;
    }

    public async pruneSignedOrdersAsync(signedOrders: SignedOrder[]): Promise<PrunedSignedOrder[]> {
        const unsortedOrders = this._filterForUsableOrders(
            signedOrders,
            this.expiryBufferMs / constants.ONE_SECOND_MS,
        );

        const signatures = _.map(unsortedOrders, o => o.signature);
        const [ordersInfo, remainingTakerAssetAmounts, isValidSignatures ] = await this._devUtils.getOrderRelevantStates.callAsync(
            unsortedOrders,
            signatures,
        );
        const ordersOnChainMetadata: any[] = ordersInfo.map((orderInfo, index) => {
            return {
                ...orderInfo,
                remainingTakerAssetAmount: remainingTakerAssetAmounts[index],
                isValidSignature: isValidSignatures[index],
            };
        });
        // take orders + on chain information and find the valid orders and remaining fillable maker asset amounts
        const prunedOrders = this._filterForFillableAndValidOrders(unsortedOrders, ordersOnChainMetadata);

        return prunedOrders;
    }

    // tslint:disable-next-line: prefer-function-over-method
    private _filterForFillableAndValidOrders(
        orders: SignedOrder[],
        ordersOnChainMetadata: any[],
    ): PrunedSignedOrder[] {
        const result = _.chain(orders).filter((order: SignedOrder, index: number): boolean => {
            const { isValidSignature, orderStatus, remainingTakerAssetAmount } = ordersOnChainMetadata[index];
            return isValidSignature &&
            orderStatus === OrderStatus.Fillable &&
            remainingTakerAssetAmount.gt(constants.ZERO_AMOUNT)
            && utils.isOrderTakerFeePayableWithMakerAsset(order);
        }).map((order: SignedOrder, index: number): PrunedSignedOrder => {
            const { remainingTakerAssetAmount } = ordersOnChainMetadata[index];
            return {
                ...order,
                remainingTakerAssetAmount,
                remainingMakerAssetAmount: orderCalculationUtils.getMakerFillAmount(order, remainingTakerAssetAmount),
                remainingTakerFee: orderCalculationUtils.getTakerFeeAmount(order, remainingTakerAssetAmount),
            };
        }).value();
        return result;
    }

    // tslint:disable-next-line: prefer-function-over-method
    private _filterForUsableOrders(
        orders: SignedOrder[],
        expiryBufferMs: number,
    ): SignedOrder[] {
        const result = _.filter(orders, order => {
            return (
                orderCalculationUtils.isOpenOrder(order) &&
                utils.isOrderTakerFeePayableWithMakerAsset(order) &&
                !orderCalculationUtils.willOrderExpire(order, expiryBufferMs / constants.ONE_SECOND_MS)
            );
        });
        return result;
    }
}
