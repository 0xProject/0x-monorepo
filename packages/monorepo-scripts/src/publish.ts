#!/usr/bin/env node

import { PackageJSON } from '@0x/types';
import { logUtils } from '@0x/utils';
import { spawn } from 'child_process';
import * as promisify from 'es6-promisify';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as path from 'path';
import { exec as execAsync, spawn as spawnAsync } from 'promisify-child-process';
import * as prompt from 'prompt';
import semver = require('semver');
import semverSort = require('semver-sort');

import { constants } from './constants';
import { Package, PackageToNextVersion, VersionChangelog } from './types';
import { changelogUtils } from './utils/changelog_utils';
import { configs } from './utils/configs';
import { alertDiscordAsync } from './utils/discord';
import { DocGenerateUtils } from './utils/doc_generate_utils';
import { publishReleaseNotesAsync } from './utils/github_release_utils';
import { utils } from './utils/utils';

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
        if (nextPatchVersionIfValid !== null) {
            packageToNextVersion[packageName] = nextPatchVersionIfValid;
        } else {
            throw new Error(`Encountered invalid semver version: ${currentVersion} for package: ${packageName}`);
        }
    });

    // Generate markdown docs for packages
    await generateDocMDAsync(packagesWithDocs);

    // Push changelogs changes and markdown docs to Github
    if (!configs.IS_LOCAL_PUBLISH) {
        await pushChangelogsAndMDDocsToGithubAsync();
    }

    // Call LernaPublish
    utils.log('Version updates to apply:');
    _.each(packageToNextVersion, (versionChange: string, packageName: string) => {
        utils.log(`${packageName} -> ${versionChange}`);
    });
    utils.log(`Calling 'lerna publish'...`);
    await lernaPublishAsync(packageToNextVersion);

    const isDryRun = configs.IS_LOCAL_PUBLISH;
    if (!isDryRun) {
        // Publish docker images to DockerHub
        await publishImagesToDockerHubAsync(allPackagesToPublish);

        // Upload markdown docs to S3 bucket
        await execAsync(`yarn upload_md_docs`, { cwd: constants.monorepoRootPath });
    }

    const releaseNotes = await publishReleaseNotesAsync(updatedPublicPackages, isDryRun);
    utils.log('Published release notes');

    if (!isDryRun && releaseNotes) {
        try {
            await alertDiscordAsync(releaseNotes);
        } catch (e) {
            utils.log("Publish successful, but couldn't auto-alert discord (", e.message, '), Please alert manually.');
        }
    }
    process.exit(0);
})().catch(err => {
    utils.log(err);
    process.exit(1);
});

async function publishImagesToDockerHubAsync(allUpdatedPackages: Package[]): Promise<void> {
    for (const pkg of allUpdatedPackages) {
        const packageJSON = pkg.packageJson;
        const shouldPublishDockerImage =
            packageJSON.config !== undefined &&
            packageJSON.config.postpublish !== undefined &&
            packageJSON.config.postpublish.dockerHubRepo !== undefined;
        if (!shouldPublishDockerImage) {
            continue;
        }
        const dockerHubRepo = _.get(packageJSON, 'config.postpublish.dockerHubRepo');
        const pkgName = pkg.packageJson.name;
        const packageDirName = _.startsWith(pkgName, '@0x/') ? pkgName.split('/')[1] : pkgName;

        // Build the Docker image
        logUtils.log(`Building '${dockerHubRepo}' docker image...`);
        await spawnAsync('docker', ['build', '-t', dockerHubRepo, '.'], {
            cwd: `${constants.monorepoRootPath}/packages/${packageDirName}`,
        });

        // Tag the docker image with the latest version
        const version = pkg.packageJson.version;
        logUtils.log(`Tagging '${dockerHubRepo}' docker image with version ${version}...`);
        await execAsync(`docker tag ${dockerHubRepo} ${configs.DOCKER_HUB_ORG}/${dockerHubRepo}:${version}`);
        await execAsync(`docker tag ${dockerHubRepo} ${configs.DOCKER_HUB_ORG}/${dockerHubRepo}:latest`);

        // Publish to DockerHub
        logUtils.log(`Pushing '${dockerHubRepo}' docker image to DockerHub...`);
        await execAsync(`docker push ${configs.DOCKER_HUB_ORG}/${dockerHubRepo}:${version}`);
        await execAsync(`docker push ${configs.DOCKER_HUB_ORG}/${dockerHubRepo}:latest`);
    }
}

