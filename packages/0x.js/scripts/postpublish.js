const execAsync = require('async-child-process').execAsync;
const postpublish_utils = require('../../../scripts/postpublish_utils');
const packageJSON = require('../package.json');
const tsConfig = require('../tsconfig.json');

const cwd = __dirname + '/..';
const subPackageName = packageJSON.name;
// Include any external packages that are part of the @0xproject/connect public interface
// to this array so that TypeDoc picks it up and adds it to the Docs JSON
// So far, we only have @0xproject/types as part of 0x.js's public interface.
const fileIncludes = [...tsConfig.include, '../types/src/index.ts'];
const fileIncludesAdjusted = postpublish_utils.adjustFileIncludePaths(fileIncludes, __dirname);
const projectFiles = fileIncludesAdjusted.join(' ');
const S3BucketPath = 's3://0xjs-docs-jsons/';

let tag;
let version;
postpublish_utils
    .getLatestTagAndVersionAsync(subPackageName)
    .then(function(result) {
        tag = result.tag;
        version = result.version;
        const releaseName = postpublish_utils.getReleaseName(subPackageName, version);
        const assets = [__dirname + '/../_bundles/index.js', __dirname + '/../_bundles/index.min.js'];
        return postpublish_utils.publishReleaseNotesAsync(tag, releaseName, assets);
    })
    .then(function(release) {
        console.log('POSTPUBLISH: Release successful, generating docs...');
        const jsonFilePath = __dirname + '/../' + postpublish_utils.generatedDocsDirectoryName + '/index.json';
        return execAsync('JSON_FILE_PATH=' + jsonFilePath + ' PROJECT_FILES="' + projectFiles + '" yarn docs:json', {
            cwd,
        });
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
    })
    .catch(function(err) {
        throw err;
    });
