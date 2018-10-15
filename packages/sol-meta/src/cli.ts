import 'source-map-support/register';
import { logUtils } from '@0xproject/utils';
import * as _ from 'lodash';
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