function getPackagesWithDocs(allUpdatedPackages: Package[]): Package[] {
    const rootPackageJsonPath = `${constants.monorepoRootPath}/package.json`;
    const rootPackageJSON = utils.readJSONFile<PackageJSON>(rootPackageJsonPath);
    const packagesWithDocPagesStringIfExist = _.get(rootPackageJSON, 'config.packagesWithDocPages', undefined);
    if (packagesWithDocPagesStringIfExist === undefined) {
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

async function generateDocMDAsync(packagesWithDocs: Package[]): Promise<void> {
    for (const pkg of packagesWithDocs) {
        const nameWithoutPrefix = pkg.packageJson.name.replace('@0x/', '');
        const docGenerateAndUploadUtils = new DocGenerateUtils(nameWithoutPrefix);
        await docGenerateAndUploadUtils.generateAndUploadDocsAsync();
    }
}

async function pushChangelogsAndMDDocsToGithubAsync(): Promise<void> {
    await execAsync(`git add . --all`, { cwd: constants.monorepoRootPath });
    await execAsync(`git commit -m "Updated CHANGELOGS & MD docs"`, { cwd: constants.monorepoRootPath });
    await execAsync(`git push`, { cwd: constants.monorepoRootPath });
    utils.log(`Pushed CHANGELOG updates & updated MD docs to Github`);
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
            if (nextPatchVersionIfValid === null) {
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
            if (lastEntry.timestamp === undefined) {
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
    return new Promise<void>((resolve, reject) => {
        const packageVersionString = _.map(packageToNextVersion, (nextVersion: string, packageName: string) => {
            return `${packageName}|${nextVersion}`;
        }).join(',');
        // HACK(fabio): Previously we would pass the packageVersionString directly to `lerna publish` using the
        // `--cdVersions` flag. Since we now need to use `spawn` instead of `exec` when calling Lerna, passing
        // them as a string arg is causing `spawn` to error with `ENAMETOOLONG`. In order to shorten the args
        // passed to `spawn` we now write the new version to a file and pass the filepath to the `cdVersions` arg.
        const cdVersionsFilepath = path.join(__dirname, 'cd_versions.txt');
        fs.writeFileSync(cdVersionsFilepath, packageVersionString);
        const lernaPublishCmd = `node`;
        const lernaPublishArgs = [
            `${constants.lernaExecutable}`,
            'publish',
            `--cdVersions=${cdVersionsFilepath}`,
            `--registry=${configs.NPM_REGISTRY_URL}`,
            `--yes`,
        ];
        if (configs.IS_LOCAL_PUBLISH) {
            lernaPublishArgs.push('--no-git-tag-version');
            lernaPublishArgs.push('--no-push');
        }
        utils.log('Lerna is publishing...');
        try {
            const child = spawn(lernaPublishCmd, lernaPublishArgs, {
                cwd: constants.monorepoRootPath,
            });
            child.stdout.on('data', async (data: Buffer) => {
                const output = data.toString('utf8');
                utils.log('Lerna publish cmd: ', output);
                const isOTPPrompt = _.includes(output, 'Enter OTP:');
                if (isOTPPrompt) {
                    // Prompt for OTP
                    prompt.start();
                    const result = await promisify(prompt.get)(['OTP']);
                    child.stdin.write(`${result.OTP}\n`);
                }
                const didFinishPublishing = _.includes(output, 'Successfully published:');
                if (didFinishPublishing) {
                    // Remove temporary cdVersions file
                    fs.unlinkSync(cdVersionsFilepath);
                    resolve();
                }
            });
            child.stderr.on('data', (data: Buffer) => {
                const output = data.toString('utf8');
                utils.log('Lerna publish cmd: ', output);
            });
        } catch (err) {
            // Remove temporary cdVersions file
            fs.unlinkSync(cdVersionsFilepath);
            reject(err);
        }
    });
}

function updateVersionNumberIfNeeded(currentVersion: string, proposedNextVersion: string): string {
    const updatedVersionIfValid = semver.inc(currentVersion, 'patch');
    if (updatedVersionIfValid === null) {
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
