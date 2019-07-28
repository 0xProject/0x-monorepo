const algoliasearch = require('algoliasearch/lite');

const { configs } = require('ts/utils/configs');

export const searchClient = algoliasearch(configs.ALGOLIA_APP_ID, configs.ALGOLIA_CLIENT_API_KEY);
// export const adminClient = algoliasearch(configs.ALGOLIA_APP_ID, configs.ALGOLIA_ADMIN_API_KEY);

export const searchIndex = {
    guides: '0x_guides_test',
    tools: '0x_tools_test',
};
