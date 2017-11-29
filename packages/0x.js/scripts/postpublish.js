const execAsync = require('async-child-process').execAsync;
const postpublish_utils = require('../../../scripts/postpublish_utils');
const packageJSON = require('../package.json');

const cwd = __dirname + '/..';
const subPackageName = packageJSON.name;
const S3BucketPath = 's3://0xjs-docs-jsons/';

let tag;
let version;
postpublish_utils.getLatestTagAndVersionAsync(subPackageName)
    .then(function(result) {
        tag = result.tag;
        version = result.version;
         const releaseName = postpublish_utils.getReleaseName(subPackageName, version);
         const assets = [
             __dirname + '/../_bundles/index.js',
             __dirname + '/../_bundles/index.min.js',
         ];
         return postpublish_utils.publishReleaseNotes(tag, releaseName, assets);
    })
    .then(function(release) {
        console.log('POSTPUBLISH: Release successful, generating docs...');
        const jsonFilePath = __dirname + '/../' + postpublish_utils.generatedDocsDirectoryName + '/index.json';
        return execAsync(
            'JSON_FILE_PATH=' + jsonFilePath + ' PROJECT_DIR=' + __dirname + '/.. yarn docs:json',
            {
                cwd,
            }
        );
    })
    .then(function(result) {
        if (result.stderr !== '') {
            throw new Error(result.stderr);
        }
        const fileName = 'v' + version + '.json';
        console.log('POSTPUBLISH: Doc generation successful, uploading docs... as ', fileName);
        const s3Url = S3BucketPath + fileName;
        return execAsync('S3_URL=' + s3Url + ' yarn upload_docs_json', {
            cwd,
        });
    }).catch (function(err) {
        throw err;
    });
