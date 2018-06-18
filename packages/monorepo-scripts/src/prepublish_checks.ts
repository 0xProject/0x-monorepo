import * as _ from 'lodash';
import { exec as execAsync } from 'promisify-child-process';
import semver = require('semver');
import semverSort = require('semver-sort');

import { constants } from './constants';
import { changelogUtils } from './utils/changelog_utils';
import { npmUtils } from './utils/npm_utils';
import { utils } from './utils/utils';

async function prepublishChecksAsync(): Promise<void> {
    const shouldIncludePrivate = false;
    const updatedPublicLernaPackages = await utils.getUpdatedLernaPackagesAsync(shouldIncludePrivate);

    await checkCurrentVersionMatchesLatestPublishedNPMPackageAsync(updatedPublicLernaPackages);
    await checkChangelogFormatAsync(updatedPublicLernaPackages);
    await checkGitTagsForNextVersionAndDeleteIfExistAsync(updatedPublicLernaPackages);
    await checkPublishRequiredSetupAsync();
}

async function checkGitTagsForNextVersionAndDeleteIfExistAsync(
    updatedPublicLernaPackages: LernaPackage[],
): Promise<void> {
    const packageNames = _.map(updatedPublicLernaPackages, lernaPackage => lernaPackage.package.name);
    const localGitTags = await utils.getLocalGitTagsAsync();
    const localTagVersionsByPackageName = await utils.getGitTagsByPackageNameAsync(packageNames, localGitTags);

    const remoteGitTags = await utils.getRemoteGitTagsAsync();
    const remoteTagVersionsByPackageName = await utils.getGitTagsByPackageNameAsync(packageNames, remoteGitTags);

    for (const lernaPackage of updatedPublicLernaPackages) {
        const currentVersion = lernaPackage.package.version;
        const packageName = lernaPackage.package.name;
        const packageLocation = lernaPackage.location;
        const nextVersion = await utils.getNextPackageVersionAsync(currentVersion, packageName, packageLocation);

        const localTagVersions = localTagVersionsByPackageName[packageName];
        if (_.includes(localTagVersions, nextVersion)) {
            const tagName = `${packageName}@${nextVersion}`;
            await utils.removeLocalTagAsync(tagName);
        }

        const remoteTagVersions = remoteTagVersionsByPackageName[packageName];
        if (_.includes(remoteTagVersions, nextVersion)) {
            const tagName = `:refs/tags/${packageName}@${nextVersion}`;
            await utils.removeRemoteTagAsync(tagName);
        }
    }
}

async function checkCurrentVersionMatchesLatestPublishedNPMPackageAsync(
    updatedPublicLernaPackages: LernaPackage[],
): Promise<void> {
    utils.log('Check package versions against npmjs.org...');
    const versionMismatches = [];
    for (const lernaPackage of updatedPublicLernaPackages) {
        const packageName = lernaPackage.package.name;
        const packageVersion = lernaPackage.package.version;
        const packageRegistryJsonIfExists = await npmUtils.getPackageRegistryJsonIfExistsAsync(packageName);
        if (_.isUndefined(packageRegistryJsonIfExists)) {
            continue; // noop for packages not yet published to NPM
        }
        const allVersionsIncludingUnpublished = npmUtils.getPreviouslyPublishedVersions(packageRegistryJsonIfExists);
        const sortedVersions = semverSort.desc(allVersionsIncludingUnpublished);
        const latestNPMVersion = sortedVersions[0];
        if (packageVersion !== latestNPMVersion) {
            versionMismatches.push({
                packageJsonVersion: packageVersion,
                npmVersion: latestNPMVersion,
                packageName,
            });
        }
    }
    if (!_.isEmpty(versionMismatches)) {
        utils.log(`Found version mismatches between package.json and NPM published versions (might be unpublished).`);
        _.each(versionMismatches, versionMismatch => {
            utils.log(
                `${versionMismatch.packageName}: ${versionMismatch.packageJsonVersion} package.json, ${
                    versionMismatch.npmVersion
                } on NPM`,
            );
        });
        throw new Error(`Please fix the above package.json/NPM inconsistencies.`);
    }
}

