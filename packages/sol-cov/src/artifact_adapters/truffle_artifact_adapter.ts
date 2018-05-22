import { Compiler, CompilerOptions } from '@0xproject/sol-compiler';
import * as fs from 'fs';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as path from 'path';
import * as rimraf from 'rimraf';

import { ContractData } from '../types';

import { SolCompilerArtifactAdapter } from './0x';
import { AbstractArtifactAdapter } from './abstract';

export class TruffleArtifactAdapter extends AbstractArtifactAdapter {
    private _solcVersion: string;
    private _sourcesPath: string;
    constructor(sourcesPath: string, solcVersion: string) {
        super();
        this._solcVersion = solcVersion;
        this._sourcesPath = sourcesPath;
    }
    public async collectContractsDataAsync(): Promise<ContractData[]> {
        const artifactsDir = '.0x-artifacts';
        const compilerOptions: CompilerOptions = {
            contractsDir: this._sourcesPath,
            artifactsDir,
            compilerSettings: {
                outputSelection: {
                    ['*']: {
                        ['*']: ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'],
                    },
                },
            },
            contracts: '*',
            solcVersion: this._solcVersion,
        };
        const compiler = new Compiler(compilerOptions);
        await compiler.compileAsync();
        const solCompilerArtifactAdapter = new SolCompilerArtifactAdapter(artifactsDir, this._sourcesPath);
        const contractsDataFrom0xArtifacts = await solCompilerArtifactAdapter.collectContractsDataAsync();
        rimraf.sync(artifactsDir);
        return contractsDataFrom0xArtifacts;
    }
}
