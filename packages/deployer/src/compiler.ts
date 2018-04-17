import {
    ContractSource,
    ContractSources,
    EnumerableResolver,
    FallthroughResolver,
    FSResolver,
    NameResolver,
    NPMResolver,
    Resolver,
    URLResolver,
} from '@0xproject/sol-resolver';
import { ContractAbi } from '@0xproject/types';
import { logUtils, promisify } from '@0xproject/utils';
import chalk from 'chalk';
import * as ethUtil from 'ethereumjs-util';
import * as fs from 'fs';
import 'isomorphic-fetch';
import * as _ from 'lodash';
import * as path from 'path';
import * as requireFromString from 'require-from-string';
import * as semver from 'semver';
import solc = require('solc');

import { binPaths } from './solc/bin_paths';
import {
    createDirIfDoesNotExistAsync,
    getContractArtifactIfExistsAsync,
    getNormalizedErrMsg,
    parseDependencies,
    parseSolidityVersionRange,
} from './utils/compiler';
import { constants } from './utils/constants';
import { fsWrapper } from './utils/fs_wrapper';
import {
    CompilerOptions,
    ContractArtifact,
    ContractNetworkData,
    ContractNetworks,
    ContractSourceData,
    ContractSpecificSourceData,
} from './utils/types';
import { utils } from './utils/utils';

const ALL_CONTRACTS_IDENTIFIER = '*';
const SOLC_BIN_DIR = path.join(__dirname, '..', '..', 'solc_bin');

/**
 * The Compiler facilitates compiling Solidity smart contracts and saves the results
 * to artifact files.
 */