async function checkChangelogFormatAsync(updatedPublicLernaPackages: LernaPackage[]): Promise<void> {
    utils.log('Check CHANGELOGs for inconsistencies...');
    const changeLogInconsistencies = [];
    for (const lernaPackage of updatedPublicLernaPackages) {
        const packageName = lernaPackage.package.name;
        const changelog = changelogUtils.getChangelogOrCreateIfMissing(packageName, lernaPackage.location);

        const currentVersion = lernaPackage.package.version;
        if (!_.isEmpty(changelog)) {
            const lastEntry = changelog[0];
            const doesLastEntryHaveTimestamp = !_.isUndefined(lastEntry.timestamp);
            if (semver.lt(lastEntry.version, currentVersion)) {
                changeLogInconsistencies.push({
                    packageJsonVersion: currentVersion,
                    changelogVersion: lastEntry.version,
                    packageName,
                });
            } else if (semver.gt(lastEntry.version, currentVersion) && doesLastEntryHaveTimestamp) {
                // Remove incorrectly added timestamp
                delete changelog[0].timestamp;
                // Save updated CHANGELOG.json
                await changelogUtils.writeChangelogJsonFileAsync(lernaPackage.location, changelog);
                utils.log(`${packageName}: Removed timestamp from latest CHANGELOG.json entry.`);
            }
        }
    }
    if (!_.isEmpty(changeLogInconsistencies)) {
        utils.log(`CHANGELOG versions cannot below package.json versions:`);
        _.each(changeLogInconsistencies, inconsistency => {
            utils.log(
                `${inconsistency.packageName}: ${inconsistency.packageJsonVersion} package.json, ${
                    inconsistency.changelogVersion
                } CHANGELOG.json`,
            );
        });
        throw new Error('Fix the above inconsistencies to continue.');
    }
}

async function checkPublishRequiredSetupAsync(): Promise<void> {
    // check to see if logged into npm before publishing
    try {
        // HACK: for some reason on some setups, the `npm whoami` will not recognize a logged-in user
        // unless run with `sudo` (i.e Fabio's NVM setup) but is fine for others (Jacob's NVM setup).
        utils.log('Checking that the user is logged in on npm...');
        await execAsync(`sudo npm whoami`);
    } catch (err) {
        throw new Error('You must be logged into npm in the commandline to publish. Run `npm login` and try again.');
    }

    // Check to see if Git personal token setup
    if (_.isUndefined(constants.githubPersonalAccessToken)) {
        throw new Error(
            'You must have a Github personal access token set to an envVar named `GITHUB_PERSONAL_ACCESS_TOKEN_0X_JS`. Add it then try again.',
        );
    }

    // Check Yarn version is 1.X
    utils.log('Checking the yarn version...');
    const result = await execAsync(`yarn --version`);
    const version = result.stdout;
    const versionSegments = version.split('.');
    const majorVersion = _.parseInt(versionSegments[0]);
    if (majorVersion < 1) {
        throw new Error('Your yarn version must be v1.x or higher. Upgrade yarn and try again.');
    }

    // Check that `aws` commandline tool is installed
    try {
        utils.log('Checking that aws CLI tool is installed...');
        await execAsync(`aws help`);
    } catch (err) {
        throw new Error('You must have `awscli` commandline tool installed. Install it and try again.');
    }

    // Check that `aws` credentials are setup
    try {
        utils.log('Checking that aws credentials are configured...');
        await execAsync(`aws sts get-caller-identity`);
    } catch (err) {
        throw new Error('You must setup your AWS credentials by running `aws configure`. Do this and try again.');
    }

    utils.log('Checking that git branch is up to date with upstream...');
    await execAsync('git fetch');
    const res = await execAsync('git status -bs'); // s - short format, b - branch info
    /**
     * Possible outcomes
     * ## branch_name...origin/branch_name [behind n]
     * ## branch_name...origin/branch_name [ahead n]
     * ## branch_name...origin/branch_name
     */
    const gitShortStatusHeader = res.stdout.split('\n')[0];
    if (gitShortStatusHeader.includes('behind')) {
        throw new Error('Your branch is behind upstream. Please pull before publishing.');
    } else if (gitShortStatusHeader.includes('ahead')) {
        throw new Error('Your branch is ahead of upstream. Please push before publishing.');
    }
}

prepublishChecksAsync().catch(err => {
    utils.log(err.message);
    process.exit(1);
});
