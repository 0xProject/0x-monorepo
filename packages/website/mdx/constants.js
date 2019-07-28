const algoliasearch = require('algoliasearch');
const algoliaAppId = 'T7V7WKELRY';
const algoliaAdminKey = 'ccc472dee2aa991ca4bc935975e76b5d';

const adminClient = algoliasearch(algoliaAppId, algoliaAdminKey);

const sharedSettings = {
    distinct: true,
    attributeForDistinct: 'id',
    attributesToSnippet: ['description', 'textContent:20'], // attribute:nbWords (number of words to show in a snippet)
    searchableAttributes: ['title', 'textContent', 'description'],
    snippetEllipsisText: '…',
};

module.exports = {
    adminClient,
    sharedSettings,
};
