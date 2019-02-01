import * as fs from 'fs';
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
            const [packageName, ...other] = importPath.split('/');
            const pathWithinPackage = path.join(...other);
            let currentPath = this._packagePath;
            const ROOT_PATH = '/';
            while (currentPath !== ROOT_PATH) {
                const lookupPath = path.join(currentPath, 'node_modules', packageName, pathWithinPackage);
                if (fs.existsSync(lookupPath) && fs.lstatSync(lookupPath).isFile()) {
                    const fileContent = fs.readFileSync(lookupPath).toString();
                    return {
                        source: fileContent,
                        path: lookupPath,
                    };
                }
                currentPath = path.dirname(currentPath);
            }
        }
        return undefined;
    }
}
