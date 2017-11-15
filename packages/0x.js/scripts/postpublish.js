const execAsync = require('async-child-process').execAsync;
const semverSort = require('semver-sort');
const publishRelease = require('publish-release');
const promisify = require('es6-promisify');
const prompt = require('prompt');

const publishReleaseAsync = promisify(publishRelease);
const promptGetAsync = promisify(prompt.get);
const subPackageName = '0x.js';
const subPackagePrefix = subPackageName + '@';
const githubPersonalAccessToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN_0X_JS;
let tag;
let version;
getLatestTagAndVersionAsync(subPackageName)
    .then(function(result) {
        console.log('POSTPUBLISH: Releasing...');
        tag = result.tag;
        version = result.version;
        const releaseName = subPackageName + ' v' + result.version;
        return publishReleaseAsync({
            token: githubPersonalAccessToken,
            owner: '0xProject',
            repo: '0x.js',
            tag: tag,
            name: releaseName,
            notes: 'TODO',
            draft: false,
            prerelease: false,
            reuseRelease: true,
            reuseDraftOnly: false,
            assets: ['_bundles/index.js', '_bundles/index.min.js'],
          });
    })
    .then(function(release) {
        console.log('POSTPUBLISH: Release successful, generating docs...');
        return execAsync('yarn docs:json');
    })
    .then(function(result) {
        if (result.stderr !== '') {
            throw new Error(result.stderr);
        }
        console.log('POSTPUBLISH: Doc generation successful, uploading docs...');
        const s3Url = 's3://0xjs-docs-jsons/v' + version +'.json';
        return execAsync('S3_URL=' + s3Url + ' yarn upload_docs_json');
    });

function getLatestTagAndVersionAsync(subPackageName) {
    const subPackagePrefix = subPackageName + '@';
    const gitTagsCommand = 'git tags -l "' + subPackagePrefix + '*"';
    console.log(gitTagsCommand);
    return execAsync(gitTagsCommand)
        .then(function(result) {
            if (result.stderr !== '') {
                throw new Error(result.stderr);
            }
            const tags = result.stdout.trim().split('\n');
            const versions = tags.map(function(tag) {
                return tag.slice(subPackagePrefix.length);
            });
            const sortedVersions = semverSort.desc(versions);
            const latestVersion = sortedVersions[0];
            const latestTag = subPackagePrefix + latestVersion;
            return {
                tag: latestTag,
                version: latestVersion
            };
        });
}
