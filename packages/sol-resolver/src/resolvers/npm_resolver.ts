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
                // NodeJS documentation recommends using try/catch arround read
                // instead of using fs.statSuync. We don't do this because:
                // 1) We want it to fail when the file exists but does not
                //    have read permissions.
                // 2) The thrown error message is platform dependent.
                if (fs.existsSync(lookupPath) &&
                    fs.statSync(lookupPath).isFile()) {
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
