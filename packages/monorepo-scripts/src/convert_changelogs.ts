#!/usr/bin/env node

import * as fs from 'fs';
import lernaGetPackages = require('lerna-get-packages');
import * as _ from 'lodash';
import * as moment from 'moment';
import * as path from 'path';

import { Changelog, Changes, UpdatedPackage } from './types';
import { utils } from './utils';

const MONOREPO_ROOT_PATH = path.join(__dirname, '../../..');

(async () => {
    const allLernaPackages = lernaGetPackages(MONOREPO_ROOT_PATH);
    const publicLernaPackages = _.filter(allLernaPackages, pkg => !pkg.package.private);
    _.each(publicLernaPackages, lernaPackage => {
        const changelogMdIfExists = getChangelogMdIfExists(lernaPackage.package.name, lernaPackage.location);
        if (_.isUndefined(changelogMdIfExists)) {
            throw new Error(`${lernaPackage.package.name} should have CHANGELOG.md b/c it's public. Add one.`);
        }

        const lines = (changelogMdIfExists as any).split('\n');
        const changelogs: Changelog[] = [];
        let changelog: Changelog = {
            version: '',
            changes: [],
        };
        for (const line of lines) {
            if (_.startsWith(line, '## ')) {
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
                (changelogs as any).push(changelog);
            } else if (_.includes(line, '* ')) {
                const note = line.split('* ')[1].split(' (#')[0];
                const prChunk = line.split(' (#')[1];
                let pr;
                if (!_.isUndefined(prChunk)) {
                    pr = prChunk.split(')')[0];
                }
                const changes = {
                    note,
                    pr,
                };
                changelog.changes.push(changes);
            }
        }
        const changelogJson = JSON.stringify(changelogs, null, '\t');
        fs.writeFileSync(`${lernaPackage.location}/CHANGELOG.json`, changelogJson);
    });
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
        // If none exists, create new, empty one.
        return undefined;
    }
}
