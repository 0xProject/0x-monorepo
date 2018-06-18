import * as _ from 'lodash';
import semverSort = require('semver-sort');

// Regex that matches semantic versions only including digits and dots.
const SEM_VER_REGEX = /^(\d+\.){1}(\d+\.){1}(\d+){1}$/gm;

export const semverUtils = {
    /**
     * Checks whether version a is lessThan version b. Supplied versions must be
     * Semantic Versions containing only numbers and dots (e.g 1.4.0).
     * @param a version of interest
     * @param b version to compare a against
     * @return Whether version a is lessThan version b
     */
    lessThan(a: string, b: string): boolean {
        this.assertValidSemVer('a', a);
        this.assertValidSemVer('b', b);
        if (a === b) {
            return false;
        }
        const sortedVersions = semverSort.desc([a, b]);
        const isALessThanB = sortedVersions[0] === b;
        return isALessThanB;
    },
    /**
     * Checks whether version a is greaterThan version b. Supplied versions must be
     * Semantic Versions containing only numbers and dots (e.g 1.4.0).
     * @param a version of interest
     * @param b version to compare a against
     * @return Whether version a is greaterThan version b
     */
    greaterThan(a: string, b: string): boolean {
        this.assertValidSemVer('a', a);
        this.assertValidSemVer('b', b);
        if (a === b) {
            return false;
        }
        const sortedVersions = semverSort.desc([a, b]);
        const isAGreaterThanB = sortedVersions[0] === a;
        return isAGreaterThanB;
    },
    assertValidSemVer(variableName: string, version: string): void {
        if (!version.match(SEM_VER_REGEX)) {
            throw new Error(
                `SemVer versions should only contain numbers and dots. Encountered: ${variableName} = ${version}`,
            );
        }
    },
    getLatestVersion(versions: string[]): string {
        _.each(versions, version => {
            this.assertValidSemVer('version', version);
        });
        const sortedVersions = semverSort.desc(versions);
        return sortedVersions[0];
    },
};
