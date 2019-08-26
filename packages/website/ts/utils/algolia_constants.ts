const algoliasearch = require('algoliasearch/lite');

import { ObjectMap } from '@0x/types';

const ALGOLIA_MAX_NUMBER_HITS = 1000; // Limit set by algolia

export const ALGOLIA_APP_ID = 'HWXKQZ6EUX';
const ALGOLIA_CLIENT_API_KEY = '15a66580bc61181a2ee45931f3d35994';
export const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_CLIENT_API_KEY);

export const hitsPerPage = {
    autocomplete: 5,
    pages: ALGOLIA_MAX_NUMBER_HITS, // Maximum set by algolia
};

export const searchIndices: ObjectMap<string> = {
    'api-explorer': '0x_api_explorer',
    'core-concepts': '0x_core_concepts',
    guides: '0x_guides',
    tools: '0x_tools',
};
