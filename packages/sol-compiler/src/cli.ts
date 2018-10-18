#!/usr/bin/env node
// We need the above pragma since this script will be run as a command-line tool.

import { logUtils } from '@0x/utils';
import * as _ from 'lodash';
import 'source-map-support/register';
import * as yargs from 'yargs';

import { Compiler } from './compiler';

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
    const opts = {
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
