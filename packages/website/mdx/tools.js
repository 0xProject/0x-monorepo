import { adminClient, searchIndex, settings } from '../ts/utils/algolia_search';
import { indexFilesAsync, setIndexSettings } from './helpers';

const indexName = 'tools';
const index = adminClient.initIndex(searchIndex[indexName]);

setIndexSettings(index, settings[indexName]);
indexFilesAsync(index, indexName);
