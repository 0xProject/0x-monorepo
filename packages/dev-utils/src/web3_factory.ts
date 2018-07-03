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
    shouldUseFakeGasEstimate?: boolean; // default: true
}

export const web3Factory = {
    getRpcProvider(config: Web3Config = {}): ProviderEngine {
        const provider = new ProviderEngine();
        const hasAddresses = _.isUndefined(config.hasAddresses) || config.hasAddresses;
        config.shouldUseFakeGasEstimate =
            _.isUndefined(config.shouldUseFakeGasEstimate) || config.shouldUseFakeGasEstimate;
        if (!hasAddresses) {
            provider.addProvider(new EmptyWalletSubprovider());
        }

        if (config.shouldUseFakeGasEstimate) {
            provider.addProvider(new FakeGasEstimateSubprovider(constants.GAS_LIMIT));
        }
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
