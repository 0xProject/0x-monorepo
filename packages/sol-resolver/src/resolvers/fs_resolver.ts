import * as fs from 'fs';

import { ContractSource } from '../types';

import { Resolver } from './resolver';

export class FSResolver extends Resolver {
    // tslint:disable-next-line:prefer-function-over-method
    public resolveIfExists(importPath: string): ContractSource | undefined {
        if (fs.existsSync(importPath) && fs.lstatSync(importPath).isFile()) {
            const fileContent = fs.readFileSync(importPath).toString();
            return {
                source: fileContent,
                path: importPath,
            };
        }
        return undefined;
    }
}
