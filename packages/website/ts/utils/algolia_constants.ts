const algoliasearch = require('algoliasearch/lite');

const ALGOLIA_APP_ID = 'Z5HRK3F1BK';
const ALGOLIA_CLIENT_API_KEY = '53793d35f5e6b0583d273c4015373c3b';
// @TODO: Move the following somewhere safe / out of the repo
const ALGOLIA_ADMIN_API_KEY = 'b158fad22eba28a2660ae045c5766378';

interface ISearchIndices {
    [index: string]: string;
}

interface ISettingsIndex {
    [index: string]: IAlgoliaSettings;
}

export interface IAlgoliaSettings {
    distinct: boolean;
    attributeForDistinct: string;
    attributesForFaceting: string[];
    attributesToSnippet: string[];
    searchableAttributes: string[];
    snippetEllipsisText: string;
}

export const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_CLIENT_API_KEY);
export const adminClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);

export const searchIndices: ISearchIndices = {
    'api-explorer': '0x_api_explorer',
    'core-concepts': '0x_core_concepts',
    guides: '0x_guides',
    tools: '0x_tools',
};

const sharedSettings = {
    distinct: true,
    attributeForDistinct: 'id',
    attributesForFaceting: [''],
    attributesToSnippet: ['textContent:20'], // attribute:nbWords (number of words to show in a snippet)
    searchableAttributes: ['title', 'textContent'],
    snippetEllipsisText: '…',
};

export const settings: ISettingsIndex = {
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
