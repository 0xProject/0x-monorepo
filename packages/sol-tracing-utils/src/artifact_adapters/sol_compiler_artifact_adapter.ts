import { logUtils } from '@0x/utils';
import { CompilerOptions, ContractArtifact } from 'ethereum-types';
import * as fs from 'fs';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as path from 'path';

import { ContractData, SourceCodes, Sources } from '../types';

import { AbstractArtifactAdapter } from './abstract_artifact_adapter';

const CONFIG_FILE = 'compiler.json';

export class SolCompilerArtifactAdapter extends AbstractArtifactAdapter {
    private readonly _artifactsPath: string;
    private readonly _sourcesPath: string;
    /**
     * Instantiates a SolCompilerArtifactAdapter
     * @param artifactsPath Path to your artifacts directory
     * @param sourcesPath Path to your contract sources directory
     */
    constructor(artifactsPath?: string, sourcesPath?: string) {
        super();
        const config: CompilerOptions = fs.existsSync(CONFIG_FILE)
            ? JSON.parse(fs.readFileSync(CONFIG_FILE).toString())
            : {};
        if (_.isUndefined(artifactsPath) && _.isUndefined(config.artifactsDir)) {
            throw new Error(`artifactsDir not found in ${CONFIG_FILE}`);
        }
        this._artifactsPath = (artifactsPath || config.artifactsDir) as string;
        if (_.isUndefined(sourcesPath) && _.isUndefined(config.contractsDir)) {
            throw new Error(`contractsDir not found in ${CONFIG_FILE}`);
        }
        this._sourcesPath = (sourcesPath || config.contractsDir) as string;
    }
    public async collectContractsDataAsync(): Promise<ContractData[]> {
        const artifactsGlob = `${this._artifactsPath}/**/*.json`;
        const artifactFileNames = glob.sync(artifactsGlob, { absolute: true });
        const contractsData: ContractData[] = [];
        for (const artifactFileName of artifactFileNames) {
            const artifact: ContractArtifact = JSON.parse(fs.readFileSync(artifactFileName).toString());
            if (_.isUndefined(artifact.compilerOutput.evm)) {
                logUtils.warn(`${artifactFileName} doesn't contain bytecode. Skipping...`);
                continue;
            }
            const sources: Sources = {};
            const sourceCodes: SourceCodes = {};
            _.map(artifact.sources, (value: { id: number }, relativeFilePath: string) => {
                const filePath = path.resolve(this._sourcesPath, relativeFilePath);
                const fileContent = fs.readFileSync(filePath).toString();
                sources[value.id] = filePath;
                sourceCodes[value.id] = fileContent;
            });
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
