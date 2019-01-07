#!/usr/bin/env node
// We need the above pragma since this script will be run as a command-line tool.

import { logUtils } from '@0x/utils';
import { CompilerOptions } from 'ethereum-types';
import * as _ from 'lodash';
import * as path from 'path';
import rc = require('rc');
import * as solc from 'solc';
import 'source-map-support/register';
import * as yargs from 'yargs';

import { Compiler } from './compiler';

const SEPARATOR = ',';
const ALL_CONTRACTS_IDENTIFIER = '*';
const ALL_FILES_IDENTIFIER = '*';
const DEFAULT_CONTRACTS_DIR = path.resolve('contracts');
const DEFAULT_ARTIFACTS_DIR = path.resolve('artifacts');
// Solc compiler settings cannot be configured from the commandline.
// If you need this configured, please create a `compiler.json` config file
// with your desired configurations.
const DEFAULT_COMPILER_SETTINGS: solc.CompilerSettings = {
    optimizer: {
        enabled: false,
    },
    outputSelection: {
        [ALL_FILES_IDENTIFIER]: {
            [ALL_CONTRACTS_IDENTIFIER]: ['abi', 'evm.bytecode.object'],
        },
    },
};

(async () => {
    const argv = yargs
        .option('contracts-dir', {
            type: 'string',
            description: 'path of contracts directory to compile',
        })
        .option('artifacts-dir', {
            type: 'string',
            description: 'path to write contracts artifacts to',
        })
        .option('contracts', {
            type: 'string',
            description: 'comma separated list of contracts to compile',
        })
        .option('watch', {
            alias: 'w',
            default: false,
        })
        .help().argv;
    const contracts = _.isUndefined(argv.contracts)
        ? undefined
        : argv.contracts === ALL_CONTRACTS_IDENTIFIER
            ? ALL_CONTRACTS_IDENTIFIER
            : argv.contracts.split(SEPARATOR);
    const defaultOpts: CompilerOptions = {
        contractsDir: DEFAULT_CONTRACTS_DIR,
        artifactsDir: DEFAULT_ARTIFACTS_DIR,
        contracts: ALL_CONTRACTS_IDENTIFIER,
        compilerSettings: DEFAULT_COMPILER_SETTINGS,
    };
    const cliOpts = _.pickBy({ contractsDir: argv.contractsDir }, _.identity);
    const rcOpts = rc('sol-compiler', defaultOpts, cliOpts);
    console.log(rcOpts);
    const { configs: _1, config: _2, ...opts } = rcOpts;
    console.log(opts);
    const compiler = new Compiler(opts);
    if (argv.watch) {
        await compiler.watchAsync();
    } else {
        await compiler.compileAsync();
    }
})().catch(err => {
    logUtils.log(err);
    process.exit(1);
});
