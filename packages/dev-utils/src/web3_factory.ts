// HACK: web3 injects XMLHttpRequest into the global scope and ProviderEngine checks XMLHttpRequest
// to know whether it is running in a browser or node environment. We need it to be undefined since
// we are not running in a browser env.
// Filed issue: https://github.com/ethereum/web3.js/issues/844
(global as any).XMLHttpRequest = undefined;
import ProviderEngine = require('web3-provider-engine');
import RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

import { EmptyWalletSubprovider, FakeGasEstimateSubprovider, GanacheSubprovider } from '@0xproject/subproviders';
import { Provider } from '@0xproject/types';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as process from 'process';

import { constants } from './constants';
import { coverage } from './coverage';
import { env, EnvVars } from './env';

// HACK: web3 leaks XMLHttpRequest into the global scope and causes requests to hang
// because they are using the wrong XHR package.
// importing web3 after subproviders fixes this issue
// Filed issue: https://github.com/ethereum/web3.js/issues/844
// tslint:disable-next-line:ordered-imports
import * as Web3 from 'web3';

export interface Web3Config {
    hasAddresses?: boolean; // default: true
    shouldUseInProcessGanache?: boolean; // default: false
    rpcUrl?: string; // default: localhost:8545
}

export const web3Factory = {
    create(config: Web3Config = {}): Web3 {
        const provider = this.getRpcProvider(config);
        const web3 = new Web3();
        web3.setProvider(provider);
        return web3;
    },
    getRpcProvider(config: Web3Config = {}): Provider {
        const provider = new ProviderEngine();
        const isCoverageEnabled = env.parseBoolean(EnvVars.SolidityCoverage);
        if (isCoverageEnabled) {
            provider.addProvider(coverage.getCoverageSubproviderSingleton());
        }
        const hasAddresses = _.isUndefined(config.hasAddresses) || config.hasAddresses;
        if (!hasAddresses) {
            provider.addProvider(new EmptyWalletSubprovider());
        }
        provider.addProvider(new FakeGasEstimateSubprovider(constants.GAS_ESTIMATE));
        const logger = {
            log: (arg: any) => {
                fs.appendFileSync('ganache.log', `${arg}\n`);
            },
        };
        const shouldUseInProcessGanache = !!config.shouldUseInProcessGanache;
        if (shouldUseInProcessGanache) {
            if (!_.isUndefined(config.rpcUrl)) {
                throw new Error('Cannot use both GanacheSubrovider and RPCSubprovider');
            }
            provider.addProvider(
                new GanacheSubprovider({
                    logger,
                    verbose: env.parseBoolean(EnvVars.SolidityCoverage),
                    port: 8545,
                    networkId: 50,
                    mnemonic: 'concert load couple harbor equip island argue ramp clarify fence smart topic',
                }),
            );
        } else {
            provider.addProvider(
                new RpcSubprovider({
                    rpcUrl: config.rpcUrl || constants.RPC_URL,
                }),
            );
        }
        provider.start();
        return provider;
    },
};
