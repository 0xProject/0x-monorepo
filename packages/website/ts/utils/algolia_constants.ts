const algoliasearch = require('algoliasearch/lite');

import { ObjectMap } from '@0x/types';

const ALGOLIA_APP_ID = 'Z5HRK3F1BK';
const ALGOLIA_CLIENT_API_KEY = '53793d35f5e6b0583d273c4015373c3b';
// @TODO: Move the following somewhere safe / out of the repo
const ALGOLIA_ADMIN_API_KEY = 'b158fad22eba28a2660ae045c5766378';

const ALGOLIA_MAX_NUMBER_HITS = 1000; // Limit set by algolia

const ALGOLIA_ADMIN_OPTIONS = {
    timeouts: {
        connect: 10000,
        read: 2 * 10000,
        write: 30 * 10000,
    },
};

export interface IAlgoliaSettings {
    distinct: boolean;
    attributeForDistinct: string;
    attributesForFaceting: string[];
    attributesToSnippet: string[];
    searchableAttributes: string[];
    snippetEllipsisText: string;
}

export const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_CLIENT_API_KEY);
export const adminClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY, ALGOLIA_ADMIN_OPTIONS);

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

const sharedSettings = {
    distinct: true,
    attributeForDistinct: 'id',
    attributesForFaceting: [''],
    attributesToSnippet: ['description:20', 'textContent:20'], // attribute:nbWords (number of words to show in a snippet)
    searchableAttributes: ['title', 'textContent'],
    snippetEllipsisText: '…',
};

export const settings: ObjectMap<IAlgoliaSettings> = {
    'api-explorer': sharedSettings,
    'core-concepts': sharedSettings,
    guides: {
        ...sharedSettings,
        attributesForFaceting: ['topics', 'difficulty'],
    },
    tools: {
        ...sharedSettings,
        attributesForFaceting: ['type', 'tags', 'difficulty', 'isCommunity'],
    },
};
