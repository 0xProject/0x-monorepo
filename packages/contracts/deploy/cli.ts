import {BigNumber} from 'bignumber.js';
import * as _ from 'lodash';
import * as path from 'path';
import * as yargs from 'yargs';

import {commands} from './src/commands';
import {network} from './src/utils/network';
import {
    CliOptions,
    CompilerOptions,
    DeployerOptions,
} from './src/utils/types';

const DEFAULT_OPTIMIZER_ENABLED = false;
const DEFAULT_CONTRACTS_DIR = path.resolve('contracts');
const DEFAULT_ARTIFACTS_DIR = `${path.resolve('build')}/artifacts/`;
const DEFAULT_NETWORK_ID = 50;
const DEFAULT_JSONRPC_PORT = 8545;
const DEFAULT_GAS_PRICE = ((10 ** 9) * 2).toString();

/**
 * Compiles all contracts with options passed in through CLI.
 * @param argv Instance of process.argv provided by yargs.
 */
async function onCompileCommand(args: CliOptions): Promise<void> {
    const opts: CompilerOptions = {
        contractsDir: args.contractsDir,
        networkId: args.networkId,
        optimizerEnabled: args.shouldOptimize ? 1 : 0,
        artifactsDir: args.artifactsDir,
    };
    await commands.compileAsync(opts);
}
/**
 * Compiles all contracts and runs migration script with options passed in through CLI.
 * Uses network ID of running node.
 * @param argv Instance of process.argv provided by yargs.
 */
async function onMigrateCommand(argv: CliOptions): Promise<void> {
    const networkIdIfExists = await network.getNetworkIdIfExistsAsync(argv.jsonrpcPort);
    const compilerOpts: CompilerOptions = {
        contractsDir: argv.contractsDir,
        networkId: networkIdIfExists,
        optimizerEnabled: argv.shouldOptimize ? 1 : 0,
        artifactsDir: argv.artifactsDir,
    };
    await commands.compileAsync(compilerOpts);

    const defaults = {
        gasPrice: new BigNumber(argv.gasPrice),
        from: argv.account,
    };
    const deployerOpts = {
        artifactsDir: argv.artifactsDir,
        jsonrpcPort: argv.jsonrpcPort,
        networkId: networkIdIfExists,
        defaults,
    };
    await commands.migrateAsync(deployerOpts);
}
/**
 * Deploys a single contract with provided name and args.
 * @param argv Instance of process.argv provided by yargs.
 */
async function onDeployCommand(argv: CliOptions): Promise<void> {
    const networkIdIfExists = await network.getNetworkIdIfExistsAsync(argv.jsonrpcPort);
    const compilerOpts: CompilerOptions = {
        contractsDir: argv.contractsDir,
        networkId: networkIdIfExists,
        optimizerEnabled: argv.shouldOptimize ? 1 : 0,
        artifactsDir: argv.artifactsDir,
    };
    await commands.compileAsync(compilerOpts);

    const defaults = {
        gasPrice: new BigNumber(argv.gasPrice),
        from: argv.account,
    };
    const deployerOpts: DeployerOptions = {
        artifactsDir: argv.artifactsDir,
        jsonrpcPort: argv.jsonrpcPort,
        networkId: networkIdIfExists,
        defaults,
    };
    const deployerArgsString = argv.args;
    const deployerArgs = deployerArgsString.split(',');
    await commands.deployAsync(argv.contract, deployerArgs, deployerOpts);
}
/**
 * Provides extra required options for deploy command.
 * @param yargsInstance yargs instance provided in builder function callback.
 */
function deployCommandBuilder(yargsInstance: any) {
    return yargsInstance
        .option('contract', {
            type: 'string',
            description: 'name of contract to deploy, exluding .sol extension',
        })
        .option('args', {
            type: 'string',
            description: 'comma separated list of constructor args to deploy contract with',
        })
        .demandOption(['contract', 'args'])
        .help()
        .argv;
}

(() => {
    return yargs
        .option('contracts-dir', {
            type: 'string',
            default: DEFAULT_CONTRACTS_DIR,
            description: 'path of contracts directory to compile',
        })
        .option('network-id', {
            type: 'number',
            default: DEFAULT_NETWORK_ID,
            description: 'mainnet=1, kovan=42, testrpc=50',
        })
        .option('should-optimize', {
            type: 'boolean',
            default: DEFAULT_OPTIMIZER_ENABLED,
            description: 'enable optimizer',
        })
        .option('artifacts-dir', {
            type: 'string',
            default: DEFAULT_ARTIFACTS_DIR,
            description: 'path to write contracts artifacts to',
        })
        .option('jsonrpc-port', {
            type: 'number',
            default: DEFAULT_JSONRPC_PORT,
            description: 'port connected to JSON RPC',
        })
        .option('gas-price', {
            type: 'string',
            default: DEFAULT_GAS_PRICE,
            description: 'gasPrice to be used for transactions',
        })
        .option('account', {
            type: 'string',
            description: 'account to use for deploying contracts',
        })
        .command('compile',
                 'compile contracts',
                 _.noop,
                 onCompileCommand)
        .command('migrate',
                 'compile and deploy contracts using migration scripts',
                 _.noop,
                 onMigrateCommand)
        .command('deploy',
                 'deploy a single contract with provided arguments',
                 deployCommandBuilder,
                 onDeployCommand)
        .help()
        .argv;
})();
