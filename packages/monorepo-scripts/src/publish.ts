#!/usr/bin/env node

import * as promisify from 'es6-promisify';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as moment from 'moment';
import opn = require('opn');
import * as path from 'path';
import { exec as execAsync } from 'promisify-child-process';
import * as prompt from 'prompt';
import semver = require('semver');
import semverSort = require('semver-sort');

import { constants } from './constants';
import { Package, PackageToNextVersion, VersionChangelog } from './types';
import { changelogUtils } from './utils/changelog_utils';
import { configs } from './utils/configs';
import { utils } from './utils/utils';

const DOC_GEN_COMMAND = 'docs:json';
const NPM_NAMESPACE = '@0xproject/';
const TODAYS_TIMESTAMP = moment().unix();
const packageNameToWebsitePath: { [name: string]: string } = {
    '0x.js': '0xjs',
    'web3-wrapper': 'web3_wrapper',
    contracts: 'contracts',
    connect: 'connect',
    'json-schemas': 'json-schemas',
    'sol-compiler': 'sol-compiler',
    'sol-cov': 'sol-cov',
    subproviders: 'subproviders',
    'order-utils': 'order-utils',
    'ethereum-types': 'ethereum-types',
};

const writeFileAsync = promisify(fs.writeFile);

async function confirmAsync(message: string): Promise<void> {
    prompt.start();
    const result = await promisify(prompt.get)([message]);
    const didConfirm = result[message] === 'y';
    if (!didConfirm) {
        utils.log('Publish process aborted.');
        process.exit(0);
    }
}

(async () => {
    // Fetch public, updated Lerna packages
    const shouldIncludePrivate = true;
    const allUpdatedPackages = await utils.getUpdatedPackagesAsync(shouldIncludePrivate);

    if (!configs.IS_LOCAL_PUBLISH) {
        await confirmAsync(
            'THIS IS NOT A TEST PUBLISH! You are about to publish one or more packages to npm. Are you sure you want to continue? (y/n)',
        );
        await confirmDocPagesRenderAsync(allUpdatedPackages);
    }

    // Update CHANGELOGs
    const updatedPublicPackages = _.filter(allUpdatedPackages, pkg => !pkg.packageJson.private);
    const updatedPublicPackageNames = _.map(updatedPublicPackages, pkg => pkg.packageJson.name);
    utils.log(`Will update CHANGELOGs and publish: \n${updatedPublicPackageNames.join('\n')}\n`);
    const packageToNextVersion = await updateChangeLogsAsync(updatedPublicPackages);

    const updatedPrivatePackages = _.filter(allUpdatedPackages, pkg => pkg.packageJson.private);
    _.each(updatedPrivatePackages, pkg => {
        const currentVersion = pkg.packageJson.version;
        const packageName = pkg.packageJson.name;
        const nextPatchVersionIfValid = semver.inc(currentVersion, 'patch');
        if (!_.isNull(nextPatchVersionIfValid)) {
            packageToNextVersion[packageName] = nextPatchVersionIfValid;
        } else {
            throw new Error(`Encountered invalid semver version: ${currentVersion} for package: ${packageName}`);
        }
    });

    // Push changelog changes to Github
    if (!configs.IS_LOCAL_PUBLISH) {
        await pushChangelogsToGithubAsync();
    }

    // Call LernaPublish
    utils.log('Version updates to apply:');
    _.each(packageToNextVersion, (versionChange: string, packageName: string) => {
        utils.log(`${packageName} -> ${versionChange}`);
    });
    utils.log('Adding beta tag to package.json where needed...');
    await updateAllNpmBetaTagsAsync(updatedPublicPackages, packageToNextVersion);
    utils.log(`Calling 'lerna publish'...`);
    await lernaPublishAsync(packageToNextVersion);
})().catch(err => {
    utils.log(err);
    process.exit(1);
});

async function confirmDocPagesRenderAsync(packages: Package[]): Promise<void> {
    // push docs to staging
    utils.log("Upload all docJson's to S3 staging...");
    await execAsync(`yarn stage_docs`, { cwd: constants.monorepoRootPath });

    // deploy website to staging
    utils.log('Deploy website to staging...');
    const pathToWebsite = `${constants.monorepoRootPath}/packages/website`;
    await execAsync(`yarn deploy_staging`, { cwd: pathToWebsite });

    const packagesWithDocs = _.filter(packages, pkg => {
        const scriptsIfExists = pkg.packageJson.scripts;
        if (_.isUndefined(scriptsIfExists)) {
            throw new Error('Found a public package without any scripts in package.json');
        }
        return !_.isUndefined(scriptsIfExists[DOC_GEN_COMMAND]);
    });
    _.each(packagesWithDocs, pkg => {
        const name = pkg.packageJson.name;
        const nameWithoutPrefix = _.startsWith(name, NPM_NAMESPACE) ? name.split('@0xproject/')[1] : name;
        const docSegmentIfExists = packageNameToWebsitePath[nameWithoutPrefix];
        if (_.isUndefined(docSegmentIfExists)) {
            throw new Error(
                `Found package '${name}' with doc commands but no corresponding docSegment in monorepo_scripts
package.ts. Please add an entry for it and try again.`,
            );
        }
        const link = `${constants.stagingWebsite}/docs/${docSegmentIfExists}`;
        // tslint:disable-next-line:no-floating-promises
        opn(link);
    });

    await confirmAsync('Do all the doc pages render properly? (y/n)');
}

async function pushChangelogsToGithubAsync(): Promise<void> {
    await execAsync(`git add . --all`, { cwd: constants.monorepoRootPath });
    await execAsync(`git commit -m "Updated CHANGELOGS"`, { cwd: constants.monorepoRootPath });
    await execAsync(`git push`, { cwd: constants.monorepoRootPath });
    utils.log(`Pushed CHANGELOG updates to Github`);
}

