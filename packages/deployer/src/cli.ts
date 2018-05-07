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

const DEFAULT_CONTRACTS_DIR = path.resolve('src/contracts');
const DEFAULT_ARTIFACTS_DIR = path.resolve('src/artifacts');
const DEFAULT_NETWORK_ID = 50;
const DEFAULT_JSONRPC_URL = 'http://localhost:8545';
const DEFAULT_GAS_PRICE = (10 ** 9 * 2).toString();
const DEFAULT_CONTRACTS_LIST = '*';
const SEPARATOR = ',';

/**
 * Compiles all contracts with options passed in through CLI.
 * @param argv Instance of process.argv provided by yargs.
 */
async function onCompileCommandAsync(argv: CliOptions): Promise<void> {
    const opts: CompilerOptions = {
        contractsDir: argv.contractsDir,
        artifactsDir: argv.artifactsDir,
        contracts: argv.contracts === DEFAULT_CONTRACTS_LIST ? DEFAULT_CONTRACTS_LIST : argv.contracts.split(SEPARATOR),
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
        artifactsDir: argv.artifactsDir,
        contracts: argv.contracts === DEFAULT_CONTRACTS_LIST ? DEFAULT_CONTRACTS_LIST : argv.contracts.split(SEPARATOR),
    };
    await commands.compileAsync(compilerOpts);

    const defaults = {
        gasPrice: new BigNumber(argv.gasPrice),
        from: argv.account,
    };
    const deployerOpts: DeployerOptions = {
        artifactsDir: argv.artifactsDir || DEFAULT_ARTIFACTS_DIR,
        jsonrpcUrl: argv.jsonrpcUrl,
        networkId,
        defaults,
    };
    const deployerArgsString = argv.constructorArgs as string;
    const deployerArgs = deployerArgsString.split(SEPARATOR);
    await commands.deployAsync(argv.contract as string, deployerArgs, deployerOpts);
}
/**
 * Provides extra required options for deploy command.
 * @param yargsInstance yargs instance provided in builder function callback.
 */
function deployCommandBuilder(yargsInstance: any) {
    return yargsInstance
        .option('network-id', {
            type: 'number',
            default: DEFAULT_NETWORK_ID,
            description: 'mainnet=1, kovan=42, testrpc=50',
        })
        .option('contract', {
            type: 'string',
            description: 'name of contract to deploy, excluding .sol extension',
        })
        .option('constructor-args', {
            type: 'string',
            description: 'comma separated list of constructor args to deploy contract with',
        })
        .option('jsonrpc-url', {
            type: 'string',
            default: DEFAULT_JSONRPC_URL,
            description: 'url of JSON RPC',
        })
        .option('account', {
            type: 'string',
            description: 'account to use for deploying contracts',
        })
        .option('gas-price', {
            type: 'string',
            default: DEFAULT_GAS_PRICE,
            description: 'gasPrice to be used for transactions',
        })
        .demandOption(['contract', 'args', 'account'])
        .help().argv;
}

/**
 * Provides extra required options for compile command.
 * @param yargsInstance yargs instance provided in builder function callback.
 */
function compileCommandBuilder(yargsInstance: any) {
    return yargsInstance
        .option('contracts', {
            type: 'string',
            default: DEFAULT_CONTRACTS_LIST,
            description: 'comma separated list of contracts to compile',
        })
        .help().argv;
}

(() => {
    const identityCommandBuilder = _.identity;
    return yargs
        .option('contracts-dir', {
            type: 'string',
            description: 'path of contracts directory to compile',
        })
        .option('artifacts-dir', {
            type: 'string',
            description: 'path to write contracts artifacts to',
        })
        .demandCommand(1)
        .command('compile', 'compile contracts', compileCommandBuilder, consoleReporter(onCompileCommandAsync))
        .command(
            'deploy',
            'deploy a single contract with provided arguments',
            deployCommandBuilder,
            consoleReporter(onDeployCommandAsync),
        )
        .help().argv;
})();
