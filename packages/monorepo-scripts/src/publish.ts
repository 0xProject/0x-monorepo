#!/usr/bin/env node

import * as promisify from 'es6-promisify';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as moment from 'moment';
import opn = require('opn');
import { exec as execAsync } from 'promisify-child-process';
import * as prompt from 'prompt';
import semver = require('semver');
import semverSort = require('semver-sort');

import { constants } from './constants';
import { Package, PackageToNextVersion, VersionChangelog } from './types';
import { changelogUtils } from './utils/changelog_utils';
import { configs } from './utils/configs';
import { DocGenerateAndUploadUtils } from './utils/doc_generate_and_upload_utils';
import { publishReleaseNotesAsync } from './utils/github_release_utils';
import { utils } from './utils/utils';

const NPM_NAMESPACE = '@0x/';
const TODAYS_TIMESTAMP = moment().unix();

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
    const allPackagesToPublish = await utils.getPackagesToPublishAsync(shouldIncludePrivate);
    if (_.isEmpty(allPackagesToPublish)) {
        utils.log('No packages need publishing');
        process.exit(0);
    }
    const packagesWithDocs = getPackagesWithDocs(allPackagesToPublish);

    if (!configs.IS_LOCAL_PUBLISH) {
        await confirmAsync(
            'THIS IS NOT A TEST PUBLISH! You are about to publish one or more packages to npm. Are you sure you want to continue? (y/n)',
        );
        await confirmDocPagesRenderAsync(packagesWithDocs);
    }

    // Update CHANGELOGs
    const updatedPublicPackages = _.filter(allPackagesToPublish, pkg => !pkg.packageJson.private);
    const updatedPublicPackageNames = _.map(updatedPublicPackages, pkg => pkg.packageJson.name);
    utils.log(`Will update CHANGELOGs and publish: \n${updatedPublicPackageNames.join('\n')}\n`);
    const packageToNextVersion = await updateChangeLogsAsync(updatedPublicPackages);

    const updatedPrivatePackages = _.filter(allPackagesToPublish, pkg => pkg.packageJson.private);
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
    utils.log(`Calling 'lerna publish'...`);
    await lernaPublishAsync(packageToNextVersion);
    if (!configs.IS_LOCAL_PUBLISH) {
        const isStaging = false;
        const shouldUploadDocs = true;
        await generateAndUploadDocJsonsAsync(packagesWithDocs, isStaging, shouldUploadDocs);
    }
    const isDryRun = configs.IS_LOCAL_PUBLISH;
    await publishReleaseNotesAsync(updatedPublicPackages, isDryRun);
})().catch(err => {
    utils.log(err);
    process.exit(1);
});

function getPackagesWithDocs(allUpdatedPackages: Package[]): Package[] {
    const rootPackageJsonPath = `${constants.monorepoRootPath}/package.json`;
    const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath).toString());
    const packagesWithDocPagesStringIfExist = _.get(rootPackageJson, 'config.packagesWithDocPages', undefined);
    if (_.isUndefined(packagesWithDocPagesStringIfExist)) {
        return []; // None to generate & publish
    }
    const packagesWithDocPages = packagesWithDocPagesStringIfExist.split(' ');
    const updatedPackagesWithDocPages: Package[] = [];
    _.each(allUpdatedPackages, pkg => {
        const nameWithoutPrefix = pkg.packageJson.name.replace('@0x/', '');
        if (_.includes(packagesWithDocPages, nameWithoutPrefix)) {
            updatedPackagesWithDocPages.push(pkg);
        }
    });
    return updatedPackagesWithDocPages;
}

async function generateAndUploadDocJsonsAsync(
    packagesWithDocs: Package[],
    isStaging: boolean,
    shouldUploadDocs: boolean,
): Promise<void> {
    for (const pkg of packagesWithDocs) {
        const nameWithoutPrefix = pkg.packageJson.name.replace('@0x/', '');
        const docGenerateAndUploadUtils = new DocGenerateAndUploadUtils(nameWithoutPrefix, isStaging, shouldUploadDocs);
        await docGenerateAndUploadUtils.generateAndUploadDocsAsync();
    }
}

async function confirmDocPagesRenderAsync(packagesWithDocs: Package[]): Promise<void> {
    // push docs to staging
    utils.log("Upload all docJson's to S3 staging...");
    const isStaging = true;
    const shouldUploadDocs = true;
    await generateAndUploadDocJsonsAsync(packagesWithDocs, isStaging, shouldUploadDocs);

    // deploy website to staging
    utils.log('Deploy website to staging...');
    const pathToWebsite = `${constants.monorepoRootPath}/packages/website`;
    await execAsync(`yarn deploy_staging`, { cwd: pathToWebsite });

    _.each(packagesWithDocs, pkg => {
        const name = pkg.packageJson.name;
        const nameWithoutPrefix = _.startsWith(name, NPM_NAMESPACE) ? name.split('@0x/')[1] : name;
        const link = `${constants.stagingWebsite}/docs/${nameWithoutPrefix}`;
        // tslint:disable-next-line:no-floating-promises
        opn(link);
    });

    await confirmAsync('Do all the doc pages render? (y/n)');
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
                        note: constants.dependenciesUpdatedMessage,
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
