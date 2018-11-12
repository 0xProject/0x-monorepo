import 'source-map-support/register';

import { logUtils } from '@0xproject/utils';
import * as _ from 'lodash';
import * as yargs from 'yargs';

import { Compiler } from './compiler';

const SEPARATOR = ',';

(async () => {
    // Parse command line arguments and handle help
    const argv = yargs
        .option('remapping', {
            type: 'string',
            description: 'search path remappings for contracts',
        })
        .option('includes', {
            type: 'string',
            description: 'search path for contracts',
        })
        .option('sources', {
            type: 'string',
            description: 'comma separated list of Solidity files to process',
        })
        .option('output', {
            type: 'string',
            description: 'directory to output too',
        })
        .help().argv;

    // Handle command line arguments
    const options = Compiler.defaultOptions;
    if (argv.paths) {
        options.includes = argv.paths.split(SEPARATOR) as string[];
    }
    if (argv.sources) {
        options.sources = argv.sources.split(SEPARATOR) as string[];
    }
    if (argv.output) {
        options.output = argv.output as string;
    }

    // Instantiate and run compiler
    console.time('Compilation');
    const compiler = new Compiler(options);
    await compiler.compileAsync();
    console.timeEnd('Compilation');

    // Exit successfully
    process.exit(0);
})().catch(err => {
    // Catch and log errorsm exit with failure
    logUtils.log(err);
    process.exit(1);
});
