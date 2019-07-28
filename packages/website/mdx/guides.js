const { adminClient, sharedSettings } = require('./constants');
const { indexFiles, setIndexSettings } = require('./helpers');

const index = adminClient.initIndex('0x_guides_test');
const dirName = 'guides';

const settings = {
    ...sharedSettings,
    attributesForFaceting: ['topics', 'difficulty'],
};

setIndexSettings(index, settings);
indexFiles(index, dirName);
