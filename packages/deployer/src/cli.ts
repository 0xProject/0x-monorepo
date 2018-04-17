#!/usr/bin/env node
// We need the above pragma since this script will be run as a command-line tool.

import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import * as path from 'path';
import * as Web3 from 'web3';
import * as yargs from 'yargs';

import { commands } from './commands';
import { constants } from './utils/constants';
import { consoleReporter } from './utils/error_reporter';
import { CliOptions, CompilerOptions, DeployerOptions } from './utils/types';

const DEFAULT_OPTIMIZER_ENABLED = false;
const DEFAULT_CONTRACTS_DIR = path.resolve('src/contracts');
const DEFAULT_ARTIFACTS_DIR = path.resolve('src/artifacts');
const DEFAULT_NETWORK_ID = 50;
const DEFAULT_JSONRPC_URL = 'http://localhost:8545';
const DEFAULT_GAS_PRICE = (10 ** 9 * 2).toString();
const DEFAULT_CONTRACTS_LIST = '*';

/**
 * Compiles all contracts with options passed in through CLI.
 * @param argv Instance of process.argv provided by yargs.
 */
async function onCompileCommandAsync(argv: CliOptions): Promise<void> {
    const opts: CompilerOptions = {
        contractsDir: argv.contractsDir,
        networkId: argv.networkId,
        optimizerEnabled: argv.shouldOptimize,
        artifactsDir: argv.artifactsDir,
        specifiedContracts: getContractsSetFromList(argv.contracts),
    };
    await commands.compileAsync(opts);
}
/**
 * Deploys a single contract with provided name and args.
 * @param argv Instance of process.argv provided by yargs.
 */
async function onDeployCommandAsync(argv: CliOptions): Promise<void> {
    const url = argv.jsonrpcUrl;
    const provider = new Web3.providers.HttpProvider(url);
    const web3Wrapper = new Web3Wrapper(provider);
    const networkId = await web3Wrapper.getNetworkIdAsync();
    const compilerOpts: CompilerOptions = {
        contractsDir: argv.contractsDir,
        networkId,
        optimizerEnabled: argv.shouldOptimize,
        artifactsDir: argv.artifactsDir,
        specifiedContracts: getContractsSetFromList(argv.contracts),
    };
    await commands.compileAsync(compilerOpts);

    const defaults = {
        gasPrice: new BigNumber(argv.gasPrice),
        from: argv.account,
    };
    const deployerOpts: DeployerOptions = {
        artifactsDir: argv.artifactsDir,
        jsonrpcUrl: argv.jsonrpcUrl,
        networkId,
        defaults,
    };
    const deployerArgsString = argv.args as string;
    const deployerArgs = deployerArgsString.split(',');
    await commands.deployAsync(argv.contract as string, deployerArgs, deployerOpts);
}
/**
 * Creates a set of contracts to compile.
 * @param contracts Comma separated list of contracts to compile
 */
function getContractsSetFromList(contracts: string): Set<string> {
    const specifiedContracts = new Set();
    if (contracts === '*') {
        return new Set(['*']);
    }
    const contractsArray = contracts.split(',');
    _.forEach(contractsArray, contractName => {
        specifiedContracts.add(contractName);
    });
    return specifiedContracts;
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
        .help().argv;
}

(() => {
    const identityCommandBuilder = _.identity;
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
        .option('jsonrpc-url', {
            type: 'string',
            default: DEFAULT_JSONRPC_URL,
            description: 'url of JSON RPC',
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
        .option('contracts', {
            type: 'string',
            default: DEFAULT_CONTRACTS_LIST,
            description: 'comma separated list of contracts to compile',
        })
        .command('compile', 'compile contracts', identityCommandBuilder, consoleReporter(onCompileCommandAsync))
        .command(
            'deploy',
            'deploy a single contract with provided arguments',
            deployCommandBuilder,
            consoleReporter(onDeployCommandAsync),
        )
        .help().argv;
})();
