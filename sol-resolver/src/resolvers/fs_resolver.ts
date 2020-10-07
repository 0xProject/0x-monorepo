import * as fs from 'fs';
import * as path from 'path';

import { ContractSource } from '../types';

import { Resolver } from './resolver';

export class FSResolver extends Resolver {
    // tslint:disable-next-line:prefer-function-over-method
    public resolveIfExists(importPath: string): ContractSource | undefined {
        if (fs.existsSync(importPath) && fs.lstatSync(importPath).isFile()) {
            const fileContent = fs.readFileSync(importPath).toString('ascii');
            const absolutePath = path.resolve(importPath);
            return { source: fileContent, path: importPath, absolutePath } as any;
        }
        return undefined;
    }
}
