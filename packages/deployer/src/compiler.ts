import { AbiType, ContractAbi, MethodAbi } from '@0xproject/types';
import { logUtils, promisify } from '@0xproject/utils';
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
    constructContractId,
    constructUniqueSourceFileId,
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
    ContractDirectory,
    ContractIdToSourceFileId,
    ContractNetworkData,
    ContractNetworks,
    ContractSourceDataByFileId,
    ContractSources,
    ContractSpecificSourceData,
    FunctionNameToSeenCount,
} from './utils/types';
import { utils } from './utils/utils';

const ALL_CONTRACTS_IDENTIFIER = '*';
const SOLC_BIN_DIR = path.join(__dirname, '..', '..', 'solc_bin');

/**
 * The Compiler facilitates compiling Solidity smart contracts and saves the results
 * to artifact files.
 */
export class Compiler {
    private _contractDirs: Set<ContractDirectory>;
    private _networkId: number;
    private _optimizerEnabled: boolean;
    private _artifactsDir: string;
    // This get's set in the beggining of `compileAsync` function. It's not called from a constructor, but it's the only public method of that class and could as well be.
    private _contractSources!: ContractSources;
    private _specifiedContracts: Set<string> = new Set();
    private _contractSourceDataByFileId: ContractSourceDataByFileId = {};

