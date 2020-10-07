#!/usr/bin/env node

import { PackageJSON, PackageJSONConfig } from '@0x/types';
import chalk from 'chalk';
import { sync as globSync } from 'glob';
import { env } from 'process';

import { utils } from './utils/utils';

interface Dependencies {
    [depName: string]: string;
}
interface Versions {
    [packageName: string]: string;
}
interface VersionsByDependency {
    [depName: string]: Versions;
}

interface ParsedDependencies {
    ignored: VersionsByDependency;
    included: VersionsByDependency;
}

const PACKAGE_JSON_GLOB = env.PACKAGE_JSON_GLOB || './*/package.json';

const config = utils.readJSONFile<PackageJSON>('./package.json')
    .config as PackageJSONConfig; // tslint:disable-line no-unnecessary-type-assertion
const dependenciesWithIgnoredVersions: string[] = (config.ignoreDependencyVersions || ('' as string)).split(' ');
const packagesWithIgnoredVersions: string[] = (config.ignoreDependencyVersionsForPackage || ('' as string)).split(' ');

if (require.main === module) {
    const dependencies = parseDependencies();
    const ignoredMultiples = getDependenciesWithMultipleVersions(dependencies.ignored);
    const multiples = getDependenciesWithMultipleVersions(dependencies.included);
    printVersionsByDependency(multiples);
    utils.log(`├── ${chalk.bold('IGNORED')}`);
    printVersionsByDependency(ignoredMultiples);
    if (Object.keys(multiples).length !== 0) {
        utils.log(
            `Some dependencies have multiple versions. Please fix by trying to find compatible versions. As a last resort, you can add space-separated exceptions to root package.json config.ignoreDependencyVersions`,
        );
        process.exit(1);
    }
}

function getDependencies(_path: string): Dependencies {
    const packageJSON = utils.readJSONFile<PackageJSON>(_path);
    const dependencies = {
        ...packageJSON.dependencies,
        ...packageJSON.devDependencies,
    };
    return dependencies;
}

function parseDependencies(): ParsedDependencies {
    const files = globSync(PACKAGE_JSON_GLOB);
    const parsedDependencies: ParsedDependencies = {
        ignored: {},
        included: {},
    };
    files.map(_path => {
        const pathParts = _path.split('/');
        const packageName = pathParts[pathParts.length - 2];
        const packageCategory = packagesWithIgnoredVersions.includes(packageName) ? 'ignored' : 'included';
        const dependencies = getDependencies(_path);
        Object.keys(dependencies).forEach((depName: string) => {
            const category = dependenciesWithIgnoredVersions.includes(depName) ? 'ignored' : packageCategory;
            if (parsedDependencies[category][depName] === undefined) {
                parsedDependencies[category][depName] = {};
            }
            const version = dependencies[depName];
            parsedDependencies[category][depName][packageName] = version;
        });
    });
    return parsedDependencies;
}

function getDependenciesWithMultipleVersions(versionsByDependency: VersionsByDependency): VersionsByDependency {
    return Object.keys(versionsByDependency)
        .filter((depName: string) => hasMultipleVersions(versionsByDependency[depName]))
        .reduce<VersionsByDependency>((obj, depName: string) => {
            obj[depName] = versionsByDependency[depName];
            return obj;
        }, {});
}

function printVersionsByDependency(versionsByDependency: VersionsByDependency): void {
    Object.keys(versionsByDependency).forEach((depName: string) => {
        const versions: Versions = versionsByDependency[depName];
        utils.log(chalk.bold(depName));
        Object.keys(versions).forEach((packageName: string) => {
            utils.log(`├── ${packageName} -> ${versions[packageName]}`);
        });
    });
}

function hasMultipleVersions(versions: Versions): boolean {
    const uniques = new Set(Object.values(versions));
    return uniques.size > 1;
}
