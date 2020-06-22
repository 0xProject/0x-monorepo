import {
    FallthroughResolver,
    FSResolver,
    NameResolver,
    NPMResolver,
    RelativeFSResolver,
    URLResolver,
} from '@0x/sol-resolver';
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
    private readonly _resolver: FallthroughResolver;
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
        if (artifactsPath === undefined && config.artifactsDir === undefined) {
            throw new Error(`artifactsDir not found in ${CONFIG_FILE}`);
        }
        this._artifactsPath = (artifactsPath || config.artifactsDir) as string;
        if (sourcesPath === undefined && config.contractsDir === undefined) {
            throw new Error(`contractsDir not found in ${CONFIG_FILE}`);
        }
        this._sourcesPath = (sourcesPath || config.contractsDir) as string;
        this._resolver = new FallthroughResolver();
        this._resolver.appendResolver(new URLResolver());
        const packagePath = path.resolve('');
        this._resolver.appendResolver(new NPMResolver(packagePath));
        this._resolver.appendResolver(new RelativeFSResolver(this._sourcesPath));
        this._resolver.appendResolver(new FSResolver());
        this._resolver.appendResolver(new NameResolver(this._sourcesPath));
    }
    public async collectContractsDataAsync(): Promise<ContractData[]> {
        const artifactsGlob = `${this._artifactsPath}/**/*.json`;
        const artifactFileNames = glob.sync(artifactsGlob, { absolute: true });
        const contractsData: ContractData[] = [];
        for (const artifactFileName of artifactFileNames) {
            const artifact: ContractArtifact = JSON.parse(fs.readFileSync(artifactFileName).toString());
            if (artifact.compilerOutput === undefined || artifact.compilerOutput.evm === undefined) {
                logUtils.warn(`${artifactFileName} doesn't contain bytecode. Skipping...`);
                continue;
            }
            const sources: Sources = {};
            const sourceCodes: SourceCodes = {};
            _.map(artifact.sources, (value: { id: number }, relativeFilePath: string) => {
                const source = this._resolver.resolve(relativeFilePath);
                sources[value.id] = source.absolutePath;
                sourceCodes[value.id] = source.source;
            });
            const contractData = {
                name: artifact.contractName,
                sourceCodes,
                sources,
                bytecode: artifact.compilerOutput.evm.bytecode.object,
                sourceMap: artifact.compilerOutput.evm.bytecode.sourceMap,
                runtimeBytecode: artifact.compilerOutput.evm.deployedBytecode.object,
                sourceMapRuntime: artifact.compilerOutput.evm.deployedBytecode.sourceMap,
            };
            const isInterfaceContract = contractData.bytecode === '0x' && contractData.runtimeBytecode === '0x';
            if (isInterfaceContract) {
                continue;
            }
            contractsData.push(contractData);
        }
        return contractsData;
    }
}
