import { DevUtilsContract } from '@0x/contract-wrappers';
import { Order } from '@0x/types';
import { BigNumber } from '@0x/utils';

import { constants } from './constants';

const devUtilsContract = new DevUtilsContract(constants.NULL_ADDRESS, constants.FAKED_PROVIDER as any);

export const orderHashUtils = {
    getOrderHashAsync: async (order: Order): Promise<string> => {
        const orderHash = await devUtilsContract
            .getOrderHash(order, new BigNumber(order.chainId), order.exchangeAddress)
            .callAsync();
        return orderHash;
    },
};
