import { DevUtilsContract } from '@0x/contracts-dev-utils';
import { orderCalculationUtils } from '@0x/order-utils';
import { OrderStatus, SignedOrder } from '@0x/types';
import * as _ from 'lodash';

import { constants } from '../constants';
import { OrderPrunerOnChainMetadata, OrderPrunerOpts, OrderPrunerPermittedFeeTypes, PrunedSignedOrder } from '../types';
import { utils } from '../utils/utils';

export class OrderPruner {
    public readonly expiryBufferMs: number;
    public readonly permittedOrderFeeTypes: Set<OrderPrunerPermittedFeeTypes>;
    private readonly _devUtils: DevUtilsContract;

    // TODO(dave4506): OrderPruneCalculator can be more powerful if it takes in a specified takerAddress
    constructor(devUtils: DevUtilsContract, opts: Partial<OrderPrunerOpts> = {}) {
        const { expiryBufferMs, permittedOrderFeeTypes } = _.assign({}, constants.DEFAULT_ORDER_PRUNER_OPTS, opts);

        this.expiryBufferMs = expiryBufferMs;
        this.permittedOrderFeeTypes = permittedOrderFeeTypes;
        this._devUtils = devUtils;
    }

    public async pruneSignedOrdersAsync(signedOrders: SignedOrder[]): Promise<PrunedSignedOrder[]> {
        const unsortedOrders = this._filterForUsableOrders(signedOrders, this.expiryBufferMs);

        const signatures = _.map(unsortedOrders, o => o.signature);
        const [ordersInfo, fillableTakerAssetAmounts, isValidSignatures] = await this._devUtils
            .getOrderRelevantStates(unsortedOrders, signatures)
            .callAsync();
        const ordersOnChainMetadata: OrderPrunerOnChainMetadata[] = ordersInfo.map((orderInfo, index) => {
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
        ordersOnChainMetadata: OrderPrunerOnChainMetadata[],
    ): PrunedSignedOrder[] {
        const result = _.chain(orders)
            .filter(
                (order: SignedOrder, index: number): boolean => {
                    const { isValidSignature, orderStatus } = ordersOnChainMetadata[index];
                    return (
                        isValidSignature &&
                        orderStatus === OrderStatus.Fillable &&
                        ((this.permittedOrderFeeTypes.has(OrderPrunerPermittedFeeTypes.NoFees) &&
                            order.takerFee.eq(constants.ZERO_AMOUNT)) ||
                            (this.permittedOrderFeeTypes.has(OrderPrunerPermittedFeeTypes.TakerDenominatedTakerFee) &&
                                utils.isOrderTakerFeePayableWithTakerAsset(order)) ||
                            (this.permittedOrderFeeTypes.has(OrderPrunerPermittedFeeTypes.MakerDenominatedTakerFee) &&
                                utils.isOrderTakerFeePayableWithMakerAsset(order)))
                    );
                },
            )
            .map(
                (order: SignedOrder, index: number): PrunedSignedOrder => {
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

    // tslint:disable-next-line: prefer-function-over-method
    private _filterForUsableOrders(orders: SignedOrder[], expiryBufferMs: number): SignedOrder[] {
        const result = _.filter(orders, order => {
            return (
                orderCalculationUtils.isOpenOrder(order) &&
                !orderCalculationUtils.willOrderExpire(order, expiryBufferMs / constants.ONE_SECOND_MS)
            );
        });
        return result;
    }
}
