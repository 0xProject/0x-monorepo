const execAsync = require('async-child-process').execAsync;
const semverSort = require('semver-sort');

const packagePrefix = '0x.js@';
const gitTagsCommand = 'git tags -l "' + packagePrefix + '*"';
let latestTag;
execAsync(gitTagsCommand)
    .then(function(result) {
        if (result.stderr !== '') {
            throw new Error(result.stderr);
        }
        const tags = result.stdout.trim().split('\n');
        const versions = tags.map(function(tag) {
            return tag.slice(packagePrefix.length);
        });
        const sortedVersions = semverSort.desc(versions);
        latestTag = packagePrefix + sortedVersions[0];
        return execAsync('LATEST_TAG=' + latestTag + ' yarn release');
    })
    .then(function(result) {
        if (result.stderr !== '') {
            throw new Error(result.stderr);
        }
        return execAsync('yarn docs:json');        
    })
    .then(function(result) {
        if (result.stderr !== '') {
            throw new Error(result.stderr);
        }
        const s3Url = 's3://0xjs-docs-jsons/v' + latestTag +'.json';
        return execAsync('S3_URL=' + s3Url + ' yarn upload_docs_json');  
    });