export class Compiler {
    private _resolver: Resolver;
    private _nameResolver: NameResolver;
    private _contractsDir: string;
    private _networkId: number;
    private _optimizerEnabled: boolean;
    private _artifactsDir: string;
    private _specifiedContracts: Set<string> = new Set();
    /**
     * Instantiates a new instance of the Compiler class.
     * @param opts Options specifying directories, network, and optimization settings.
     * @return An instance of the Compiler class.
     */
    constructor(opts: CompilerOptions) {
        this._contractsDir = opts.contractsDir;
        this._networkId = opts.networkId;
        this._optimizerEnabled = opts.optimizerEnabled;
        this._artifactsDir = opts.artifactsDir;
        this._specifiedContracts = opts.specifiedContracts;
        this._nameResolver = new NameResolver(path.resolve(this._contractsDir));
        const resolver = new FallthroughResolver();
        resolver.appendResolver(new URLResolver());
        const packagePath = path.resolve('');
        resolver.appendResolver(new NPMResolver(packagePath));
        resolver.appendResolver(new FSResolver());
        resolver.appendResolver(this._nameResolver);
        this._resolver = resolver;
    }
    /**
     * Compiles selected Solidity files found in `contractsDir` and writes JSON artifacts to `artifactsDir`.
     */
    public async compileAsync(): Promise<void> {
        await createDirIfDoesNotExistAsync(this._artifactsDir);
        await createDirIfDoesNotExistAsync(SOLC_BIN_DIR);
        let contractNamesToCompile: string[] = [];
        if (this._specifiedContracts.has(ALL_CONTRACTS_IDENTIFIER)) {
            const allContracts = this._nameResolver.getAll();
            contractNamesToCompile = _.map(allContracts, contractSource =>
                path.basename(contractSource.path, constants.SOLIDITY_FILE_EXTENSION),
            );
        } else {
            contractNamesToCompile = Array.from(this._specifiedContracts.values());
        }
        for (const contractNameToCompile of contractNamesToCompile) {
            await this._compileContractAsync(contractNameToCompile);
        }
    }
    /**
     * Compiles contract and saves artifact to artifactsDir.
     * @param fileName Name of contract with '.sol' extension.
     */
    private async _compileContractAsync(contractName: string): Promise<void> {
        const contractSource = this._resolver.resolve(contractName);
        const currentArtifactIfExists = await getContractArtifactIfExistsAsync(this._artifactsDir, contractName);
        const sourceTreeHashHex = `0x${this._getSourceTreeHash(contractSource.path).toString('hex')}`;

        let shouldCompile = false;
        if (_.isUndefined(currentArtifactIfExists)) {
            shouldCompile = true;
        } else {
            const currentArtifact = currentArtifactIfExists as ContractArtifact;
            shouldCompile =
                currentArtifact.networks[this._networkId].optimizer_enabled !== this._optimizerEnabled ||
                currentArtifact.networks[this._networkId].source_tree_hash !== sourceTreeHashHex;
        }
        if (!shouldCompile) {
            return;
        }
        const solcVersionRange = parseSolidityVersionRange(contractSource.source);
        const availableCompilerVersions = _.keys(binPaths);
        const solcVersion = semver.maxSatisfying(availableCompilerVersions, solcVersionRange);
        const fullSolcVersion = binPaths[solcVersion];
        const compilerBinFilename = path.join(SOLC_BIN_DIR, fullSolcVersion);
        let solcjs: string;
        const isCompilerAvailableLocally = fs.existsSync(compilerBinFilename);
        if (isCompilerAvailableLocally) {
            solcjs = fs.readFileSync(compilerBinFilename).toString();
        } else {
            logUtils.log(`Downloading ${fullSolcVersion}...`);
            const url = `${constants.BASE_COMPILER_URL}${fullSolcVersion}`;
            const response = await fetch(url);
            if (response.status !== 200) {
                throw new Error(`Failed to load ${fullSolcVersion}`);
            }
            solcjs = await response.text();
            fs.writeFileSync(compilerBinFilename, solcjs);
        }
        const solcInstance = solc.setupMethods(requireFromString(solcjs, compilerBinFilename));

        logUtils.log(`Compiling ${contractName} with Solidity v${solcVersion}...`);
        const source = contractSource.source;
        const absoluteFilePath = contractSource.path;
        const standardInput: solc.StandardInput = {
            language: 'Solidity',
            sources: {
                [absoluteFilePath]: {
                    urls: [`file://${absoluteFilePath}`],
                },
            },
            settings: {
                optimizer: {
                    enabled: this._optimizerEnabled,
                },
                outputSelection: {
                    '*': {
                        '*': [
                            'abi',
                            'evm.bytecode.object',
                            'evm.bytecode.sourceMap',
                            'evm.deployedBytecode.object',
                            'evm.deployedBytecode.sourceMap',
                        ],
                    },
                },
            },
        };
        const compiled: solc.StandardOutput = JSON.parse(
            solcInstance.compileStandardWrapper(JSON.stringify(standardInput), importPath => {
                const sourceCodeIfExists = this._resolver.resolve(importPath);
                return { contents: sourceCodeIfExists.source };
            }),
        );

        if (!_.isUndefined(compiled.errors)) {
            const SOLIDITY_WARNING = 'warning';
            const errors = _.filter(compiled.errors, entry => entry.severity !== SOLIDITY_WARNING);
            const warnings = _.filter(compiled.errors, entry => entry.severity === SOLIDITY_WARNING);
            if (!_.isEmpty(errors)) {
                errors.forEach(error => {
                    const normalizedErrMsg = getNormalizedErrMsg(error.formattedMessage || error.message);
                    logUtils.log(chalk.red(normalizedErrMsg));
                });
                process.exit(1);
            } else {
                warnings.forEach(warning => {
                    const normalizedWarningMsg = getNormalizedErrMsg(warning.formattedMessage || warning.message);
                    logUtils.log(chalk.yellow(normalizedWarningMsg));
                });
            }
        }
        const compiledData = compiled.contracts[absoluteFilePath][contractName];
        if (_.isUndefined(compiledData)) {
            throw new Error(
                `Contract ${contractName} not found in ${absoluteFilePath}. Please make sure your contract has the same name as it's file name`,
            );
        }
        const abi: ContractAbi = compiledData.abi;
        const bytecode = `0x${compiledData.evm.bytecode.object}`;
        const runtimeBytecode = `0x${compiledData.evm.deployedBytecode.object}`;
        const sourceMap = compiledData.evm.bytecode.sourceMap;
        const sourceMapRuntime = compiledData.evm.deployedBytecode.sourceMap;
        const unresolvedSourcePaths = _.keys(compiled.sources);
        const sources = _.map(
            unresolvedSourcePaths,
            unresolvedSourcePath => this._resolver.resolve(unresolvedSourcePath).path,
        );
        const updated_at = Date.now();
        const contractNetworkData: ContractNetworkData = {
            solc_version: solcVersion,
            source_tree_hash: sourceTreeHashHex,
            optimizer_enabled: this._optimizerEnabled,
            abi,
            bytecode,
            runtime_bytecode: runtimeBytecode,
            updated_at,
            source_map: sourceMap,
            source_map_runtime: sourceMapRuntime,
            sources,
        };

        let newArtifact: ContractArtifact;
        if (!_.isUndefined(currentArtifactIfExists)) {
            const currentArtifact = currentArtifactIfExists as ContractArtifact;
            newArtifact = {
                ...currentArtifact,
                networks: {
                    ...currentArtifact.networks,
                    [this._networkId]: contractNetworkData,
                },
            };
        } else {
            newArtifact = {
                contract_name: contractName,
                networks: {
                    [this._networkId]: contractNetworkData,
                },
            };
        }

        const artifactString = utils.stringifyWithFormatting(newArtifact);
        const currentArtifactPath = `${this._artifactsDir}/${contractName}.json`;
        await fsWrapper.writeFileAsync(currentArtifactPath, artifactString);
        logUtils.log(`${contractName} artifact saved!`);
    }
    /**
     * Gets the source tree hash for a file and its dependencies.
     * @param fileName Name of contract file.
     */
    private _getSourceTreeHash(importPath: string): Buffer {
        const contractSource = this._resolver.resolve(importPath);
        const dependencies = parseDependencies(contractSource);
        const sourceHash = ethUtil.sha3(contractSource.source);
        if (dependencies.length === 0) {
            return sourceHash;
        } else {
            const dependencySourceTreeHashes = _.map(dependencies, (dependency: string) =>
                this._getSourceTreeHash(dependency),
            );
            const sourceTreeHashesBuffer = Buffer.concat([sourceHash, ...dependencySourceTreeHashes]);
            const sourceTreeHash = ethUtil.sha3(sourceTreeHashesBuffer);
            return sourceTreeHash;
        }
    }
}
