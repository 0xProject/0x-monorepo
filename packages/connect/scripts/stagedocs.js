const execAsync = require('async-child-process').execAsync;
const postpublish_utils = require('../../../scripts/postpublish_utils');
const packageJSON = require('../package.json');

const cwd = __dirname + '/..';
const subPackageName = packageJSON.name;
const S3BucketPath = 's3://staging-connect-docs-jsons/';
const jsonFilePath = __dirname + '/../' + postpublish_utils.generatedDocsDirectoryName + '/index.json';
const version = process.env.DOCS_VERSION;

execAsync('JSON_FILE_PATH=' + jsonFilePath + ' PROJECT_DIR=' + __dirname + '/.. yarn docs:json', {
    cwd,
})
.then(function(result) {
    if (result.stderr !== '') {
        throw new Error(result.stderr);
    }
    const fileName = 'v' + version + '.json';
    const s3Url = S3BucketPath + fileName;
    return execAsync('S3_URL=' + s3Url + ' yarn upload_docs_json', {
        cwd,
    });
})
.catch(function(err) {
    console.log(err);
});
