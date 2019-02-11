import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import * as semver from 'semver';

import { ContractSource } from '../types';

import { Resolver } from './resolver';

export class NPMResolver extends Resolver {
    private readonly _packagePath: string;
    private readonly _dependencies: { [dependencyName: string]: string };
    private static _lookupPath(startingPath: string, lookupTarget: string): string | undefined {
        let currentPath = startingPath;
        const ROOT_PATH = '/';
        while (currentPath !== ROOT_PATH) {
            const lookupPath = path.join(currentPath, lookupTarget);
            if (fs.existsSync(lookupPath)) {
                return currentPath;
            }
            currentPath = path.dirname(currentPath);
        }
        return undefined;
    }
    private static _parseDependencyImport(importPath: string): { dependencyName: string; internalPath: string } {
        let packageName;
        let packageScopeIfExists;
        let other;
        if (_.startsWith(importPath, '@')) {
            [packageScopeIfExists, packageName, ...other] = importPath.split('/');
        } else {
            [packageName, ...other] = importPath.split('/');
        }
        const dependencyName = _.isUndefined(packageScopeIfExists)
            ? packageName
            : path.join(packageScopeIfExists, packageName);
        const internalPath = path.join(...other);
        return {
            dependencyName,
            internalPath,
        };
    }
    private static _getPackageVersion(packagePath: string): string {
        const packageJSONPath = path.join(packagePath, 'package.json');
        const packageJSON = JSON.parse(fs.readFileSync(packageJSONPath).toString());
        const packageVersion = packageJSON.version;
        return packageVersion;
    }
    constructor(packagePath: string) {
        super();
        this._packagePath = packagePath;
        const packageJSONPath = path.join(this._packagePath, 'package.json');
        const packageJSON = JSON.parse(fs.readFileSync(packageJSONPath).toString());
        this._dependencies = { ...packageJSON.dependencies, ...packageJSON.devDependencies };
    }
    public resolveIfExists(importPath: string): ContractSource | undefined {
        if (importPath.startsWith('/')) {
            return undefined;
        }
        const { dependencyName, internalPath } = NPMResolver._parseDependencyImport(importPath);
        const dependencyLookupTarget = path.join('node_modules', dependencyName);
        const dependencyLookupResult = NPMResolver._lookupPath(this._packagePath, dependencyLookupTarget);
        if (_.isUndefined(dependencyLookupResult)) {
            return undefined;
        }
        if (!(dependencyName in this._dependencies)) {
            throw new Error(
                `Lookup for ${dependencyName} started from ${this._packagePath} failed. Not specified in package.json`,
            );
        }

        const dependencyPackagePath = path.join(dependencyLookupResult, dependencyLookupTarget);
        const dependencyVersion = NPMResolver._getPackageVersion(dependencyPackagePath);
        const versionRange = this._dependencies[dependencyName];
        if (!semver.satisfies(dependencyVersion, versionRange)) {
            throw new Error(
                `Lookup for ${dependencyName} started from ${
                    this._packagePath
                } found ${dependencyName}@${dependencyVersion} at ${dependencyPackagePath} which does not satisfy ${versionRange}`,
            );
        }
        const dependencyFilePath = path.join(dependencyPackagePath, internalPath);
        const dependencyFileContent = fs.readFileSync(dependencyFilePath).toString();
        return { source: dependencyFileContent, path: importPath, absolutePath: dependencyFilePath };
    }
}