    /**
     * Recursively retrieves Solidity source code from directory.
     * @param  dirPath Directory to search.
     * @param  contractBaseDir Base contracts directory of search tree.
     * @return Mapping of sourceFilePath to the contract source.
     */
    private static async _getContractSourcesAsync(dirPath: string, contractBaseDir: string): Promise<ContractSources> {
        let dirContents: string[] = [];
        try {
            dirContents = await fsWrapper.readdirAsync(dirPath);
        } catch (err) {
            throw new Error(`No directory found at ${dirPath}`);
        }
        let sources: ContractSources = {};
        for (const fileName of dirContents) {
            const contentPath = `${dirPath}/${fileName}`;
            if (path.extname(fileName) === constants.SOLIDITY_FILE_EXTENSION) {
                try {
                    const opts = {
                        encoding: 'utf8',
                    };
                    const source = await fsWrapper.readFileAsync(contentPath, opts);
                    if (!_.startsWith(contentPath, contractBaseDir)) {
                        throw new Error(`Expected content path '${contentPath}' to begin with '${contractBaseDir}'`);
                    }
                    const sourceFilePath = contentPath.slice(contractBaseDir.length);
                    sources[sourceFilePath] = source;
                    logUtils.log(`Reading ${sourceFilePath} source...`);
                } catch (err) {
                    logUtils.log(`Could not find file at ${contentPath}`);
                }
            } else {
                try {
                    const nestedSources = await Compiler._getContractSourcesAsync(contentPath, contractBaseDir);
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
        this._contractDirs = opts.contractDirs;
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
        this._contractSources = {};
        const contractIdToSourceFileId: ContractIdToSourceFileId = {};
        const contractDirs = Array.from(this._contractDirs.values());
        for (const contractDir of contractDirs) {
            const sources = await Compiler._getContractSourcesAsync(contractDir.path, contractDir.path);
            _.forIn(sources, (source, sourceFilePath) => {
                const sourceFileId = constructUniqueSourceFileId(contractDir.namespace, sourceFilePath);
                // Record the file's source and data
                if (!_.isUndefined(this._contractSources[sourceFileId])) {
                    throw new Error(`Found duplicate source files with ID '${sourceFileId}'`);
                }
                this._contractSources[sourceFileId] = source;
                // Create a mapping between the contract id and its source file id
                const contractId = constructContractId(contractDir.namespace, sourceFilePath);
                if (!_.isUndefined(contractIdToSourceFileId[contractId])) {
                    throw new Error(`Found duplicate contract with ID '${contractId}'`);
                }
                contractIdToSourceFileId[contractId] = sourceFileId;
            });
        }
        _.forIn(this._contractSources, this._setContractSpecificSourceData.bind(this));
        const specifiedContractIds = this._specifiedContracts.has(ALL_CONTRACTS_IDENTIFIER)
            ? _.keys(contractIdToSourceFileId)
            : Array.from(this._specifiedContracts.values());
        await Promise.all(
            _.map(specifiedContractIds, async contractId =>
                this._compileContractAsync(contractIdToSourceFileId[contractId]),
            ),
        );
    }
    /**
     * Compiles contract and saves artifact to artifactsDir.
     * @param sourceFileId Unique ID of the source file.
     */
    private async _compileContractAsync(sourceFileId: string): Promise<void> {
        if (_.isUndefined(this._contractSources)) {
            throw new Error('Contract sources not yet initialized');
        }
        if (_.isUndefined(this._contractSourceDataByFileId[sourceFileId])) {
            throw new Error(`Contract source for ${sourceFileId} not yet initialized`);
        }
        const contractSpecificSourceData = this._contractSourceDataByFileId[sourceFileId];
        const currentArtifactIfExists = await getContractArtifactIfExistsAsync(this._artifactsDir, sourceFileId);
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

        logUtils.log(`Compiling ${sourceFileId} with Solidity v${solcVersion}...`);
        const source = this._contractSources[sourceFileId];
        const input = {
            [sourceFileId]: source,
        };
        const sourcesToCompile = {
            sources: input,
        };

        const compiled = solcInstance.compile(sourcesToCompile, Number(this._optimizerEnabled), importPath =>
            findImportIfExist(this._contractSources, sourceFileId, importPath),
        );

        if (!_.isUndefined(compiled.errors)) {
            const SOLIDITY_WARNING_PREFIX = 'Warning';
            const isError = (errorOrWarning: string) => !errorOrWarning.includes(SOLIDITY_WARNING_PREFIX);
            const isWarning = (errorOrWarning: string) => errorOrWarning.includes(SOLIDITY_WARNING_PREFIX);
            const errors = _.filter(compiled.errors, isError);
            const warnings = _.filter(compiled.errors, isWarning);
            if (!_.isEmpty(errors)) {
                errors.forEach(errMsg => {
                    const normalizedErrMsg = getNormalizedErrMsg(errMsg);
                    logUtils.log(normalizedErrMsg);
                });
                process.exit(1);
            } else {
                warnings.forEach(errMsg => {
                    const normalizedErrMsg = getNormalizedErrMsg(errMsg);
                    logUtils.log(normalizedErrMsg);
                });
            }
        }
        const contractName = path.basename(sourceFileId, constants.SOLIDITY_FILE_EXTENSION);
        const contractIdentifier = `${sourceFileId}:${contractName}`;
        if (_.isUndefined(compiled.contracts[contractIdentifier])) {
            throw new Error(
                `Contract ${contractName} not found in ${sourceFileId}. Please make sure your contract has the same name as it's file name`,
            );
        }
        const abi: ContractAbi = JSON.parse(compiled.contracts[contractIdentifier].interface);
        const bytecode = `0x${compiled.contracts[contractIdentifier].bytecode}`;
        const runtimeBytecode = `0x${compiled.contracts[contractIdentifier].runtimeBytecode}`;
        const sourceMap = compiled.contracts[contractIdentifier].srcmap;
        const sourceMapRuntime = compiled.contracts[contractIdentifier].srcmapRuntime;
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
        logUtils.log(`${sourceFileId} artifact saved!`);
    }
    /**
     * Gets contract dependendencies and keccak256 hash from source.
     * @param source Source code of contract.
     * @param fileId FileId of the contract source file.
     * @return Object with contract dependencies and keccak256 hash of source.
     */
    private _setContractSpecificSourceData(source: string, fileId: string): void {
        if (!_.isUndefined(this._contractSourceDataByFileId[fileId])) {
            return;
        }
        const sourceHash = ethUtil.sha3(source);
        const solcVersionRange = parseSolidityVersionRange(source);
        const dependencies = parseDependencies(source, fileId);
        const sourceTreeHash = this._getSourceTreeHash(fileId, sourceHash, dependencies);
        this._contractSourceDataByFileId[fileId] = {
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
    private _getSourceTreeHash(fileName: string, sourceHash: Buffer, dependencies: string[]): Buffer {
        if (dependencies.length === 0) {
            return sourceHash;
        } else {
            const dependencySourceTreeHashes = _.map(dependencies, dependency => {
                const source = this._contractSources[dependency];
                this._setContractSpecificSourceData(source, dependency);
                const sourceData = this._contractSourceDataByFileId[dependency];
                return this._getSourceTreeHash(dependency, sourceData.sourceHash, sourceData.dependencies);
            });
            const sourceTreeHashesBuffer = Buffer.concat([sourceHash, ...dependencySourceTreeHashes]);
            const sourceTreeHash = ethUtil.sha3(sourceTreeHashesBuffer);
            return sourceTreeHash;
        }
    }
}
