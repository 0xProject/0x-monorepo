import { SignedOrder } from '@0xproject/types';

import { ForwarderHelperImpl, ForwarderHelperImplConfig } from './forwarder_helper_impl';
import { ForwarderHelper } from './types';

export const forwarderHelperFactory = {
    /**
     * Given an array of orders and an array of feeOrders
     * @param   orders      An array of objects conforming to SignedOrder. Each order should specify the same makerAssetData and takerAssetData
     * @param   orders      An array of objects conforming to SignedOrder. Each order should specify ZRX as makerAssetData WETH as takerAssetData
     * @return  A ForwarderHelper, see type for definition
     */
    getForwarderHelperForOrders(orders: SignedOrder[], feeOrders: SignedOrder[] = []): ForwarderHelper {
        const config: ForwarderHelperImplConfig = {
            orders,
            feeOrders,
        };
        const helper = new ForwarderHelperImpl(config);
        return helper;
    },
};
