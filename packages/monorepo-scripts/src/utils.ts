import * as _ from 'lodash';
import { exec as execAsync, spawn } from 'promisify-child-process';

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
    async prettifyAsync(filePath: string, cwd: string) {
        await execAsync(`prettier --write ${filePath} --config .prettierrc`, {
            cwd,
        });
    },
};
