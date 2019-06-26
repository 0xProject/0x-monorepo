import { SupportedProvider, Web3Wrapper } from '@0x/web3-wrapper';
import * as _ from 'lodash';

import { SwapQuoteConsumerError, SwapQuoteExecutionOpts } from '../types';

export const swapQuoteConsumerUtils = {
    async getTakerAddressOrThrowAsync(
        provider: SupportedProvider,
        opts: Partial<SwapQuoteExecutionOpts>,
    ): Promise<string> {
        if (opts.takerAddress !== undefined) {
            return opts.takerAddress;
        } else {
            const web3Wrapper = new Web3Wrapper(provider);
            const availableAddresses = await web3Wrapper.getAvailableAddressesAsync();
            const firstAvailableAddress = _.head(availableAddresses);
            if (firstAvailableAddress !== undefined) {
                return firstAvailableAddress;
            } else {
                throw new Error(SwapQuoteConsumerError.NoAddressAvailable);
            }
        }
    },
};
