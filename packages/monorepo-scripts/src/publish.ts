#!/usr/bin/env node

import * as promisify from 'es6-promisify';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as moment from 'moment';
import opn = require('opn');
import * as path from 'path';
import { exec as execAsync, spawn } from 'promisify-child-process';
import * as prompt from 'prompt';
import semverDiff = require('semver-diff');
import semverSort = require('semver-sort');

import { constants } from './constants';
import { Changelog, PackageToVersionChange, SemVerIndex, VersionChangelog } from './types';
import { changelogUtils } from './utils/changelog_utils';
import { utils } from './utils/utils';

const DOC_GEN_COMMAND = 'docs:json';
const NPM_NAMESPACE = '@0xproject/';
const IS_DRY_RUN = process.env.IS_DRY_RUN === 'true';
const TODAYS_TIMESTAMP = moment().unix();
const semverNameToIndex: { [semver: string]: number } = {
    patch: SemVerIndex.Patch,
    minor: SemVerIndex.Minor,
    major: SemVerIndex.Major,
};
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
};

(async () => {
    // Fetch public, updated Lerna packages
    const shouldIncludePrivate = false;
    const updatedPublicLernaPackages = await utils.getUpdatedLernaPackagesAsync(shouldIncludePrivate);

    await confirmDocPagesRenderAsync(updatedPublicLernaPackages);

    // Update CHANGELOGs
    const updatedPublicLernaPackageNames = _.map(updatedPublicLernaPackages, pkg => pkg.package.name);
    utils.log(`Will update CHANGELOGs and publish: \n${updatedPublicLernaPackageNames.join('\n')}\n`);
    const packageToVersionChange = await updateChangeLogsAsync(updatedPublicLernaPackages);

    // Push changelog changes to Github
    if (!IS_DRY_RUN) {
        await pushChangelogsToGithubAsync();
    }

    // Call LernaPublish
    utils.log('Version updates to apply:');
    _.each(packageToVersionChange, (versionChange: string, packageName: string) => {
        utils.log(`${packageName} -> ${versionChange}`);
    });
    utils.log(`Calling 'lerna publish'...`);
    await lernaPublishAsync(packageToVersionChange);
})().catch(err => {
    utils.log(err);
    process.exit(1);
});

