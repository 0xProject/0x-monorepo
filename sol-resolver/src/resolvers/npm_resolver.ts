import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';

import { ContractSource } from '../types';

import { Resolver } from './resolver';

export class NPMResolver extends Resolver {
    private readonly _packagePath: string;
    constructor(packagePath: string) {
        super();
        this._packagePath = packagePath;
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
            let currentPath = this._packagePath;
            const ROOT_PATH = '/';
            while (currentPath !== ROOT_PATH) {
                const packagePath =
                    packageScopeIfExists === undefined ? packageName : path.join(packageScopeIfExists, packageName);
                const lookupPath = path.join(currentPath, 'node_modules', packagePath, pathWithinPackage);
                if (fs.existsSync(lookupPath) && fs.lstatSync(lookupPath).isFile()) {
                    const fileContent = fs.readFileSync(lookupPath).toString('ascii');
                    return { source: fileContent, path: importPath, absolutePath: lookupPath };
                }
                currentPath = path.dirname(currentPath);
            }
        }
        return undefined;
    }
}
