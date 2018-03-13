import { execAsync } from 'async-child-process';
import * as promisify from 'es6-promisify';
import * as _ from 'lodash';
import * as publishRelease from 'publish-release';
import semverSort = require('semver-sort');

import { utils } from './utils';

const publishReleaseAsync = promisify(publishRelease);
const githubPersonalAccessToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN_0X_JS;
const generatedDocsDirectoryName = 'generated_docs';

export interface TagAndVersion {
    tag: string;
    version: string;
}

export const postpublishUtils = {
    async getLatestTagAndVersionAsync(subPackageName: string): Promise<TagAndVersion> {
        const subPackagePrefix = `${subPackageName}@`;
        const gitTagsCommand = `git tag -l "${subPackagePrefix}*"`;
        const result = await execAsync(gitTagsCommand);
        if (!_.isEmpty(result.stderr)) {
            throw new Error(result.stderr);
        }
        const tags = result.stdout.trim().split('\n');
        const versions = tags.map((tag: string) => {
            return tag.slice(subPackagePrefix.length);
        });
        const sortedVersions = semverSort.desc(versions);
        const latestVersion = sortedVersions[0];
        const latestTag = subPackagePrefix + latestVersion;
        return {
            tag: latestTag,
            version: latestVersion,
        };
    },
    async publishReleaseNotesAsync(tag: string, releaseName: string, assets: string[]) {
        utils.log('POSTPUBLISH: Releasing ', releaseName, '...');
        return publishReleaseAsync({
            token: githubPersonalAccessToken,
            owner: '0xProject',
            repo: '0x.js',
            tag,
            name: releaseName,
            notes: 'N/A',
            draft: false,
            prerelease: false,
            reuseRelease: true,
            reuseDraftOnly: false,
            assets,
        });
    },
    getReleaseName(subPackageName: string, version: string): string {
        const releaseName = `${subPackageName} v${version}`;
        return releaseName;
    },
    async standardPostPublishAsync(subPackageName: string): Promise<void> {
        const result: TagAndVersion = await this.getLatestTagAndVersionAsync(subPackageName);
        const releaseName = this.getReleaseName(subPackageName, result.version);
        const assets: string[] = [];
        await this.publishReleaseNotesAsync(result.tag, releaseName, assets);
    },
    adjustFileIncludePaths(fileIncludes: string[], cwd: string): string[] {
        const fileIncludesAdjusted = _.map(fileIncludes, fileInclude => {
            let path;
            if (_.startsWith(fileInclude, '../')) {
                path = `${cwd}/../${fileInclude}`;
            } else if (_.startsWith(fileInclude, './')) {
                path = `${cwd}/../${fileInclude.substr(2)}`;
            } else {
                path = `${cwd}/${fileInclude}`;
            }

            // HACK: tsconfig.json needs wildcard directory endings as `/**/*`
            // but TypeDoc needs it as `/**` in order to pick up files at the root
            if (_.endsWith(path, '/**/*')) {
                path = path.slice(0, -2);
            }
            return path;
        });
        return fileIncludesAdjusted;
    },
    generatedDocsDirectoryName,
};
