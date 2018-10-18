import * as fs from 'fs';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as path from 'path';
import { exec as execAsync } from 'promisify-child-process';
import semver = require('semver');

import { constants } from '../constants';
import { Change, Changelog, VersionChangelog } from '../types';

const CHANGELOG_MD_HEADER = `
<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG
`;

export const changelogUtils = {
    getChangelogMdTitle(versionChangelog: VersionChangelog): string {
        // Use UTC rather than the local machines time (formatted date time is +0:00)
        const date = moment.utc(`${versionChangelog.timestamp}`, 'X').format('MMMM D, YYYY');
        const title = `\n## v${versionChangelog.version} - _${date}_\n\n`;
        return title;
    },
    getChangelogMdChange(change: Change): string {
        let line = `    * ${change.note}`;
        if (!_.isUndefined(change.pr)) {
            line += ` (#${change.pr})`;
        }
        return line;
    },
    generateChangelogMd(changelog: Changelog): string {
        let changelogMd = CHANGELOG_MD_HEADER;
        _.each(changelog, versionChangelog => {
            const title = changelogUtils.getChangelogMdTitle(versionChangelog);
            changelogMd += title;
            const changelogVersionLines = _.map(
                versionChangelog.changes,
                changelogUtils.getChangelogMdChange.bind(changelogUtils),
            );
            changelogMd += `${_.join(changelogVersionLines, '\n')}`;
        });

        return changelogMd;
    },
    shouldAddNewChangelogEntry(packageName: string, currentVersion: string, changelog: Changelog): boolean {
        if (_.isEmpty(changelog)) {
            return true;
        }
        const lastEntry = changelog[0];
        if (semver.lt(lastEntry.version, currentVersion)) {
            throw new Error(
                `Found CHANGELOG version lower then current package version. ${packageName} current: ${currentVersion}, Changelog: ${
                    lastEntry.version
                }`,
            );
        }
        const isLastEntryCurrentVersion = lastEntry.version === currentVersion;
        return isLastEntryCurrentVersion;
    },
    getChangelogJSONIfExists(changelogPath: string): string | undefined {
        try {
            const changelogJSON = fs.readFileSync(changelogPath, 'utf-8');
            return changelogJSON;
        } catch (err) {
            return undefined;
        }
    },
    getChangelogOrCreateIfMissing(packageName: string, packageLocation: string): Changelog {
        const changelogJSONPath = path.join(packageLocation, 'CHANGELOG.json');
        let changelogJsonIfExists = changelogUtils.getChangelogJSONIfExists(changelogJSONPath);
        if (_.isUndefined(changelogJsonIfExists)) {
            // If none exists, create new, empty one.
            changelogJsonIfExists = '[]';
            fs.writeFileSync(changelogJSONPath, changelogJsonIfExists);
        }
        let changelog: Changelog;
        try {
            changelog = JSON.parse(changelogJsonIfExists);
        } catch (err) {
            throw new Error(`${packageName}'s CHANGELOG.json contains invalid JSON. Please fix and try again.`);
        }
        return changelog;
    },
    async writeChangelogJsonFileAsync(packageLocation: string, changelog: Changelog): Promise<void> {
        const changelogJSONPath = path.join(packageLocation, 'CHANGELOG.json');
        fs.writeFileSync(changelogJSONPath, JSON.stringify(changelog, null, '\t'));
        await changelogUtils.prettifyAsync(changelogJSONPath, constants.monorepoRootPath);
    },
    async writeChangelogMdFileAsync(packageLocation: string, changelogMdString: string): Promise<void> {
        const changelogMarkdownPath = path.join(packageLocation, 'CHANGELOG.md');
        fs.writeFileSync(changelogMarkdownPath, changelogMdString);
        await changelogUtils.prettifyAsync(changelogMarkdownPath, constants.monorepoRootPath);
    },
    async prettifyAsync(filePath: string, cwd: string): Promise<void> {
        await execAsync(`prettier --write ${filePath} --config .prettierrc`, {
            cwd,
        });
    },
};
