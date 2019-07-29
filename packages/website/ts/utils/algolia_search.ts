const algoliasearch = require('algoliasearch/lite');

const ALGOLIA_APP_ID = 'T7V7WKELRY';
const ALGOLIA_CLIENT_API_KEY = '4c367b8cc6d6e175ae537cc61e4d8dfd';
// @TODO: Move the following somewhere safe / out of the repo
const ALGOLIA_ADMIN_API_KEY = 'ccc472dee2aa991ca4bc935975e76b5d';

interface ISearchIndices {
    [index: string]: string;
}

interface ISettingsIndex {
    [index: string]: Settings;
}

interface Settings {
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
    guides: '0x_guides_test',
    tools: '0x_tools_test',
};

const sharedSettings = {
    distinct: true,
    attributeForDistinct: 'id',
    attributesToSnippet: ['description', 'textContent:20'], // attribute:nbWords (number of words to show in a snippet)
    searchableAttributes: ['title', 'textContent', 'description'],
    snippetEllipsisText: '…',
};

export const settings: ISettingsIndex = {
    guides: {
        ...sharedSettings,
        attributesForFaceting: ['topics', 'difficulty'],
    },
    tools: {
        ...sharedSettings,
        attributesForFaceting: ['type', 'tags', 'difficulty', 'isCommunity'],
    },
};
