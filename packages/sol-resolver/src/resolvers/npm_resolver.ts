import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';

import { ContractSource } from '../types';

import { Resolver } from './resolver';

export class NPMResolver extends Resolver {
    private readonly _packagePath: string;
    private readonly _workspacePath: string;
    constructor(packagePath: string, workspacePath: string) {
        super();
        this._packagePath = packagePath;
        this._workspacePath = workspacePath;
    }
    public resolveIfExists(importPath: string): ContractSource | undefined {
        if (!importPath.startsWith('/')) {
            let packageName;
            let packageScopeIfExists;
            let other;
            if (_.startsWith(importPath, '@')) {
                [packageScopeIfExists, packageName, ...other] = importPath.split('/');
            } else {
                [packageName, ...other] = importPath.split('/');
            }
            const pathWithinPackage = path.join(...other);
            for (
                let currentPath = this._packagePath;
                currentPath.includes(this._workspacePath);
                currentPath = path.dirname(currentPath)
            ) {
                const packagePath = _.isUndefined(packageScopeIfExists)
                    ? packageName
                    : path.join(packageScopeIfExists, packageName);
                const lookupPath = path.join(currentPath, 'node_modules', packagePath, pathWithinPackage);
                if (fs.existsSync(lookupPath) && fs.lstatSync(lookupPath).isFile()) {
                    const fileContent = fs.readFileSync(lookupPath).toString();
                    return { source: fileContent, path: importPath, absolutePath: lookupPath };
                }
            }
        }
        return undefined;
    }
}
