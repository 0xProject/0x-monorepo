const postpublish_utils = require('../../../scripts/postpublish_utils');
const packageJSON = require('../package.json');

const subPackageName = packageJSON.name;

postpublish_utils.getLatestTagAndVersionAsync(subPackageName)
    .then(function(result) {
        const releaseName = subPackageName + ' v' + result.version;
        const assets = [];
        return postpublish_utils.publishReleaseNotes(result.tag, releaseName, assets);
    })
    .catch (function(err) {
        throw err;
    });
