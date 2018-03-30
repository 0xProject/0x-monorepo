#!/usr/bin/env node

import * as fs from 'fs';
import lernaGetPackages = require('lerna-get-packages');
import * as _ from 'lodash';
import * as moment from 'moment';
import * as path from 'path';
import { exec as execAsync, spawn } from 'promisify-child-process';
import semverDiff = require('semver-diff');
import semverSort = require('semver-sort');

import { constants } from './constants';
import { Changelog, Changes, SemVerIndex, UpdatedPackage } from './types';
import { utils } from './utils';

const IS_DRY_RUN = false;
const TODAYS_TIMESTAMP = moment().unix();
const LERNA_EXECUTABLE = './node_modules/lerna/bin/lerna.js';
const semverNameToIndex: { [semver: string]: number } = {
    patch: SemVerIndex.Patch,
    minor: SemVerIndex.Minor,
    major: SemVerIndex.Major,
};

(async () => {
    const updatedPublicPackages = await getPublicLernaUpdatedPackagesAsync();
    const updatedPackageNames = _.map(updatedPublicPackages, pkg => pkg.name);

    const allLernaPackages = lernaGetPackages(constants.monorepoRootPath);
    const relevantLernaPackages = _.filter(allLernaPackages, pkg => {
        return _.includes(updatedPackageNames, pkg.package.name);
    });
    const relevantPackageNames = _.map(relevantLernaPackages, pkg => pkg.package.name);
    utils.log(`Will update CHANGELOGs and publish: \n${relevantPackageNames.join('\n')}\n`);

    const packageToVersionChange: { [name: string]: string } = {};
    _.each(relevantLernaPackages, lernaPackage => {
        const packageName = lernaPackage.package.name;
        const changelogJSONPath = path.join(lernaPackage.location, 'CHANGELOG.json');
        const changelogJSON = getChangelogJSONOrCreateIfMissing(lernaPackage.package.name, changelogJSONPath);
        let changelogs: Changelog[];
        try {
            changelogs = JSON.parse(changelogJSON);
        } catch (err) {
            throw new Error(
                `${lernaPackage.package.name}'s CHANGELOG.json contains invalid JSON. Please fix and try again.`,
            );
        }

        const currentVersion = lernaPackage.package.version;
        const shouldAddNewEntry = shouldAddNewChangelogEntry(changelogs);
        if (shouldAddNewEntry) {
            // Create a new entry for a patch version with generic changelog entry.
            const nextPatchVersion = utils.getNextPatchVersion(currentVersion);
            const newChangelogEntry: Changelog = {
                timestamp: TODAYS_TIMESTAMP,
                version: nextPatchVersion,
                changes: [
                    {
                        note: 'Dependencies updated',
                    },
                ],
            };
            changelogs = [newChangelogEntry, ...changelogs];
            packageToVersionChange[packageName] = semverDiff(currentVersion, nextPatchVersion);
        } else {
            // Update existing entry with timestamp
            const lastEntry = changelogs[0];
            if (_.isUndefined(lastEntry.timestamp)) {
                lastEntry.timestamp = TODAYS_TIMESTAMP;
            }
            // Check version number is correct.
            const proposedNextVersion = lastEntry.version;
            lastEntry.version = updateVersionNumberIfNeeded(currentVersion, proposedNextVersion);
            changelogs[0] = lastEntry;
            packageToVersionChange[packageName] = semverDiff(currentVersion, lastEntry.version);
        }

        // Save updated CHANGELOG.json
        fs.writeFileSync(changelogJSONPath, JSON.stringify(changelogs, null, '\t'));
        utils.log(`${packageName}: Updated CHANGELOG.json`);
        // Generate updated CHANGELOG.md
        const changelogMd = generateChangelogMd(changelogs);
        const changelogMdPath = path.join(lernaPackage.location, 'CHANGELOG.md');
        fs.writeFileSync(changelogMdPath, changelogMd);
        utils.log(`${packageName}: Updated CHANGELOG.md`);
    });

    if (!IS_DRY_RUN) {
        await execAsync(`git add . --all`, { cwd: constants.monorepoRootPath });
        await execAsync(`git commit -m "Updated CHANGELOGS"`, { cwd: constants.monorepoRootPath });
        await execAsync(`git push`, { cwd: constants.monorepoRootPath });
        utils.log(`Pushed CHANGELOG updates to Github`);
    }

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

async function lernaPublishAsync(packageToVersionChange: { [name: string]: string }) {
    // HACK: Lerna publish does not provide a way to specify multiple package versions via
    // flags so instead we need to interact with their interactive prompt interface.
    const child = spawn('lerna', ['publish', '--registry=https://registry.npmjs.org/'], {
        cwd: constants.monorepoRootPath,
    });
    child.stdout.on('data', (data: Buffer) => {
        const output = data.toString('utf8');
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
        } else if (isFinalPrompt && IS_DRY_RUN) {
            utils.log(
                `Submitted all versions to Lerna but since this is a dry run, did not confirm. You need to CTRL-C to exit.`,
            );
        }
    });
}

async function getPublicLernaUpdatedPackagesAsync(): Promise<UpdatedPackage[]> {
    const result = await execAsync(`${LERNA_EXECUTABLE} updated --json`, { cwd: constants.monorepoRootPath });
    const updatedPackages = JSON.parse(result.stdout);
    const updatedPublicPackages = _.filter(updatedPackages, updatedPackage => !updatedPackage.private);
    return updatedPublicPackages;
}

function updateVersionNumberIfNeeded(currentVersion: string, proposedNextVersion: string) {
    if (proposedNextVersion === currentVersion) {
        return utils.getNextPatchVersion(currentVersion);
    }
    const sortedVersions = semverSort.desc([proposedNextVersion, currentVersion]);
    if (sortedVersions[0] !== proposedNextVersion) {
        return utils.getNextPatchVersion(currentVersion);
    }
    return proposedNextVersion;
}

function getChangelogJSONOrCreateIfMissing(packageName: string, changelogPath: string): string {
    let changelogJSON: string;
    try {
        changelogJSON = fs.readFileSync(changelogPath, 'utf-8');
        return changelogJSON;
    } catch (err) {
        // If none exists, create new, empty one.
        const emptyChangelogJSON = JSON.stringify([]);
        fs.writeFileSync(changelogPath, emptyChangelogJSON);
        return emptyChangelogJSON;
    }
}

function shouldAddNewChangelogEntry(changelogs: Changelog[]): boolean {
    if (_.isEmpty(changelogs)) {
        return true;
    }
    const lastEntry = changelogs[0];
    return !!lastEntry.isPublished;
}

function generateChangelogMd(changelogs: Changelog[]): string {
    let changelogMd = `<!--
This file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG
    `;

    _.each(changelogs, changelog => {
        if (_.isUndefined(changelog.timestamp)) {
            throw new Error(
                'All CHANGELOG.json entries must be updated to include a timestamp before generating their MD version',
            );
        }
        const date = moment(`${changelog.timestamp}`, 'X').format('MMMM D, YYYY');
        const title = `\n## v${changelog.version} - _${date}_\n\n`;
        changelogMd += title;

        let changes = '';
        _.each(changelog.changes, change => {
            let line = `    * ${change.note}`;
            if (!_.isUndefined(change.pr)) {
                line += ` (#${change.pr})`;
            }
            line += '\n';
            changes += line;
        });
        changelogMd += `${changes}`;
    });

    return changelogMd;
}
