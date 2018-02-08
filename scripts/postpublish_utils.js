const execAsync = require('async-child-process').execAsync;
const semverSort = require('semver-sort');
const publishRelease = require('publish-release');
const promisify = require('@0xproject/utils').promisify;

const publishReleaseAsync = promisify(publishRelease);
const githubPersonalAccessToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN_0X_JS;
const generatedDocsDirectoryName = 'generated_docs';

module.exports = {
    getLatestTagAndVersionAsync: function(subPackageName) {
        const subPackagePrefix = subPackageName + '@';
        const gitTagsCommand = 'git tag -l "' + subPackagePrefix + '*"';
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
    },
    publishReleaseNotesAsync: function(tag, releaseName, assets) {
        console.log('POSTPUBLISH: Releasing ', releaseName, '...');
        return publishReleaseAsync({
            token: githubPersonalAccessToken,
            owner: '0xProject',
            repo: '0x.js',
            tag: tag,
            name: releaseName,
            notes: 'N/A',
            draft: false,
            prerelease: false,
            reuseRelease: true,
            reuseDraftOnly: false,
            assets: assets,
         });
    },
    getReleaseName(subPackageName, version) {
        const releaseName = subPackageName + ' v' + version;
        return releaseName;
    },
    standardPostPublishAsync: function(subPackageName) {
        return this.getLatestTagAndVersionAsync(subPackageName)
            .then(function(result) {
                const releaseName = this.getReleaseName(subPackageName, result.version);
                const assets = [];
                return this.publishReleaseNotesAsync(result.tag, releaseName, assets);
            }.bind(this))
            .catch(function(err) {
                throw err;
            });
    },
    generatedDocsDirectoryName,
};
