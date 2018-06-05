#!/usr/bin/env node

import * as _ from 'lodash';
import * as path from 'path';
import { exec as execAsync } from 'promisify-child-process';
import semverSort = require('semver-sort');

import { constants } from './constants';
import { Changelog } from './types';
import { utils } from './utils/utils';

(async () => {
    const shouldIncludePrivate = true;
    const updatedPublicLernaPackages = await utils.getUpdatedLernaPackagesAsync(shouldIncludePrivate);

    for (const lernaPackage of updatedPublicLernaPackages) {
        const packageName = lernaPackage.package.name;
        const currentVersion = lernaPackage.package.version;
        const changelogJSONPath = path.join(lernaPackage.location, 'CHANGELOG.json');
        // Private packages don't have changelogs, and their versions are always incremented
        // by a patch version.
        const changelogJSONIfExists = utils.getChangelogJSONIfExists(changelogJSONPath);

        let latestChangelogVersion: string;
        if (!_.isUndefined(changelogJSONIfExists)) {
            let changelogs: Changelog;
            try {
                changelogs = JSON.parse(changelogJSONIfExists);
            } catch (err) {
                throw new Error(
                    `${lernaPackage.package.name}'s CHANGELOG.json contains invalid JSON. Please fix and try again.`,
                );
            }
            latestChangelogVersion = changelogs[0].version;
        } else {
            latestChangelogVersion = utils.getNextPatchVersion(currentVersion);
        }

        const sortedVersions = semverSort.desc([latestChangelogVersion, currentVersion]);
        if (sortedVersions[0] === latestChangelogVersion && latestChangelogVersion !== currentVersion) {
            const tagName = `${packageName}@${latestChangelogVersion}`;
            try {
                await execAsync(`git tag -d ${tagName}`, { cwd: constants.monorepoRootPath });
                utils.log(`removed tag: ${tagName}`);
            } catch (err) {
                if (_.includes(err.message, 'not found')) {
                    utils.log(`Could not find tag: ${tagName}`);
                } else {
                    throw err;
                }
            }
        }
    }
})().catch(err => {
    utils.log(err);
    process.exit(1);
});
