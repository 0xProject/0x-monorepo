import * as fs from 'fs';
import lernaGetPackages = require('lerna-get-packages');
import * as _ from 'lodash';
import { exec as execAsync, spawn } from 'promisify-child-process';

import { constants } from '../constants';
import { UpdatedPackage } from '../types';

export const utils = {
    log(...args: any[]): void {
        console.log(...args); // tslint:disable-line:no-console
    },
    getNextPatchVersion(currentVersion: string): string {
        const versionSegments = currentVersion.split('.');
        const patch = _.parseInt(_.last(versionSegments) as string);
        const newPatch = patch + 1;
        const newPatchVersion = `${versionSegments[0]}.${versionSegments[1]}.${newPatch}`;
        return newPatchVersion;
    },
    async prettifyAsync(filePath: string, cwd: string): Promise<void> {
        await execAsync(`prettier --write ${filePath} --config .prettierrc`, {
            cwd,
        });
    },
    async getUpdatedLernaPackagesAsync(shouldIncludePrivate: boolean): Promise<LernaPackage[]> {
        const updatedPublicPackages = await this.getLernaUpdatedPackagesAsync(shouldIncludePrivate);
        const updatedPackageNames = _.map(updatedPublicPackages, pkg => pkg.name);

        const allLernaPackages = lernaGetPackages(constants.monorepoRootPath);
        const updatedPublicLernaPackages = _.filter(allLernaPackages, pkg => {
            return _.includes(updatedPackageNames, pkg.package.name);
        });
        return updatedPublicLernaPackages;
    },
    async getLernaUpdatedPackagesAsync(shouldIncludePrivate: boolean): Promise<UpdatedPackage[]> {
        const result = await execAsync(`${constants.lernaExecutable} updated --json`, {
            cwd: constants.monorepoRootPath,
        });
        const updatedPackages = JSON.parse(result.stdout);
        if (!shouldIncludePrivate) {
            const updatedPublicPackages = _.filter(updatedPackages, updatedPackage => !updatedPackage.private);
            return updatedPublicPackages;
        }
        return updatedPackages;
    },
    getChangelogJSONIfExists(changelogPath: string): string | undefined {
        try {
            const changelogJSON = fs.readFileSync(changelogPath, 'utf-8');
            return changelogJSON;
        } catch (err) {
            return undefined;
        }
    },
    getChangelogJSONOrCreateIfMissing(changelogPath: string): string {
        const changelogIfExists = this.getChangelogJSONIfExists(changelogPath);
        if (_.isUndefined(changelogIfExists)) {
            // If none exists, create new, empty one.
            const emptyChangelogJSON = JSON.stringify([]);
            fs.writeFileSync(changelogPath, emptyChangelogJSON);
            return emptyChangelogJSON;
        }
        return changelogIfExists;
    },
};
