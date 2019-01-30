#!/usr/bin/env node

import chalk from 'chalk';
import * as fs from 'fs';
import { sync as globSync } from 'glob';
import * as path from 'path';

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

const PACKAGE_JSON_GLOB = '../../*/package.json';
const ignore: string[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../../package.json')).toString(),
).config.dependenciesWithMultipleVersions.split(' ');

if (require.main === module) {
    const versions = getVersionsByDependency();
    const multiples = getDependenciesWithMultipleVersions(versions);
    printVersionsByDependency(multiples);
    if (!(Object.keys(multiples).length === 0)) {
        console.log(`Add space-separated exceptions to root package.json config.dependenciesWithMultipleVersions`);
        process.exit(1);
    }
}

function getDependencies(_path: string): Dependencies {
    const file = fs.readFileSync(_path).toString();
    const parsed = JSON.parse(file);
    const dependencies = {
        ...parsed.dependencies,
        ...parsed.devDependencies,
    };
    return dependencies;
}

export function getVersionsByDependency(): VersionsByDependency {
    const files = globSync(path.join(__dirname, PACKAGE_JSON_GLOB));
    const versionsByDependency: VersionsByDependency = {};
    files.map(_path => {
        const pathParts = _path.split('/');
        const packageName = pathParts[pathParts.length - 2];
        const dependencies = getDependencies(_path);
        Object.keys(dependencies).forEach((depName: string) => {
            if (versionsByDependency[depName] === undefined) {
                versionsByDependency[depName] = {};
            }
            const version = dependencies[depName];
            versionsByDependency[depName][packageName] = version;
        });
    });
    return versionsByDependency;
}

export function getDependenciesWithMultipleVersions(versionsByDependency: VersionsByDependency): VersionsByDependency {
    return Object.keys(versionsByDependency)
        .filter((depName: string) => !ignore.includes(depName) && hasMultipleVersions(versionsByDependency[depName]))
        .reduce((obj: VersionsByDependency, depName: string) => {
            obj[depName] = versionsByDependency[depName];
            return obj;
        }, {});
}
export function hasAnyMultipleVersions(versionsByDependency: VersionsByDependency): boolean {
    const multiples = getDependenciesWithMultipleVersions(versionsByDependency);
    return !(Object.keys(multiples).length === 0);
}

export function printVersionsByDependency(versionsByDependency: VersionsByDependency): void {
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
