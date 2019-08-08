import { PackageJSON } from '@0x/types';
import batchPackages = require('@lerna/batch-packages');
import * as fs from 'fs';
import * as _ from 'lodash';
import { exec as execAsync } from 'promisify-child-process';
import semver = require('semver');

import { constants } from '../constants';
import { GitTagsByPackageName, Package, UpdatedPackage } from '../types';

import { changelogUtils } from './changelog_utils';

export const utils = {
    log(...args: any[]): void {
        console.log(...args); // tslint:disable-line:no-console
    },
    readJSONFile<T>(path: string): T {
        const JSONString = fs.readFileSync(path, 'utf8');
        const parsed: T = JSON.parse(JSONString);
        return parsed;
    },
    getTopologicallySortedPackages(rootDir: string): Package[] {
        const packages = utils.getPackages(rootDir);
        const batchedPackages: PackageJSON[] = _.flatten(batchPackages(_.map(packages, pkg => pkg.packageJson), false));
        const topsortedPackages: Package[] = _.map(
            batchedPackages,
            (pkg: PackageJSON) => _.find(packages, pkg1 => pkg1.packageJson.name === pkg.name) as Package,
        );
        return topsortedPackages;
    },
    getPackages(rootDir: string): Package[] {
        const rootPackageJson = utils.readJSONFile<PackageJSON>(`${rootDir}/package.json`);
        if (rootPackageJson.workspaces === undefined) {
            throw new Error(`Did not find 'workspaces' key in root package.json`);
        }
        const packages = [];
        for (const workspace of rootPackageJson.workspaces) {
            // HACK: Remove allowed wildcards from workspace entries.
            // This might be entirely comprehensive.
            const workspacePath = workspace.replace('*', '').replace('**/*', '');
            const subpackageNames = fs.readdirSync(`${rootDir}/${workspacePath}`);
            for (const subpackageName of subpackageNames) {
                if (_.startsWith(subpackageName, '.')) {
                    continue;
                }
                const pathToPackageJson = `${rootDir}/${workspacePath}${subpackageName}`;
                try {
                    const packageJson = utils.readJSONFile<PackageJSON>(`${pathToPackageJson}/package.json`);
                    const pkg = {
                        location: pathToPackageJson,
                        packageJson,
                    };
                    packages.push(pkg);
                } catch (err) {
                    // Couldn't find a 'package.json' for package. Skipping.
                }
            }
        }
        return packages;
    },
    async getPackagesByNameAsync(packageNames: string[]): Promise<Package[]> {
        const allPackages = utils.getPackages(constants.monorepoRootPath);
        const updatedPackages = _.filter(allPackages, pkg => {
            return _.includes(packageNames, pkg.packageJson.name);
        });
        return updatedPackages;
    },
    async getPackagesToPublishAsync(shouldIncludePrivate: boolean): Promise<Package[]> {
        const updatedPublicPackages = await utils.getLernaUpdatedPackagesAsync(shouldIncludePrivate);
        const updatedPackageNames = _.map(updatedPublicPackages, pkg => pkg.name);

        const allPackages = utils.getPackages(constants.monorepoRootPath);
        const updatedPackages = _.filter(allPackages, pkg => {
            return _.includes(updatedPackageNames, pkg.packageJson.name);
        });
        return updatedPackages;
    },
    async getLernaUpdatedPackagesAsync(shouldIncludePrivate: boolean): Promise<UpdatedPackage[]> {
        try {
            const result = await execAsync(
                `${constants.lernaExecutable} changed --json ${shouldIncludePrivate ? '--all' : ''}`,
                {
                    cwd: constants.monorepoRootPath,
                },
            );
            if (result.stdout === '') {
                return [];
            }
            const updatedPackages = JSON.parse(result.stdout);
            return updatedPackages;
        } catch (err) {
            return [];
        }
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
            return nextVersionIfValid as string;
        }
        const lastEntry = changelog[0];
        if (semver.gt(currentVersion, lastEntry.version)) {
            throw new Error(`Package.json version cannot be greater then last CHANGELOG entry. Check: ${packageName}`);
        }
        nextVersionIfValid = semver.eq(lastEntry.version, currentVersion)
            ? semver.inc(currentVersion, 'patch')
            : lastEntry.version;
        if (nextVersionIfValid === null) {
            throw new Error(`Encountered invalid semver: ${currentVersion} associated with ${packageName}`);
        }
        return nextVersionIfValid;
    },
    async getRemoteGitTagsAsync(): Promise<string[]> {
        const TEN_MEGA_BYTES = 1024 * 1024 * 10; // tslint:disable-line custom-no-magic-numbers
        const result = await execAsync(`git ls-remote --tags`, {
            cwd: constants.monorepoRootPath,
            maxBuffer: TEN_MEGA_BYTES,
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
        const result = await execAsync(`git tag`, {
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
            if (packageNameIfExists === undefined) {
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
        try {
            await execAsync(`git tag -d ${tagName}`, {
                cwd: constants.monorepoRootPath,
            });
        } catch (err) {
            throw new Error(`Failed to delete local git tag. Got err: ${err}`);
        }
        utils.log(`Removed local tag: ${tagName}`);
    },
    async removeRemoteTagAsync(tagName: string): Promise<void> {
        try {
            await execAsync(`git push origin ${tagName}`, {
                cwd: constants.monorepoRootPath,
            });
        } catch (err) {
            throw new Error(`Failed to delete remote git tag. Got err: ${err}`);
        }
        utils.log(`Removed remote tag: ${tagName}`);
    },
};
