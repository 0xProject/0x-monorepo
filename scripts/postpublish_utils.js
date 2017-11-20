const execAsync = require('async-child-process').execAsync;
const semverSort = require('semver-sort');
const promisify = require('es6-promisify');
const publishRelease = require('publish-release');

const publishReleaseAsync = promisify(publishRelease);
const githubPersonalAccessToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN_0X_JS;

module.exports = {
    getLatestTagAndVersionAsync: function(subPackageName) {
        const subPackagePrefix = subPackageName + '@';
        const gitTagsCommand = 'git tags -l "' + subPackagePrefix + '*"';
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
    publishReleaseNotes: function(tag, releaseName, assets) {
        console.log('POSTPUBLISH: Releasing ', releaseName, '...');
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
            assets: assets,
         });
    },
    getReleaseName(subPackageName, version) {
        const releaseName = subPackageName + ' v' + version;
        return releaseName;
    },
};
