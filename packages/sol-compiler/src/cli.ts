#!/usr/bin/env node
// We need the above pragma since this script will be run as a command-line tool.

import { BigNumber, logUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as _ from 'lodash';
import * as path from 'path';
import * as Web3 from 'web3';
import * as yargs from 'yargs';

import { Compiler } from './compiler';
import { constants } from './utils/constants';
import { CompilerOptions } from './utils/types';

const DEFAULT_CONTRACTS_LIST = '*';
const SEPARATOR = ',';

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
        .help().argv;
    const contracts = _.isUndefined(argv.contracts)
        ? undefined
        : argv.contracts === DEFAULT_CONTRACTS_LIST
            ? DEFAULT_CONTRACTS_LIST
            : argv.contracts.split(SEPARATOR);
    const opts: CompilerOptions = {
        contractsDir: argv.contractsDir,
        artifactsDir: argv.artifactsDir,
        contracts,
    };
    const compiler = new Compiler(opts);
    await compiler.compileAsync();
})().catch(err => {
    logUtils.log(err);
    process.exit(1);
});
