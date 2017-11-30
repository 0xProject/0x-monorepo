import {BigNumber} from 'bignumber.js';
import * as _ from 'lodash';

import {Order} from './order';
import {BatchCancelOrders, BatchFillOrders, FillOrdersUpTo} from './types';

export const formatters = {
  createBatchFill(orders: Order[],
                  shouldThrowOnInsufficientBalanceOrAllowance: boolean,
                  fillTakerTokenAmounts: BigNumber[] = []) {
    const batchFill: BatchFillOrders = {
      orderAddresses: [],
      orderValues: [],
      fillTakerTokenAmounts,
      shouldThrowOnInsufficientBalanceOrAllowance,
      v: [],
      r: [],
      s: [],
    };
    _.forEach(orders, order => {
      batchFill.orderAddresses.push([order.params.maker, order.params.taker, order.params.makerToken,
                                     order.params.takerToken, order.params.feeRecipient]);
      batchFill.orderValues.push([order.params.makerTokenAmount, order.params.takerTokenAmount, order.params.makerFee,
                                  order.params.takerFee, order.params.expirationTimestampInSec, order.params.salt]);
      batchFill.v.push(order.params.v);
      batchFill.r.push(order.params.r);
      batchFill.s.push(order.params.s);
      if (fillTakerTokenAmounts.length < orders.length) {
        batchFill.fillTakerTokenAmounts.push(order.params.takerTokenAmount);
      }
    });
    return batchFill;
  },
  createFillUpTo(orders: Order[],
                 shouldThrowOnInsufficientBalanceOrAllowance: boolean,
                 fillTakerTokenAmount: BigNumber) {
    const fillUpTo: FillOrdersUpTo = {
      orderAddresses: [],
      orderValues: [],
      fillTakerTokenAmount,
      shouldThrowOnInsufficientBalanceOrAllowance,
      v: [],
      r: [],
      s: [],
    };
    orders.forEach(order => {
      fillUpTo.orderAddresses.push([order.params.maker, order.params.taker, order.params.makerToken,
                                    order.params.takerToken, order.params.feeRecipient]);
      fillUpTo.orderValues.push([order.params.makerTokenAmount, order.params.takerTokenAmount, order.params.makerFee,
                                 order.params.takerFee, order.params.expirationTimestampInSec, order.params.salt]);
      fillUpTo.v.push(order.params.v);
      fillUpTo.r.push(order.params.r);
      fillUpTo.s.push(order.params.s);
    });
    return fillUpTo;
  },
  createBatchCancel(orders: Order[], cancelTakerTokenAmounts: BigNumber[] = []) {
    const batchCancel: BatchCancelOrders = {
      orderAddresses: [],
      orderValues: [],
      cancelTakerTokenAmounts,
    };
    orders.forEach(order => {
      batchCancel.orderAddresses.push([order.params.maker, order.params.taker, order.params.makerToken,
                                       order.params.takerToken, order.params.feeRecipient]);
      batchCancel.orderValues.push([order.params.makerTokenAmount, order.params.takerTokenAmount, order.params.makerFee,
                                    order.params.takerFee, order.params.expirationTimestampInSec, order.params.salt]);
      if (cancelTakerTokenAmounts.length < orders.length) {
        batchCancel.cancelTakerTokenAmounts.push(order.params.takerTokenAmount);
      }
    });
    return batchCancel;
  },
};
