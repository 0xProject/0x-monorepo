import 'isomorphic-fetch';
import * as _ from 'lodash';

import { PackageRegistryJson } from '../types';

const NPM_REGISTRY_BASE_URL = 'https://registry.npmjs.org';
const SUCCESS_STATUS = 200;
const NOT_FOUND_STATUS = 404;

export const npmUtils = {
    async getPackageRegistryJsonIfExistsAsync(packageName: string): Promise<PackageRegistryJson | undefined> {
        const url = `${NPM_REGISTRY_BASE_URL}/${packageName}`;
        const response = await fetch(url);

        if (response.status === NOT_FOUND_STATUS) {
            return undefined;
        } else if (response.status !== SUCCESS_STATUS) {
            throw new Error(`Request to ${url} failed. Check your internet connection and that npmjs.org is up.`);
        }
        const packageRegistryJson = await response.json();
        return packageRegistryJson;
    },
    getPreviouslyPublishedVersions(packageRegistryJson: PackageRegistryJson): string[] {
        const timeWithOnlyVersions = _.omit(packageRegistryJson.time, ['modified', 'created']);
        const versions = _.keys(timeWithOnlyVersions);
        return versions;
    },
};
