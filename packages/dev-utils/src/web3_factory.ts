// HACK: web3 injects XMLHttpRequest into the global scope and ProviderEngine checks XMLHttpRequest
// to know whether it is running in a browser or node environment. We need it to be undefined since
// we are not running in a browser env.
// Filed issue: https://github.com/ethereum/web3.js/issues/844
(global as any).XMLHttpRequest = undefined;
import ProviderEngine = require('web3-provider-engine');
import RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

import { EmptyWalletSubprovider, FakeGasEstimateSubprovider, GanacheSubprovider } from '@0xproject/subproviders';
import * as fs from 'fs';
import * as _ from 'lodash';

import { constants } from './constants';
import { env, EnvVars } from './env';

export interface Web3Config {
    hasAddresses?: boolean; // default: true
    shouldUseInProcessGanache?: boolean; // default: false
    rpcUrl?: string; // default: localhost:8545
}

export const web3Factory = {
    getRpcProvider(config: Web3Config = {}): ProviderEngine {
        const provider = new ProviderEngine();
        const hasAddresses = _.isUndefined(config.hasAddresses) || config.hasAddresses;
        if (!hasAddresses) {
            provider.addProvider(new EmptyWalletSubprovider());
        }
        provider.addProvider(new FakeGasEstimateSubprovider(constants.GAS_LIMIT));
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
                    gasLimit: constants.GAS_LIMIT,
                    logger,
                    verbose: env.parseBoolean(EnvVars.VerboseGanache),
                    port: 8545,
                    network_id: 50,
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
