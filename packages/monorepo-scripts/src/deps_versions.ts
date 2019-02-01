#!/usr/bin/env node

import chalk from 'chalk';
import * as fs from 'fs';
import { sync as globSync } from 'glob';
import * as _ from 'lodash';

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

const PACKAGE_JSON_GLOB = '../*/package.json';

// tslint:disable:no-unused-variable
function getDependencies(path: string): Dependencies {
    const file = fs.readFileSync(path).toString();
    const parsed = JSON.parse(file);
    const dependencies = {
        ...parsed.dependencies,
        ...parsed.devDependencies,
    };
    return dependencies;
}

const files = globSync(PACKAGE_JSON_GLOB);
const versionsByDependency: VersionsByDependency = {};
files.map(path => {
    const [_1, packageName, _2] = path.split('/');
    const dependencies = getDependencies(path);
    _.map(dependencies, (version: string, depName: string) => {
        if (_.isUndefined(versionsByDependency[depName])) {
            versionsByDependency[depName] = {};
        }
        versionsByDependency[depName][packageName] = version;
    });
});

_.map(versionsByDependency, (versions: Versions, depName: string) => {
    if (_.uniq(_.values(versions)).length === 1) {
        delete versionsByDependency[depName];
    } else {
        utils.log(chalk.bold(depName));
        _.map(versions, (version: string, packageName: string) => {
            utils.log(`├── ${packageName} -> ${version}`);
        });
    }
});
// tslint:disable:no-unused-variable
