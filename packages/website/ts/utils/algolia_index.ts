import { searchIndices } from './algolia_constants';
import { indexFilesAsync } from './algolia_helpers';

// Get args (index names - i.e. guides) after command (i.e. ts-node) and path to file (i.e. ./index.ts)
const args = process.argv.slice(2);

function processIndices(indices: string[]): void {
    for (const indexName of indices) {
        void indexFilesAsync(indexName);
    }
}

if (args.length > 0) {
    processIndices(args); // Use args given to process and push to algolia
} else {
    processIndices(Object.getOwnPropertyNames(searchIndices)); // Process and push all indices
}
