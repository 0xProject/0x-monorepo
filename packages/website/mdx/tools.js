const { adminClient, sharedSettings } = require('./constants');
const { indexFiles, setIndexSettings } = require('./helpers');

const index = adminClient.initIndex('0x_tools_test');
const dirName = 'tools';

const settings = {
    ...sharedSettings,
    attributesForFaceting: ['type', 'tags', 'difficulty', 'isCommunity'],
};

setIndexSettings(index, settings);
indexFiles(index, dirName);
