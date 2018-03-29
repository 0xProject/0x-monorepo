#!/usr/bin/env node

import * as fs from 'fs';
import lernaGetPackages = require('lerna-get-packages');
import * as _ from 'lodash';
import * as moment from 'moment';
import * as path from 'path';
import { exec as execAsync } from 'promisify-child-process';
import semverSort = require('semver-sort');

import { Changelog, Changes, UpdatedPackage } from './types';
import { utils } from './utils';

const MONOREPO_ROOT_PATH = path.join(__dirname, '../../..');
const TODAYS_TIMESTAMP = moment().unix();

(async () => {
    const updatedPublicPackages = await getPublicLernaUpdatedPackagesAsync();
    const updatedPackageNames = _.map(updatedPublicPackages, pkg => pkg.name);

    const allLernaPackages = lernaGetPackages(MONOREPO_ROOT_PATH);
    const relevantLernaPackages = _.filter(allLernaPackages, pkg => {
        return _.includes(updatedPackageNames, pkg.package.name);
    });
    _.each(relevantLernaPackages, lernaPackage => {
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
        }

        // Save updated CHANGELOG.json
        fs.writeFileSync(changelogJSONPath, JSON.stringify(changelogs, null, '\t'));
        // Generate updated CHANGELOG.md
        const changelogMd = generateChangelogMd(changelogs);
        const changelogMdPath = path.join(lernaPackage.location, 'CHANGELOG.md');
        fs.writeFileSync(changelogMdPath, changelogMd);
    });
})().catch(err => {
    utils.log(err);
    process.exit(1);
});

async function getPublicLernaUpdatedPackagesAsync(): Promise<UpdatedPackage[]> {
    const result = await execAsync(`./node_modules/lerna/bin/lerna.js updated --json`, { cwd: MONOREPO_ROOT_PATH });
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
        const date = moment(changelog.timestamp, 'X').format('MMMM D, YYYY');
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
