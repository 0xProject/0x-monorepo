const execAsync = require('async-child-process').execAsync;
const postpublish_utils = require('../../../scripts/postpublish_utils');

const cwd = __dirname + '/..';
const subPackageName = '0x.js';

let tag;
let version;
postpublish_utils.getLatestTagAndVersionAsync(subPackageName)
    .then(function(result) {
        console.log('POSTPUBLISH: Releasing...');
        tag = result.tag;
        version = result.version;
         const releaseName = subPackageName + ' v' + version;
         const assets = [
             __dirname + '/../_bundles/index.js',
             __dirname + '/../_bundles/index.min.js',
         ];
         return postpublish_utils.publishReleaseNotes(tag, releaseName, assets);
    })
    .then(function(release) {
        console.log('POSTPUBLISH: Release successful, generating docs...');
        return execAsync(
            'JSON_FILE_PATH=' +  __dirname + '/../docs/index.json PROJECT_DIR=' + __dirname + '/.. yarn docs:json',
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
        const s3Url = 's3://0xjs-docs-jsons/' + fileName;
        return execAsync('S3_URL=' + s3Url + ' yarn upload_docs_json', {
            cwd,
        });
    }).catch (function(err) {
        throw err;
    });
