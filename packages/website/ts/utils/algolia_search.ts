import algoliasearch from 'algoliasearch/lite';

import { configs } from 'ts/utils/configs';

export const searchClient = algoliasearch(configs.ALGOLIA_APP_ID, configs.ALGOLIA_API_KEY_CLIENT);

export const searchIndex = {
    guides: '0x_guides_test',
    tools: '0x_tools_test',
};
