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
    findImportIfExist,
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
    ContractSources,
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
    private _contractsDir: string;
    private _networkId: number;
    private _optimizerEnabled: boolean;
    private _artifactsDir: string;
    // This get's set in the beggining of `compileAsync` function. It's not called from a constructor, but it's the only public method of that class and could as well be.
    private _contractSources!: ContractSources;
    private _specifiedContracts: Set<string> = new Set();
    private _contractSourceData: ContractSourceData = {};
    /**
     * Recursively retrieves Solidity source code from directory.
     * @param  dirPath Directory to search.
     * @return Mapping of contract fileName to contract source.
     */
    private static async _getContractSourcesAsync(dirPath: string): Promise<ContractSources> {
        let dirContents: string[] = [];
        try {
            dirContents = await fsWrapper.readdirAsync(dirPath);
        } catch (err) {
            throw new Error(`No directory found at ${dirPath}`);
        }
        let sources: ContractSources = {};
        for (const fileName of dirContents) {
            const contentPath = `${dirPath}/${fileName}`;
            const contractName = path.basename(fileName, constants.SOLIDITY_FILE_EXTENSION);
            const absoluteFilePath = path.resolve(contentPath);
            if (path.extname(fileName) === constants.SOLIDITY_FILE_EXTENSION) {
                try {
                    const opts = {
                        encoding: 'utf8',
                    };
                    const source = await fsWrapper.readFileAsync(contentPath, opts);
                    sources[contractName] = {
                        source,
                        absoluteFilePath,
                    };
                    logUtils.log(`Reading ${contractName} source...`);
                } catch (err) {
                    logUtils.log(`Could not find file at ${contentPath}`);
                }
            } else {
                try {
                    const nestedSources = await Compiler._getContractSourcesAsync(contentPath);
                    sources = {
                        ...sources,
                        ...nestedSources,
                    };
                } catch (err) {
                    logUtils.log(`${contentPath} is not a directory or ${constants.SOLIDITY_FILE_EXTENSION} file`);
                }
            }
        }
        return sources;
    }
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
    }
    /**
     * Compiles selected Solidity files found in `contractsDir` and writes JSON artifacts to `artifactsDir`.
     */
    public async compileAsync(): Promise<void> {
        await createDirIfDoesNotExistAsync(this._artifactsDir);
        await createDirIfDoesNotExistAsync(SOLC_BIN_DIR);
        this._contractSources = await Compiler._getContractSourcesAsync(this._contractsDir);
        const contractNames = _.keys(this._contractSources);
        for (const contractName of contractNames) {
            const contractSource = this._contractSources[contractName];
            this._setContractSpecificSourceData(contractSource.source, contractName);
        }
        const contractNamesToCompile = this._specifiedContracts.has(ALL_CONTRACTS_IDENTIFIER)
            ? _.keys(this._contractSources)
            : Array.from(this._specifiedContracts.values());
        for (const contractNameToCompile of contractNamesToCompile) {
            await this._compileContractAsync(contractNameToCompile);
        }
    }
    /**
     * Compiles contract and saves artifact to artifactsDir.
     * @param fileName Name of contract with '.sol' extension.
     */
    private async _compileContractAsync(contractName: string): Promise<void> {
        if (_.isUndefined(this._contractSources)) {
            throw new Error('Contract sources not yet initialized');
        }
        const contractSpecificSourceData = this._contractSourceData[contractName];
        const currentArtifactIfExists = await getContractArtifactIfExistsAsync(this._artifactsDir, contractName);
        const sourceHash = `0x${contractSpecificSourceData.sourceHash.toString('hex')}`;
        const sourceTreeHash = `0x${contractSpecificSourceData.sourceTreeHash.toString('hex')}`;

        let shouldCompile = false;
        if (_.isUndefined(currentArtifactIfExists)) {
            shouldCompile = true;
        } else {
            const currentArtifact = currentArtifactIfExists as ContractArtifact;
            shouldCompile =
                currentArtifact.networks[this._networkId].optimizer_enabled !== this._optimizerEnabled ||
                currentArtifact.networks[this._networkId].source_tree_hash !== sourceTreeHash;
        }
        if (!shouldCompile) {
            return;
        }
        const availableCompilerVersions = _.keys(binPaths);
        const solcVersion = semver.maxSatisfying(
            availableCompilerVersions,
            contractSpecificSourceData.solcVersionRange,
        );
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
        const contractSource = this._contractSources[contractName];
        const source = contractSource.source;
        const absoluteFilePath = contractSource.absoluteFilePath;
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
            solcInstance.compileStandardWrapper(JSON.stringify(standardInput), importPath =>
                findImportIfExist(this._contractSources, importPath),
            ),
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
        const sources = _.keys(compiled.sources);
        const updated_at = Date.now();
        const contractNetworkData: ContractNetworkData = {
            solc_version: solcVersion,
            keccak256: sourceHash,
            source_tree_hash: sourceTreeHash,
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
     * Gets contract dependendencies and keccak256 hash from source.
     * @param source Source code of contract.
     * @return Object with contract dependencies and keccak256 hash of source.
     */
    private _setContractSpecificSourceData(source: string, contractName: string): void {
        if (!_.isUndefined(this._contractSourceData[contractName])) {
            return;
        }
        const sourceHash = ethUtil.sha3(source);
        const solcVersionRange = parseSolidityVersionRange(source);
        const dependencies = parseDependencies(source);
        const sourceTreeHash = this._getSourceTreeHash(sourceHash, dependencies);
        this._contractSourceData[contractName] = {
            dependencies,
            solcVersionRange,
            sourceHash,
            sourceTreeHash,
        };
    }
    /**
     * Gets the source tree hash for a file and its dependencies.
     * @param fileName Name of contract file.
     */
    private _getSourceTreeHash(sourceHash: Buffer, dependencies: string[]): Buffer {
        if (dependencies.length === 0) {
            return sourceHash;
        } else {
            const dependencySourceTreeHashes = _.map(dependencies, dependency => {
                const source = this._contractSources[dependency].source;
                this._setContractSpecificSourceData(source, dependency);
                const sourceData = this._contractSourceData[dependency];
                return this._getSourceTreeHash(sourceData.sourceHash, sourceData.dependencies);
            });
            const sourceTreeHashesBuffer = Buffer.concat([sourceHash, ...dependencySourceTreeHashes]);
            const sourceTreeHash = ethUtil.sha3(sourceTreeHashesBuffer);
            return sourceTreeHash;
        }
    }
}
