import * as fs from 'fs';
import * as path from 'path';

import { ContractSource } from '../types';

import { Resolver } from './resolver';

export class RelativeFSResolver extends Resolver {
    private readonly _contractsDir: string;
    constructor(contractsDir: string) {
        super();
        this._contractsDir = contractsDir;
    }
    // tslint:disable-next-line:prefer-function-over-method
    public resolveIfExists(importPath: string): ContractSource | undefined {
        const filePath = path.join(this._contractsDir, importPath);
        if (fs.existsSync(filePath) && !fs.lstatSync(filePath).isDirectory()) {
            const fileContent = fs.readFileSync(filePath).toString();
            return {
                source: fileContent,
                path: importPath,
            };
        }
        return undefined;
    }
}
