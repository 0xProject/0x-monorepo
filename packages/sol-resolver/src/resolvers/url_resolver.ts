import * as fs from 'fs';

import { ContractSource } from '../types';

import { Resolver } from './resolver';

export class URLResolver extends Resolver {
    // tslint:disable-next-line:prefer-function-over-method
    public resolveIfExists(importPath: string): ContractSource | undefined {
        const FILE_URL_PREXIF = 'file://';
        if (importPath.startsWith(FILE_URL_PREXIF)) {
            const filePath = importPath.substr(FILE_URL_PREXIF.length);
            const fileContent = fs.readFileSync(filePath).toString();
            return {
                source: fileContent,
                path: importPath,
            };
        }
        return undefined;
    }
}
