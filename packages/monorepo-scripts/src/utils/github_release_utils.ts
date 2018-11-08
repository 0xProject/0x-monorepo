import * as promisify from 'es6-promisify';
import { readFileSync } from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import { exec as execAsync } from 'promisify-child-process';
import * as publishRelease from 'publish-release';

import { constants } from '../constants';
import { Package } from '../types';

import { utils } from './utils';

const publishReleaseAsync = promisify(publishRelease);
// tslint:disable-next-line:completed-docs
export async function publishReleaseNotesAsync(packagesToPublish: Package[], isDryRun: boolean): Promise<void> {
    // Git push a tag representing this publish (publish-{commit-hash}) (truncate hash)
    const result = await execAsync('git log -n 1 --pretty=format:"%H"', { cwd: constants.monorepoRootPath });
    const latestGitCommit = result.stdout;
    const prefixLength = 7;
    const shortenedGitCommit = latestGitCommit.slice(0, prefixLength);
    const tagName = `monorepo@${shortenedGitCommit}`;

    if (!isDryRun) {
        try {
            await execAsync(`git tag ${tagName}`);
        } catch (err) {
            if (_.includes(err.message, 'already exists')) {
                // Noop tag creation since already exists
            } else {
                throw err;
            }
        }
        const { stdout } = await execAsync(`git ls-remote --tags origin refs/tags/${tagName}`);
        if (_.isEmpty(stdout)) {
            await execAsync(`git push origin ${tagName}`);
        }
    }

    const releaseName = `0x monorepo - ${shortenedGitCommit}`;

    let assets: string[] = [];
    let aggregateNotes = '';
    _.each(packagesToPublish, pkg => {
        aggregateNotes += getReleaseNotesForPackage(pkg.packageJson.name);

        const packageAssets = _.get(pkg.packageJson, 'config.postpublish.assets');
        if (!_.isUndefined(packageAssets)) {
            assets = [...assets, ...packageAssets];
        }
    });
    const finalAssets = adjustAssetPaths(assets);

    const publishReleaseConfigs = {
        token: constants.githubPersonalAccessToken,
        owner: '0xProject',
        tag: tagName,
        repo: '0x-monorepo',
        name: releaseName,
        notes: aggregateNotes,
        draft: false,
        prerelease: false,
        reuseRelease: true,
        reuseDraftOnly: false,
        // TODO: Currently publish-release doesn't let you specify the labels for each asset uploaded
        // Ideally we would like to name the assets after the package they are from
        // Source: https://github.com/remixz/publish-release/issues/39
        assets: finalAssets,
    };

    if (isDryRun) {
        utils.log(`Dry run: stopping short of publishing release notes to github`);
        utils.log(`Would publish with configs:\n${JSON.stringify(publishReleaseConfigs, null, '\t')}`);
        return;
    }

    utils.log('Publishing release notes ', releaseName, '...');
    await publishReleaseAsync(publishReleaseConfigs);
}

// Asset paths should described from the monorepo root. This method prefixes
// the supplied path with the absolute path to the monorepo root.
function adjustAssetPaths(assets: string[]): string[] {
    const finalAssets: string[] = [];
    _.each(assets, (asset: string) => {
        const finalAsset = `${constants.monorepoRootPath}/${asset}`;
        finalAssets.push(finalAsset);
    });
    return finalAssets;
}

function getReleaseNotesForPackage(packageName: string): string {
    const packageNameWithoutNamespace = packageName.replace('@0x/', '');
    const changelogJSONPath = path.join(
        constants.monorepoRootPath,
        'packages',
        packageNameWithoutNamespace,
        'CHANGELOG.json',
    );
    const changelogJSON = readFileSync(changelogJSONPath, 'utf-8');
    const changelogs = JSON.parse(changelogJSON);
    const latestLog = changelogs[0];
    // If only has a `Dependencies updated` changelog, we don't include it in release notes
    if (latestLog.changes.length === 1 && latestLog.changes[0].note === constants.dependenciesUpdatedMessage) {
        return '';
    }
    let notes = '';
    _.each(latestLog.changes, change => {
        notes += `* ${change.note}`;
        if (change.pr) {
            notes += ` (#${change.pr})`;
        }
        notes += `\n`;
    });
    if (_.isEmpty(notes)) {
        return ''; // don't include it
    }
    const releaseNotesSection = `### ${packageName}@${latestLog.version}\n${notes}\n\n`;
    return releaseNotesSection;
}
