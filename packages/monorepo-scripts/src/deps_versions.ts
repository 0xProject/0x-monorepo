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
const excludes: string[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../../package.json')).toString(),
).config.dependenciesWithMultipleVersions.split(' ');

if (require.main === module) {
    const versions = getVersionsByDependency();
    printVersionsByDependency(versions);
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
    console.log(files);
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

export function hasAnyMultipleVersions(versionsByDependency: VersionsByDependency): boolean {
    Object.keys(versionsByDependency)
        .filter((depName: string) => !excludes.includes(depName))
        .forEach((depName: string): false | undefined => {
            const versions = versionsByDependency[depName];
            if (hasMultipleVersions(versions)) {
                return false;
            }
            return;
        });
    return true;
}

export function printVersionsByDependency(versionsByDependency: VersionsByDependency): void {
    Object.keys(versionsByDependency).forEach(depName => {
        const versions = versionsByDependency[depName];
        if (!excludes.includes(depName) && hasMultipleVersions(versions)) {
            utils.log(chalk.bold(depName));
            Object.keys(versions).forEach(packageName => {
                utils.log(`├── ${packageName} -> ${versions[packageName]}`);
            });
        }
    });
}

function hasMultipleVersions(versions: Versions): boolean {
    const uniques = new Set(Object.values(versions));
    return uniques.size > 1;
}
