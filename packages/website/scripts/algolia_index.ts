import * as yargs from 'yargs';

import { getNameToSearchIndex } from '../ts/utils/algolia_constants';

import { indexFilesAsync } from './algolia_helpers';

const args = yargs
    .option('indexes', {
        alias: ['i'],
        describe: 'A comma-separated list of specific indexes one wants to sync',
        type: 'string',
        normalize: true,
        demandOption: false,
        default: undefined,
    })
    .option('environment', {
        alias: ['e', 'env'],
        describe: 'The environment for which you wish to update the indexes',
        type: 'string',
        normalize: true,
        demandOption: false,
        default: 'development',
    })
    .example("$0 --environment 'production' --index 'tools'", 'Full usage example').argv;

function processIndices(indices: string[], environment: string): void {
    for (const indexName of indices) {
        void indexFilesAsync(indexName, environment);
    }
}

if (args.index !== undefined) {
    processIndices(args.indexes.split(','), args.environment); // Use args given to process and push to algolia
} else {
    processIndices(Object.keys(getNameToSearchIndex(args.environment)), args.environment); // Process and push all indices
}
