import { Compiler, CompilerOptions } from '@0x/sol-compiler';
import * as fs from 'fs';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as path from 'path';
import * as solc from 'solc';

import { ContractData } from '../types';

import { AbstractArtifactAdapter } from './abstract_artifact_adapter';
import { SolCompilerArtifactAdapter } from './sol_compiler_artifact_adapter';

const DEFAULT_TRUFFLE_ARTIFACTS_DIR = './build/contracts';

interface TruffleSolcConfig {
    version?: string;
    settings?: solc.CompilerSettings;
}
interface TruffleConfig {
    solc?: TruffleSolcConfig;
    compilers?: {
        solc?: TruffleSolcConfig;
    };
    contracts_build_directory?: string;
}

export class TruffleArtifactAdapter extends AbstractArtifactAdapter {
    private readonly _solcVersion: string;
    private readonly _projectRoot: string;
    /**
     * Instantiates a TruffleArtifactAdapter
     * @param projectRoot Path to the truffle project's root directory
     * @param solcVersion Solidity version with which to compile all the contracts
     */
    constructor(projectRoot: string, solcVersion: string) {
        super();
        this._solcVersion = solcVersion;
        this._projectRoot = projectRoot;
    }
    public async collectContractsDataAsync(): Promise<ContractData[]> {
        const artifactsDir = '.0x-artifacts';
        const contractsDir = path.join(this._projectRoot, 'contracts');
        const truffleConfig = this._getTruffleConfig();
        const solcConfig = this._getTruffleSolcSettings();
        const truffleArtifactsDirectory = truffleConfig.contracts_build_directory || DEFAULT_TRUFFLE_ARTIFACTS_DIR;
        this._assertSolidityVersionIsCorrect(truffleArtifactsDirectory);
        const compilerOptions: CompilerOptions = {
            contractsDir,
            artifactsDir,
            compilerSettings: {
                ...solcConfig,
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
        const solCompilerArtifactAdapter = new SolCompilerArtifactAdapter(artifactsDir, contractsDir);
        const contractsDataFrom0xArtifacts = await solCompilerArtifactAdapter.collectContractsDataAsync();
        return contractsDataFrom0xArtifacts;
    }
    private _getTruffleConfig(): TruffleConfig {
        const truffleConfigFileShort = path.resolve(path.join(this._projectRoot, 'truffle.js'));
        const truffleConfigFileLong = path.resolve(path.join(this._projectRoot, 'truffle-config.js'));
        if (fs.existsSync(truffleConfigFileShort)) {
            const truffleConfig = require(truffleConfigFileShort);
            return truffleConfig;
        } else if (fs.existsSync(truffleConfigFileLong)) {
            const truffleConfig = require(truffleConfigFileLong);
            return truffleConfig;
        } else {
            throw new Error(
                `Neither ${truffleConfigFileShort} nor ${truffleConfigFileLong} exists. Make sure the project root is correct`,
            );
        }
    }
    private _getTruffleSolcSettings(): Partial<solc.CompilerSettings> {
        const truffleConfig = this._getTruffleConfig();
        if (truffleConfig.solc !== undefined) {
            // Truffle < 5.0
            return (truffleConfig as any).solc;
        } else if ((truffleConfig as any).compilers.solc !== undefined) {
            // Truffle >= 5.0
            return (truffleConfig as any).compilers.solc.settings;
        } else {
            return {};
        }
    }
    private _assertSolidityVersionIsCorrect(truffleArtifactsDirectory: string): void {
        const artifactsGlob = `${truffleArtifactsDirectory}/**/*.json`;
        const artifactFileNames = glob.sync(artifactsGlob, { absolute: true });
        for (const artifactFileName of artifactFileNames) {
            const artifact = JSON.parse(fs.readFileSync(artifactFileName).toString());
            const compilerVersion = artifact.compiler.version;
            if (!compilerVersion.startsWith(this._solcVersion)) {
                throw new Error(
                    `${artifact.contractName} was compiled with solidity ${compilerVersion} but specified version is ${
                        this._solcVersion
                    } making it impossible to process traces`,
                );
            }
        }
    }
}
