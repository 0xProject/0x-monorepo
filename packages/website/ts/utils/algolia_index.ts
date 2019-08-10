import { indexFilesAsync } from './algolia_helpers';
import { searchIndices } from './algolia_search';

// Get args (index names - i.e. guides) after command (i.e. ts-node) and path to file (i.e. ./index.ts)
const args = process.argv.slice(2);

function processIndices(indices: string[]): void {
    for (const indexName of indices) {
        indexFilesAsync(indexName);
    }
}

if (args.length > 0) {
    // Use args given to process and push to algolia
    processIndices(args);
} else {
    // Process and push all indices
    processIndices(Object.getOwnPropertyNames(searchIndices));
}
