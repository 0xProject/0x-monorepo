import * as algoliasearch from 'algoliasearch/lite';

import { ObjectMap } from '@0x/types';

const ALGOLIA_MAX_NUMBER_HITS = 1000; // Limit set by algolia

export const ALGOLIA_APP_ID = 'HWXKQZ6EUX';
const ALGOLIA_CLIENT_API_KEY = '15a66580bc61181a2ee45931f3d35994';
export const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_CLIENT_API_KEY);

export const hitsPerPage = {
    autocomplete: 5,
    pages: ALGOLIA_MAX_NUMBER_HITS, // Maximum set by algolia
};

export function getNameToSearchIndex(environment: string): ObjectMap<string> {
    const lowercaseEnv = environment.toLowerCase();
    const nameToSearchIndex: ObjectMap<string> = {
        'api-explorer': `${lowercaseEnv}_api_explorer`,
        'core-concepts': `${lowercaseEnv}_core_concepts`,
        guides: `${lowercaseEnv}_guides`,
        tools: `${lowercaseEnv}_tools`,
    };
    return nameToSearchIndex;
}
