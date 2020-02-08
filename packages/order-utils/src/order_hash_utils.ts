import { Order } from '@0x/types';
import { hexUtils, signTypedDataUtils } from '@0x/utils';

import { eip712Utils } from './eip712_utils';

export const orderHashUtils = {
    getOrderHash: (order: Order): string => {
        return hexUtils.toHex(signTypedDataUtils.generateTypedDataHash(eip712Utils.createOrderTypedData(order)));
    },
};
