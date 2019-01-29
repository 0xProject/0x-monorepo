import { promisify } from '@0x/utils';
import * as fs from 'fs';
import * as path from 'path';

import glob = require('glob');
import { SubResolver } from 'resolver-engine';

// import { ContractSource } from '../types';

// import { EnumerableResolver } from './enumerable_resolver';
const globAsync = promisify<string[]>(glob);

const SOLIDITY_FILE_EXTENSION = '.sol';

export function NameResolver(contractDir: string): SubResolver {
    return async (resolvePath: string) => {
        const results = await globAsync(contractDir + '/**/' + resolvePath + SOLIDITY_FILE_EXTENSION);
        if (results.length === 1) {
            return results[0];
        }
        return null;
    };
}

// try {
//     new Promise((resolve, reject) => {
//         glob("**/*.sol", (err, matches) => {
//             if (err) {
//                 return reject(err);
//             }
//             return resolve(matches);
//             throw new Error("Dupa");
//         })
//     }).then(file => console.log(file)).catch(err => err);
// catch (err) {

// }

// await globAsync("**/*.sol");

// GlobResolver(uri): string[];

// NameResolver() {
//     GlobResolver(con)
// }

// export class NameResolver extends EnumerableResolver {
//     private readonly _contractsDir: string;
//     constructor(contractsDir: string) {
//         super();
//         this._contractsDir = contractsDir;
//     }
//     public resolveIfExists(lookupContractName: string): ContractSource | undefined {
//         let contractSource: ContractSource | undefined;
//         const onFile = (filePath: string) => {
//             const contractName = path.basename(filePath, SOLIDITY_FILE_EXTENSION);
//             if (contractName === lookupContractName) {
//                 const absoluteContractPath = path.join(this._contractsDir, filePath);
//                 const source = fs.readFileSync(absoluteContractPath).toString();
//                 contractSource = { source, path: filePath, absolutePath: absoluteContractPath };
//                 return true;
//             }
//             return undefined;
//         };
//         this._traverseContractsDir(this._contractsDir, onFile);
//         return contractSource;
//     }
//     public getAll(): ContractSource[] {
//         const contractSources: ContractSource[] = [];
//         const onFile = (filePath: string) => {
//             const absoluteContractPath = path.join(this._contractsDir, filePath);
//             const source = fs.readFileSync(absoluteContractPath).toString();
//             const contractSource = { source, path: filePath, absolutePath: absoluteContractPath };
//             contractSources.push(contractSource);
//         };
//         this._traverseContractsDir(this._contractsDir, onFile);
//         return contractSources;
//     }
//     // tslint:disable-next-line:prefer-function-over-method
//     private _traverseContractsDir(dirPath: string, onFile: (filePath: string) => true | void): boolean {
//         let dirContents: string[] = [];
//         try {
//             dirContents = fs.readdirSync(dirPath);
//         } catch (err) {
//             throw new Error(`No directory found at ${dirPath}`);
//         }
//         for (const fileName of dirContents) {
//             const absoluteEntryPath = path.join(dirPath, fileName);
//             const isDirectory = fs.lstatSync(absoluteEntryPath).isDirectory();
//             const entryPath = path.relative(this._contractsDir, absoluteEntryPath);
//             let isComplete;
//             if (isDirectory) {
//                 isComplete = this._traverseContractsDir(absoluteEntryPath, onFile);
//             } else if (fileName.endsWith(SOLIDITY_FILE_EXTENSION)) {
//                 isComplete = onFile(entryPath);
//             }
//             if (isComplete) {
//                 return isComplete;
//             }
//         }
//         return false;
//     }
// }
