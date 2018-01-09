// HACK: web3 injects XMLHttpRequest into the global scope and ProviderEngine checks XMLHttpRequest
// to know whether it is running in a browser or node environment. We need it to be undefined since
// we are not running in a browser env.
// Filed issue: https://github.com/ethereum/web3.js/issues/844
(global as any).XMLHttpRequest = undefined;
import ProviderEngine = require('web3-provider-engine');
import RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

import { EmptyWalletSubprovider } from './subproviders/empty_wallet_subprovider';
import { FakeGasEstimateSubprovider } from './subproviders/fake_gas_estimate_subprovider';

import { constants } from './constants';

// HACK: web3 leaks XMLHttpRequest into the global scope and causes requests to hang
// because they are using the wrong XHR package.
// importing web3 after subproviders fixes this issue
// Filed issue: https://github.com/ethereum/web3.js/issues/844
// tslint:disable-next-line:ordered-imports
import * as Web3 from 'web3';

export const web3Factory = {
    create(hasAddresses: boolean = true): Web3 {
        const provider = this.getRpcProvider(hasAddresses);
        const web3 = new Web3();
        web3.setProvider(provider);
        return web3;
    },
    getRpcProvider(hasAddresses: boolean = true): Web3.Provider {
        const provider = new ProviderEngine();
        if (!hasAddresses) {
            provider.addProvider(new EmptyWalletSubprovider());
        }
        provider.addProvider(new FakeGasEstimateSubprovider(constants.GAS_ESTIMATE));
        provider.addProvider(
            new RpcSubprovider({
                rpcUrl: constants.RPC_URL,
            }),
        );
        provider.start();
        return provider;
    },
};
