import 'source-map-support/register';
import * as yargs from 'yargs';

import { generateSolDocAsync } from './solidity_doc_generator';

const JSON_TAB_WIDTH = 4;

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
        .demandOption('contracts-dir')
        .array('contracts')
        .help().argv;
    process.stdout.write(
        JSON.stringify(await generateSolDocAsync(argv.contractsDir, argv.contracts), null, JSON_TAB_WIDTH),
    );
})().catch(err => {
    throw err;
});
