import { DevUtilsContract, OrderStatus } from '@0x/contract-wrappers';
import { orderCalculationUtils } from '@0x/order-utils';
import { SignedOrder } from '@0x/types';
import * as _ from 'lodash';

import { constants } from '../constants';
import {
    OrderPrunerOpts,
    OrderPrunerPermittedFeeTypes,
    PrunedSignedOrder,
} from '../types';
import { utils } from '../utils/utils';

export class OrderPruner {
    public readonly expiryBufferMs: number;
    public readonly permittedOrderFeeTypes: Set<OrderPrunerPermittedFeeTypes>;
    private readonly _devUtils: DevUtilsContract;

    // TODO(dave4506): OrderPruneCalculator can be more powerful if it takes in a specified takerAddress
    constructor(devUtils: DevUtilsContract, opts: OrderPrunerOpts ) {
        this.expiryBufferMs = opts.expiryBufferMs;
        this.permittedOrderFeeTypes = opts.permittedOrderFeeTypes;
        this._devUtils = devUtils;
    }

    public async pruneSignedOrdersAsync(signedOrders: SignedOrder[]): Promise<PrunedSignedOrder[]> {
        const unsortedOrders = this._filterForUsableOrders(
            signedOrders,
            this.expiryBufferMs,
        );

        const signatures = _.map(unsortedOrders, o => o.signature);
        const [ordersInfo, fillableTakerAssetAmounts, isValidSignatures ] = await this._devUtils.getOrderRelevantStates.callAsync(
            unsortedOrders,
            signatures,
        );
        const ordersOnChainMetadata: any[] = ordersInfo.map((orderInfo, index) => {
            return {
                ...orderInfo,
                fillableTakerAssetAmount: fillableTakerAssetAmounts[index],
                isValidSignature: isValidSignatures[index],
            };
        });
        // take orders + on chain information and find the valid orders and fillable makerAsset or takerAsset amounts
        const prunedOrders = this._filterForFillableAndPermittedFeeTypeOrders(unsortedOrders, ordersOnChainMetadata);

        return prunedOrders;
    }

    // tslint:disable-next-line: prefer-function-over-method
    private _filterForFillableAndPermittedFeeTypeOrders(
        orders: SignedOrder[],
        ordersOnChainMetadata: any[],
    ): PrunedSignedOrder[] {
        const result = _.chain(orders).filter((order: SignedOrder, index: number): boolean => {
            const { isValidSignature, orderStatus, fillableTakerAssetAmount } = ordersOnChainMetadata[index];
            return isValidSignature &&
            orderStatus === OrderStatus.Fillable &&
            ((this.permittedOrderFeeTypes.has(OrderPrunerPermittedFeeTypes.NoFees) && order.takerFee.eq(constants.ZERO_AMOUNT)) ||
            (this.permittedOrderFeeTypes.has(OrderPrunerPermittedFeeTypes.TakerDenominatedTakerFee) && utils.isOrderTakerFeePayableWithTakerAsset(order)) ||
            (this.permittedOrderFeeTypes.has(OrderPrunerPermittedFeeTypes.MakerDenominatedTakerFee) && utils.isOrderTakerFeePayableWithMakerAsset(order)));
        }).map((order: SignedOrder, index: number): PrunedSignedOrder => {
            const { fillableTakerAssetAmount } = ordersOnChainMetadata[index];
            return {
                ...order,
                fillableTakerAssetAmount,
                fillableMakerAssetAmount: orderCalculationUtils.getMakerFillAmount(order, fillableTakerAssetAmount),
                fillableTakerFeeAmount: orderCalculationUtils.getTakerFeeAmount(order, fillableTakerAssetAmount),
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