async function updateChangeLogsAsync(updatedPublicPackages: Package[]): Promise<PackageToNextVersion> {
    const packageToNextVersion: PackageToNextVersion = {};
    for (const pkg of updatedPublicPackages) {
        const packageName = pkg.packageJson.name;
        let changelog = changelogUtils.getChangelogOrCreateIfMissing(packageName, pkg.location);

        const currentVersion = pkg.packageJson.version;
        const shouldAddNewEntry = changelogUtils.shouldAddNewChangelogEntry(
            pkg.packageJson.name,
            currentVersion,
            changelog,
        );
        if (shouldAddNewEntry) {
            // Create a new entry for a patch version with generic changelog entry.
            const nextPatchVersionIfValid = semver.inc(currentVersion, 'patch');
            if (_.isNull(nextPatchVersionIfValid)) {
                throw new Error(`Encountered invalid semver version: ${currentVersion} for package: ${packageName}`);
            }
            const newChangelogEntry: VersionChangelog = {
                timestamp: TODAYS_TIMESTAMP,
                version: nextPatchVersionIfValid,
                changes: [
                    {
                        note: 'Dependencies updated',
                    },
                ],
            };
            changelog = [newChangelogEntry, ...changelog];
            packageToNextVersion[packageName] = nextPatchVersionIfValid;
        } else {
            // Update existing entry with timestamp
            const lastEntry = changelog[0];
            if (_.isUndefined(lastEntry.timestamp)) {
                lastEntry.timestamp = TODAYS_TIMESTAMP;
            }
            // Check version number is correct.
            const proposedNextVersion = lastEntry.version;
            lastEntry.version = updateVersionNumberIfNeeded(currentVersion, proposedNextVersion);
            changelog[0] = lastEntry;
            packageToNextVersion[packageName] = lastEntry.version;
        }

        // Save updated CHANGELOG.json
        await changelogUtils.writeChangelogJsonFileAsync(pkg.location, changelog);
        utils.log(`${packageName}: Updated CHANGELOG.json`);
        // Generate updated CHANGELOG.md
        const changelogMd = changelogUtils.generateChangelogMd(changelog);
        await changelogUtils.writeChangelogMdFileAsync(pkg.location, changelogMd);
        utils.log(`${packageName}: Updated CHANGELOG.md`);
    }

    return packageToNextVersion;
}

async function updateAllNpmBetaTagsAsync(updatedPublicPackages: Package[], packageToNextVersion: PackageToNextVersion): Promise<void> {
    _.each(updatedPublicPackages, async pkg => {
        const packageName = pkg.packageJson.name;
        const nextVersion = packageToNextVersion[packageName];
        const semVersion = semver.parse(nextVersion) as semver.SemVer;
        if (semVersion.prerelease != null && semVersion.prerelease.length > 0) {
            await addNpmBetaTagIfNeededAsync(pkg);
        } else {
            await removeNpmBetaTagIfNeededAsync(pkg);
        }
    });
}

async function addNpmBetaTagIfNeededAsync(pkg: Package): Promise<void> {
    if (!packageHasNpmBetaTag(pkg)) {
        const updatedPackageJson = _.cloneDeep(pkg.packageJson);
        _.set(updatedPackageJson, ['publishConfig', 'tag'], 'beta');
        const jsonPath = path.join(pkg.location, 'package.json');
        utils.log(`Adding beta tag to ${pkg.packageJson.name}`);
        await writeFileAsync(jsonPath, JSON.stringify(updatedPackageJson, null, 2));
    }
}

async function removeNpmBetaTagIfNeededAsync(pkg: Package): Promise<void> {
    if (packageHasNpmBetaTag(pkg)) {
        const updatedPackageJson = _.cloneDeep(pkg.packageJson);
        _.omit(updatedPackageJson, ['publishConfig', 'tag']);
        const jsonPath = path.join(pkg.location, 'package.json');
        utils.log(`Removing beta tag from ${pkg.packageJson.name}`);
        await writeFileAsync(jsonPath, JSON.stringify(updatedPackageJson));
    }
}

function packageHasNpmBetaTag(pkg: Package): boolean {
    return _.get(pkg.packageJson, ['publishConfig', 'tag']) === 'beta';
}

async function lernaPublishAsync(packageToNextVersion: { [name: string]: string }): Promise<void> {
    const packageVersionString = _.map(packageToNextVersion, (nextVersion: string, packageName: string) => {
        return `${packageName}@${nextVersion}`;
    }).join(',');
    let lernaPublishCmd = `node ${constants.lernaExecutable} publish --cdVersions=${packageVersionString} --registry=${
        configs.NPM_REGISTRY_URL
    } --yes`;
    if (configs.IS_LOCAL_PUBLISH) {
        lernaPublishCmd += ` --skip-git`;
    }
    utils.log('Lerna is publishing...');
    await execAsync(lernaPublishCmd, { cwd: constants.monorepoRootPath });
}

function updateVersionNumberIfNeeded(currentVersion: string, proposedNextVersion: string): string {
    const updatedVersionIfValid = semver.inc(currentVersion, 'patch');
    if (_.isNull(updatedVersionIfValid)) {
        throw new Error(`Encountered invalid semver: ${currentVersion}`);
    }
    if (proposedNextVersion === currentVersion) {
        return updatedVersionIfValid;
    }
    const sortedVersions = semverSort.desc([proposedNextVersion, currentVersion]);
    if (sortedVersions[0] !== proposedNextVersion) {
        return updatedVersionIfValid;
    }
    return proposedNextVersion;
}
