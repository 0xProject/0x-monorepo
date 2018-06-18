import lernaGetPackages = require('lerna-get-packages');
import * as _ from 'lodash';
import { exec as execAsync } from 'promisify-child-process';
import semver = require('semver');

import { constants } from '../constants';
import { GitTagsByPackageName, UpdatedPackage } from '../types';

import { changelogUtils } from './changelog_utils';

export const utils = {
    log(...args: any[]): void {
        console.log(...args); // tslint:disable-line:no-console
    },
    async getUpdatedLernaPackagesAsync(shouldIncludePrivate: boolean): Promise<LernaPackage[]> {
        const updatedPublicPackages = await this.getLernaUpdatedPackagesAsync(shouldIncludePrivate);
        const updatedPackageNames = _.map(updatedPublicPackages, pkg => pkg.name);

        const allLernaPackages = lernaGetPackages(constants.monorepoRootPath);
        const updatedPublicLernaPackages = _.filter(allLernaPackages, pkg => {
            return _.includes(updatedPackageNames, pkg.package.name);
        });
        return updatedPublicLernaPackages;
    },
    async getLernaUpdatedPackagesAsync(shouldIncludePrivate: boolean): Promise<UpdatedPackage[]> {
        const result = await execAsync(`${constants.lernaExecutable} updated --json`, {
            cwd: constants.monorepoRootPath,
        });
        const updatedPackages = JSON.parse(result.stdout);
        if (!shouldIncludePrivate) {
            const updatedPublicPackages = _.filter(updatedPackages, updatedPackage => !updatedPackage.private);
            return updatedPublicPackages;
        }
        return updatedPackages;
    },
    async getNextPackageVersionAsync(
        currentVersion: string,
        packageName: string,
        packageLocation: string,
    ): Promise<string> {
        let nextVersionIfValid;
        const changelog = changelogUtils.getChangelogOrCreateIfMissing(packageName, packageLocation);
        if (_.isEmpty(changelog)) {
            nextVersionIfValid = semver.inc(currentVersion, 'patch');
        }
        const lastEntry = changelog[0];
        nextVersionIfValid = semver.eq(lastEntry.version, currentVersion)
            ? semver.inc(currentVersion, 'patch')
            : lastEntry.version;
        if (_.isNull(nextVersionIfValid)) {
            throw new Error(`Encountered invalid semver: ${currentVersion} associated with ${packageName}`);
        }
        return nextVersionIfValid;
    },
    async getRemoteGitTagsAsync(): Promise<string[]> {
        const result = await execAsync(`git ls-remote --tags`, {
            cwd: constants.monorepoRootPath,
        });
        const tagsString = result.stdout;
        const tagOutputs: string[] = tagsString.split('\n');
        const tags = _.compact(
            _.map(tagOutputs, tagOutput => {
                const tag = tagOutput.split('refs/tags/')[1];
                // Tags with `^{}` are duplicateous so we ignore them
                // Source: https://stackoverflow.com/questions/15472107/when-listing-git-ls-remote-why-theres-after-the-tag-name
                if (_.endsWith(tag, '^{}')) {
                    return undefined;
                }
                return tag;
            }),
        );
        return tags;
    },
    async getLocalGitTagsAsync(): Promise<string[]> {
        const result = await execAsync(`git tags`, {
            cwd: constants.monorepoRootPath,
        });
        const tagsString = result.stdout;
        const tags = tagsString.split('\n');
        return tags;
    },
    async getGitTagsByPackageNameAsync(packageNames: string[], gitTags: string[]): Promise<GitTagsByPackageName> {
        const tagVersionByPackageName: GitTagsByPackageName = {};
        _.each(gitTags, tag => {
            const packageNameIfExists = _.find(packageNames, name => {
                return _.includes(tag, `${name}@`);
            });
            if (_.isUndefined(packageNameIfExists)) {
                return; // ignore tags not related to a package we care about.
            }
            const splitTag = tag.split(`${packageNameIfExists}@`);
            if (splitTag.length !== 2) {
                throw new Error(`Unexpected tag name found: ${tag}`);
            }
            const version = splitTag[1];
            (tagVersionByPackageName[packageNameIfExists] || (tagVersionByPackageName[packageNameIfExists] = [])).push(
                version,
            );
        });
        return tagVersionByPackageName;
    },
    async removeLocalTagAsync(tagName: string): Promise<void> {
        const result = await execAsync(`git tag -d ${tagName}`, {
            cwd: constants.monorepoRootPath,
        });
        if (!_.isEmpty(result.stderr)) {
            throw new Error(`Failed to delete local git tag. Got err: ${result.stderr}`);
        }
    },
    async removeRemoteTagAsync(tagName: string): Promise<void> {
        const result = await execAsync(`git push origin ${tagName}`, {
            cwd: constants.monorepoRootPath,
        });
        if (!_.isEmpty(result.stderr)) {
            throw new Error(`Failed to delete remote git tag. Got err: ${result.stderr}`);
        }
    },
};
