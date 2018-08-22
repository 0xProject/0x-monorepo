import { SignedOrder } from '@0xproject/types';

import { ForwarderHelperImpl, ForwarderHelperImplConfig } from './forwarder_helper_impl';
import { ForwarderHelper } from './types';

export const forwarderHelperFactory = {
    getForwarderHelperForOrders(orders: SignedOrder[], feeOrders: SignedOrder[] = []): ForwarderHelper {
        const config: ForwarderHelperImplConfig = {
            orders,
            feeOrders,
        };
        const helper = new ForwarderHelperImpl(config);
        return helper;
    },
};
