import {ZeroEx} from '0x.js';
import {BigNumber} from 'bignumber.js';
import * as _ from 'lodash';

import {Order} from './order';
import {DefaultOrderParams, OptionalOrderParams, OrderParams} from './types';

export class OrderFactory {
  private defaultOrderParams: DefaultOrderParams;
  constructor(defaultOrderParams: DefaultOrderParams) {
    this.defaultOrderParams = defaultOrderParams;
  }
  public async newSignedOrderAsync(customOrderParams: OptionalOrderParams = {}) {
    const randomExpiration = new BigNumber(Math.floor((Date.now() + (Math.random() * 100000000000)) / 1000));
    const orderParams: OrderParams = _.assign({}, {
      expirationTimestampInSec: randomExpiration,
      salt: ZeroEx.generatePseudoRandomSalt(),
      taker: ZeroEx.NULL_ADDRESS,
    }, this.defaultOrderParams, customOrderParams);
    const order = new Order(orderParams);
    await order.signAsync();
    return order;
  }
}
