import ProviderEngine = require('web3-provider-engine');
import FilterSubprovider = require('web3-provider-engine/subproviders/filters');
import RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

import { devConstants, env, EnvVars } from '@0xproject/dev-utils';
import {
    EmptyWalletSubprovider,
    FakeGasEstimateSubprovider,
    GanacheSubprovider,
    MnemonicWalletSubprovider,
} from '@0xproject/subproviders';
import { Provider } from '@0xproject/types';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as Web3 from 'web3';

export interface Web3Config {
    mnemonic?: string;
    shouldUseInProcessGanache?: boolean; // default: false
    rpcUrl?: string; // default: localhost:8545
    gasEstimate?: number;
}

export const web3Factory = {
    create(config: Web3Config): Web3 {
        const provider = this.getRpcProvider(config);
        const web3 = new Web3();
        web3.setProvider(provider);
        return web3;
    },
    getRpcProvider(config: Web3Config): Provider {
        const provider = new ProviderEngine();
        const mnemonic = _.isUndefined(config.mnemonic)
            ? 'concert load couple harbor equip island argue ramp clarify fence smart topic'
            : config.mnemonic;
        const gasEstimate = _.isUndefined(config.gasEstimate) ? devConstants.GAS_ESTIMATE : config.gasEstimate;
        provider.addProvider(new FakeGasEstimateSubprovider(gasEstimate));
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
                    blockTime: 0.5,
                    logger,
                    verbose: env.parseBoolean(EnvVars.SolidityCoverage),
                    port: 8545,
                    networkId: 50,
                    mnemonic,
                }),
            );
        } else {
            provider.addProvider(new MnemonicWalletSubprovider({ mnemonic }));
            provider.addProvider(new FilterSubprovider());
            provider.addProvider(
                new RpcSubprovider({
                    rpcUrl: config.rpcUrl || devConstants.RPC_URL,
                }),
            );
        }
        provider.start();
        return provider;
    },
};
