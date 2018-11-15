import * as fs from 'fs';
import * as path from 'path';

import { ContractSource } from '../types';

import { Resolver } from './resolver';

export class NPMResolver extends Resolver {
    private readonly _packagePath: string;
    private readonly _packageParsedPath: path.ParsedPath;

    constructor(packagePath: string) {
        super();
        this._packagePath = packagePath;
        this._packageParsedPath = path.parse(packagePath);
    }
    public resolveIfExists(importPath: string): ContractSource | undefined {
        if (!importPath.startsWith(this._packageParsedPath.root)) {
            const [packageName, ...other] = importPath.split(path.sep);
            const pathWithinPackage = path.join(...other);
            let currentPath = this._packagePath;
            const ROOT_PATH = this._packageParsedPath.root;

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
