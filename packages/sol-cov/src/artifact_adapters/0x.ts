import * as fs from 'fs';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as path from 'path';

import { ContractData } from '../types';

import { AbstractArtifactAdapter } from './abstract';

export class SolCompilerArtifactAdapter extends AbstractArtifactAdapter {
    private _artifactsPath: string;
    private _sourcesPath: string;
    constructor(artifactsPath: string, sourcesPath: string) {
        super();
        this._artifactsPath = artifactsPath;
        this._sourcesPath = sourcesPath;
    }
    public async collectContractsDataAsync(): Promise<ContractData[]> {
        const artifactsGlob = `${this._artifactsPath}/**/*.json`;
        const artifactFileNames = glob.sync(artifactsGlob, { absolute: true });
        const contractsData: ContractData[] = [];
        for (const artifactFileName of artifactFileNames) {
            const artifact = JSON.parse(fs.readFileSync(artifactFileName).toString());
            let sources = _.keys(artifact.sources);
            sources = _.map(sources, relativeFilePath => path.resolve(this._sourcesPath, relativeFilePath));
            const contractName = artifact.contractName;
            // We don't compute coverage for dependencies
            const sourceCodes = _.map(sources, (source: string) => fs.readFileSync(source).toString());
            const contractData = {
                sourceCodes,
                sources,
                bytecode: artifact.compilerOutput.evm.bytecode.object,
                sourceMap: artifact.compilerOutput.evm.bytecode.sourceMap,
                runtimeBytecode: artifact.compilerOutput.evm.deployedBytecode.object,
                sourceMapRuntime: artifact.compilerOutput.evm.deployedBytecode.sourceMap,
            };
            contractsData.push(contractData);
        }
        return contractsData;
    }
}
