import { SwapQuoteConsumer, SwapQuoter, SwapQuoteConsumerOpts, SwapQuoterOpts } from '@0x/asset-swapper';
import { SupportedProvider } from 'ethereum-types';
import * as _ from 'lodash';

import { Network, OrderSource } from '../types';

export const assetSwapperFactory = {
    getSwapQuoter: (supportedProvider: SupportedProvider, orderSource: OrderSource, network: Network): SwapQuoter => {
        const swapQuoterOpts: Partial<SwapQuoterOpts> = {
            chainId: network,
        };
        const swapQuoter = _.isString(orderSource)
            ? SwapQuoter.getSwapQuoterForStandardRelayerAPIUrl(supportedProvider, orderSource, swapQuoterOpts)
            : SwapQuoter.getSwapQuoterForProvidedOrders(supportedProvider, orderSource, swapQuoterOpts);
        return swapQuoter;
    },
    getSwapQuoteConsumer: (supportedProvider: SupportedProvider, network: Network): SwapQuoteConsumer => {
        const swapQuoteConsumerOptions: Partial<SwapQuoterOpts> = {
            chainId: network,
        };
        return new SwapQuoteConsumer(supportedProvider, swapQuoteConsumerOptions );
    },
};
