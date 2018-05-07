import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';

import { ContractSource } from '../types';

import { EnumerableResolver } from './enumerable_resolver';

export class NameResolver extends EnumerableResolver {
    private _contractsDir: string;
    constructor(contractsDir: string) {
        super();
        this._contractsDir = contractsDir;
    }
    public resolveIfExists(lookupContractName: string): ContractSource | undefined {
        const SOLIDITY_FILE_EXTENSION = '.sol';
        let contractSource: ContractSource | undefined;
        const onFile = (filePath: string) => {
            const contractName = path.basename(filePath, SOLIDITY_FILE_EXTENSION);
            if (contractName === lookupContractName) {
                const absoluteContractPath = path.join(this._contractsDir, filePath);
                const source = fs.readFileSync(absoluteContractPath).toString();
                contractSource = {
                    source,
                    path: filePath,
                };
                return true;
            }
            return undefined;
        };
        this._traverseContractsDir(this._contractsDir, onFile);
        return contractSource;
    }
    public getAll(): ContractSource[] {
        const SOLIDITY_FILE_EXTENSION = '.sol';
        const contractSources: ContractSource[] = [];
        const onFile = (filePath: string) => {
            const contractName = path.basename(filePath, SOLIDITY_FILE_EXTENSION);
            const absoluteContractPath = path.join(this._contractsDir, filePath);
            const source = fs.readFileSync(absoluteContractPath).toString();
            const contractSource = {
                source,
                path: filePath,
            };
            contractSources.push(contractSource);
        };
        this._traverseContractsDir(this._contractsDir, onFile);
        return contractSources;
    }
    // tslint:disable-next-line:prefer-function-over-method
    private _traverseContractsDir(dirPath: string, onFile: (filePath: string) => true | void): boolean {
        let dirContents: string[] = [];
        try {
            dirContents = fs.readdirSync(dirPath);
        } catch (err) {
            throw new Error(`No directory found at ${dirPath}`);
        }
        for (const fileName of dirContents) {
            const absoluteEntryPath = path.join(dirPath, fileName);
            const isDirectory = fs.lstatSync(absoluteEntryPath).isDirectory();
            const entryPath = path.relative(this._contractsDir, absoluteEntryPath);
            const isComplete = isDirectory ? this._traverseContractsDir(absoluteEntryPath, onFile) : onFile(entryPath);
            if (isComplete) {
                return isComplete;
            }
        }
        return false;
    }
}