async function confirmDocPagesRenderAsync(packages: LernaPackage[]): Promise<void> {
    // push docs to staging
    utils.log("Upload all docJson's to S3 staging...");
    await execAsync(`yarn stage_docs`, { cwd: constants.monorepoRootPath });

    // deploy website to staging
    utils.log('Deploy website to staging...');
    const pathToWebsite = `${constants.monorepoRootPath}/packages/website`;
    await execAsync(`yarn deploy_staging`, { cwd: pathToWebsite });

    const packagesWithDocs = _.filter(packages, pkg => {
        const scriptsIfExists = pkg.package.scripts;
        if (_.isUndefined(scriptsIfExists)) {
            throw new Error('Found a public package without any scripts in package.json');
        }
        return !_.isUndefined(scriptsIfExists[DOC_GEN_COMMAND]);
    });
    _.each(packagesWithDocs, pkg => {
        const name = pkg.package.name;
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

    prompt.start();
    const message = 'Do all the doc pages render properly? (yn)';
    const result = await promisify(prompt.get)([message]);
    const didConfirm = result[message] === 'y';
    if (!didConfirm) {
        utils.log('Publish process aborted.');
        process.exit(0);
    }
}

async function pushChangelogsToGithubAsync(): Promise<void> {
    await execAsync(`git add . --all`, { cwd: constants.monorepoRootPath });
    await execAsync(`git commit -m "Updated CHANGELOGS"`, { cwd: constants.monorepoRootPath });
    await execAsync(`git push`, { cwd: constants.monorepoRootPath });
    utils.log(`Pushed CHANGELOG updates to Github`);
}

async function updateChangeLogsAsync(updatedPublicLernaPackages: LernaPackage[]): Promise<PackageToVersionChange> {
    const packageToVersionChange: PackageToVersionChange = {};
    for (const lernaPackage of updatedPublicLernaPackages) {
        const packageName = lernaPackage.package.name;
        const changelogJSONPath = path.join(lernaPackage.location, 'CHANGELOG.json');
        const changelogJSON = utils.getChangelogJSONOrCreateIfMissing(changelogJSONPath);
        let changelog: Changelog;
        try {
            changelog = JSON.parse(changelogJSON);
        } catch (err) {
            throw new Error(
                `${lernaPackage.package.name}'s CHANGELOG.json contains invalid JSON. Please fix and try again.`,
            );
        }

        const currentVersion = lernaPackage.package.version;
        const shouldAddNewEntry = changelogUtils.shouldAddNewChangelogEntry(currentVersion, changelog);
        if (shouldAddNewEntry) {
            // Create a new entry for a patch version with generic changelog entry.
            const nextPatchVersion = utils.getNextPatchVersion(currentVersion);
            const newChangelogEntry: VersionChangelog = {
                timestamp: TODAYS_TIMESTAMP,
                version: nextPatchVersion,
                changes: [
                    {
                        note: 'Dependencies updated',
                    },
                ],
            };
            changelog = [newChangelogEntry, ...changelog];
            packageToVersionChange[packageName] = semverDiff(currentVersion, nextPatchVersion);
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
            packageToVersionChange[packageName] = semverDiff(currentVersion, lastEntry.version);
        }

        // Save updated CHANGELOG.json
        fs.writeFileSync(changelogJSONPath, JSON.stringify(changelog, null, '\t'));
        await utils.prettifyAsync(changelogJSONPath, constants.monorepoRootPath);
        utils.log(`${packageName}: Updated CHANGELOG.json`);
        // Generate updated CHANGELOG.md
        const changelogMd = changelogUtils.generateChangelogMd(changelog);
        const changelogMdPath = path.join(lernaPackage.location, 'CHANGELOG.md');
        fs.writeFileSync(changelogMdPath, changelogMd);
        await utils.prettifyAsync(changelogMdPath, constants.monorepoRootPath);
        utils.log(`${packageName}: Updated CHANGELOG.md`);
    }

    return packageToVersionChange;
}

async function lernaPublishAsync(packageToVersionChange: { [name: string]: string }): Promise<void> {
    // HACK: Lerna publish does not provide a way to specify multiple package versions via
    // flags so instead we need to interact with their interactive prompt interface.
    const PACKAGE_REGISTRY = 'https://registry.npmjs.org/';
    const child = spawn('lerna', ['publish', `--registry=${PACKAGE_REGISTRY}`], {
        cwd: constants.monorepoRootPath,
    });
    let shouldPrintOutput = false;
    child.stdout.on('data', (data: Buffer) => {
        const output = data.toString('utf8');
        if (shouldPrintOutput) {
            utils.log(output);
        }
        const isVersionPrompt = _.includes(output, 'Select a new version');
        if (isVersionPrompt) {
            const outputStripLeft = output.split('new version for ')[1];
            const packageName = outputStripLeft.split(' ')[0];
            let versionChange = packageToVersionChange[packageName];
            const isPrivatePackage = _.isUndefined(versionChange);
            if (isPrivatePackage) {
                versionChange = 'patch'; // Always patch updates to private packages.
            }
            const semVerIndex = semverNameToIndex[versionChange];
            child.stdin.write(`${semVerIndex}\n`);
        }
        const isFinalPrompt = _.includes(output, 'Are you sure you want to publish the above changes?');
        if (isFinalPrompt && !IS_DRY_RUN) {
            child.stdin.write(`y\n`);
            // After confirmations, we want to print the output to watch the `lerna publish` command
            shouldPrintOutput = true;
        } else if (isFinalPrompt && IS_DRY_RUN) {
            utils.log(
                `Submitted all versions to Lerna but since this is a dry run, did not confirm. You need to CTRL-C to exit.`,
            );
        }
    });
    child.stderr.on('data', (data: Buffer) => {
        const output = data.toString('utf8');
        utils.log('Stderr:', output);
    });
}

function updateVersionNumberIfNeeded(currentVersion: string, proposedNextVersion: string): string {
    if (proposedNextVersion === currentVersion) {
        return utils.getNextPatchVersion(currentVersion);
    }
    const sortedVersions = semverSort.desc([proposedNextVersion, currentVersion]);
    if (sortedVersions[0] !== proposedNextVersion) {
        return utils.getNextPatchVersion(currentVersion);
    }
    return proposedNextVersion;
}
