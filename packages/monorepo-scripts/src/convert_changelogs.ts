#!/usr/bin/env node
/**
 * TEMPORARY SCRIPT
 * This script exists to migrate the legacy CHANGELOG.md to the canonical CHANGELOG.md
 * TODO: Remove after migration is successful and committed.
 */

import * as fs from 'fs';
import lernaGetPackages = require('lerna-get-packages');
import * as _ from 'lodash';
import * as moment from 'moment';
import * as path from 'path';
import { exec as execAsync } from 'promisify-child-process';

import { constants } from './constants';
import { Changelog, Changes, UpdatedPackage } from './types';
import { utils } from './utils';

const HEADER_PRAGMA = '##';

(async () => {
    const allLernaPackages = lernaGetPackages(constants.monorepoRootPath);
    const publicLernaPackages = _.filter(allLernaPackages, pkg => !pkg.package.private);
    for (const lernaPackage of publicLernaPackages) {
        const changelogMdIfExists = getChangelogMdIfExists(lernaPackage.package.name, lernaPackage.location);
        if (_.isUndefined(changelogMdIfExists)) {
            throw new Error(`${lernaPackage.package.name} should have CHANGELOG.md b/c it's public. Add one.`);
        }

        const lines = changelogMdIfExists.split('\n');
        const changelogs: Changelog[] = [];
        let changelog: Changelog = {
            version: '',
            changes: [],
        };
        /**
         * Example MD entry:
         * ## v0.3.1 - _March 18, 2018_
         *
         *    * Add TS types for `yargs` (#400)
         */
        for (const line of lines) {
            if (_.startsWith(line, `${HEADER_PRAGMA} `)) {
                let version = line.substr(4).split(' - ')[0];
                if (version === '0.x.x') {
                    version = utils.getNextPatchVersion(lernaPackage.package.version);
                }
                const dateStr = line.split('_')[1];
                let date;
                if (!_.includes(dateStr, 'TBD')) {
                    date = moment(dateStr, 'MMMM D, YYYY');
                }
                changelog = {
                    version,
                    changes: [],
                };
                if (!_.isUndefined(date)) {
                    changelog.timestamp = date.unix();
                }
                if (!_.includes(dateStr, 'TBD')) {
                    changelog.isPublished = true;
                }
                changelogs.push(changelog);
            } else if (_.includes(line, '* ')) {
                const note = line.split('* ')[1].split(' (#')[0];
                const prChunk = line.split(' (#')[1];
                let pr;
                if (!_.isUndefined(prChunk)) {
                    pr = prChunk.split(')')[0];
                }
                const changes: Changes = {
                    note,
                };
                if (!_.isUndefined(pr)) {
                    changes.pr = _.parseInt(pr);
                }
                changelog.changes.push(changes);
            }
        }
        const changelogJson = JSON.stringify(changelogs);
        const changelogJsonPath = `${lernaPackage.location}/CHANGELOG.json`;
        fs.writeFileSync(changelogJsonPath, changelogJson);
        await execAsync(`prettier --write ${changelogJsonPath} --config .prettierrc`, {
            cwd: constants.monorepoRootPath,
        });
    }
})().catch(err => {
    utils.log(err.stdout);
    process.exit(1);
});

function getChangelogMdIfExists(packageName: string, location: string): string | undefined {
    const changelogPath = path.join(location, 'CHANGELOG.md');
    let changelogMd: string;
    try {
        changelogMd = fs.readFileSync(changelogPath, 'utf-8');
        return changelogMd;
    } catch (err) {
        return undefined;
    }
}
