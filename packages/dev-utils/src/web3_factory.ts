import { providerUtils } from '@0x/utils';
import * as fs from 'fs';
import * as _ from 'lodash';
import Web3ProviderEngine = require('web3-provider-engine');
import RpcSubprovider = require('web3-provider-engine/subproviders/rpc');

import { constants } from './constants';
import { env, EnvVars } from './env';
import { EmptyWalletSubprovider } from './subproviders/empty_wallet_subprovider';
import { FakeGasEstimateSubprovider } from './subproviders/fake_gas_estimate_subprovider';
import { GanacheSubprovider } from './subproviders/ganache';

export interface Web3Config {
    hasAddresses?: boolean; // default: true
    shouldUseInProcessGanache?: boolean; // default: false
    shouldThrowErrorsOnGanacheRPCResponse?: boolean; // default: true
    rpcUrl?: string; // default: localhost:8545
    shouldUseFakeGasEstimate?: boolean; // default: true
    ganacheDatabasePath?: string; // default: undefined, creates a tmp dir
}

export const web3Factory = {
    getRpcProvider(config: Web3Config = {}): Web3ProviderEngine {
        const provider = new Web3ProviderEngine();
        const hasAddresses = config.hasAddresses === undefined || config.hasAddresses;
        config.shouldUseFakeGasEstimate =
            config.shouldUseFakeGasEstimate === undefined || config.shouldUseFakeGasEstimate;
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
            if (config.rpcUrl !== undefined) {
                throw new Error('Cannot use both GanacheSubrovider and RpcSubprovider');
            }
            const shouldThrowErrorsOnGanacheRPCResponse =
                config.shouldThrowErrorsOnGanacheRPCResponse === undefined ||
                config.shouldThrowErrorsOnGanacheRPCResponse;
            if (config.ganacheDatabasePath !== undefined) {
                const doesDatabaseAlreadyExist = fs.existsSync(config.ganacheDatabasePath);
                if (!doesDatabaseAlreadyExist) {
                    // Working with local DB snapshot. Ganache requires this directory to exist
                    fs.mkdirSync(config.ganacheDatabasePath);
                }
            }
            provider.addProvider(
                new GanacheSubprovider({
                    vmErrorsOnRPCResponse: shouldThrowErrorsOnGanacheRPCResponse,
                    db_path: config.ganacheDatabasePath,
                    gasLimit: constants.GAS_LIMIT,
                    logger,
                    verbose: env.parseBoolean(EnvVars.VerboseGanache),
                    port: 8545,
                    network_id: 50,
                    mnemonic: 'concert load couple harbor equip island argue ramp clarify fence smart topic',
                }),
            );
        } else {
            // Note we're using the Metamask RpcSubprovider not the @0x/subproviders RPCSubprovider
            provider.addProvider(new RpcSubprovider({ rpcUrl: config.rpcUrl || constants.RPC_URL }));
        }
        providerUtils.startProviderEngine(provider);
        return provider;
    },
};
