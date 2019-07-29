import { adminClient, searchIndices, settings } from '../ts/utils/algolia_search';

import { indexFilesAsync } from './algolia_helpers';

// Get args after command (i.e. ts-node) and path to file (i.e. ./index.ts)
const args = process.argv.slice(2);

function processIndices(indices: string[]): void {
    for (const indexName of indices) {
        const index = adminClient.initIndex(searchIndices[indexName]);
        indexFilesAsync(index, indexName, settings[indexName]);
    }
}

if (args.length > 0) {
    // Use args given to process and push to algolia
    processIndices(args);
} else {
    // Process and push all indices
    processIndices(Object.getOwnPropertyNames(searchIndices));
}
