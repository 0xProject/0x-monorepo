const postpublish_utils = require('../../../scripts/postpublish_utils');
const packageJSON = require('../package.json');

const subPackageName = packageJSON.name;
postpublish_utils.standardPostPublishAsync(subPackageName);