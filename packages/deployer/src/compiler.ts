import { logUtils, promisify } from '@0xproject/utils';
import * as ethUtil from 'ethereumjs-util';
import * as fs from 'fs';
import 'isomorphic-fetch';
import * as _ from 'lodash';
import * as path from 'path';
import * as requireFromString from 'require-from-string';
import * as semver from 'semver';
import solc = require('solc');
import * as Web3 from 'web3';

import { binPaths } from './solc/bin_paths';
import {
    createArtifactsDirIfDoesNotExistAsync,
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

export class Compiler {
    private _contractsDir: string;
    private _networkId: number;
    private _optimizerEnabled: boolean;
    private _artifactsDir: string;
    // This get's set in the beggining of `compileAsync` function. It's not called from a constructor, but it's the only public method of that class and could as well be.
    private _contractSources!: ContractSources;
    private _solcErrors: Set<string> = new Set();
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
            if (path.extname(fileName) === constants.SOLIDITY_FILE_EXTENSION) {
                try {
                    const opts = {
                        encoding: 'utf8',
                    };
                    const source = await fsWrapper.readFileAsync(contentPath, opts);
                    sources[fileName] = source;
                    logUtils.log(`Reading ${fileName} source...`);
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
     * Compiles selected Solidity files and writes JSON artifacts to artifactsDir.
     */
    public async compileAsync(): Promise<void> {
        await createArtifactsDirIfDoesNotExistAsync(this._artifactsDir);
        this._contractSources = await Compiler._getContractSourcesAsync(this._contractsDir);
        _.forIn(this._contractSources, this._setContractSpecificSourceData.bind(this));
        const fileNames = this._specifiedContracts.has(ALL_CONTRACTS_IDENTIFIER)
            ? _.keys(this._contractSources)
            : Array.from(this._specifiedContracts.values());
        for (const fileName of fileNames) {
            await this._compileContractAsync(fileName);
        }
        this._solcErrors.forEach(errMsg => {
            logUtils.log(errMsg);
        });
    }
    /**
     * Compiles contract and saves artifact to artifactsDir.
     * @param fileName Name of contract with '.sol' extension.
     */
    private async _compileContractAsync(fileName: string): Promise<void> {
        if (_.isUndefined(this._contractSources)) {
            throw new Error('Contract sources not yet initialized');
        }
        const contractSpecificSourceData = this._contractSourceData[fileName];
        const currentArtifactIfExists = await getContractArtifactIfExistsAsync(this._artifactsDir, fileName);
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
        const compilerBinFilename = path.join(__dirname, '../../solc_bin', fullSolcVersion);
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

        logUtils.log(`Compiling ${fileName} with Solidity v${solcVersion}...`);
        const source = this._contractSources[fileName];
        const input = {
            [fileName]: source,
        };
        const sourcesToCompile = {
            sources: input,
        };
        const compiled = solcInstance.compile(sourcesToCompile, Number(this._optimizerEnabled), importPath =>
            findImportIfExist(this._contractSources, importPath),
        );

        if (!_.isUndefined(compiled.errors)) {
            _.forEach(compiled.errors, errMsg => {
                const normalizedErrMsg = getNormalizedErrMsg(errMsg);
                this._solcErrors.add(normalizedErrMsg);
            });
        }
        const contractName = path.basename(fileName, constants.SOLIDITY_FILE_EXTENSION);
        const contractIdentifier = `${fileName}:${contractName}`;
        if (_.isUndefined(compiled.contracts[contractIdentifier])) {
            throw new Error(
                `Contract ${contractName} not found in ${fileName}. Please make sure your contract has the same name as it's file name`,
            );
        }
        const abi: Web3.ContractAbi = JSON.parse(compiled.contracts[contractIdentifier].interface);
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
        logUtils.log(`${fileName} artifact saved!`);
    }
    /**
     * Gets contract dependendencies and keccak256 hash from source.
     * @param source Source code of contract.
     * @return Object with contract dependencies and keccak256 hash of source.
     */
    private _setContractSpecificSourceData(source: string, fileName: string): void {
        if (!_.isUndefined(this._contractSourceData[fileName])) {
            return;
        }
        const sourceHash = ethUtil.sha3(source);
        const solcVersionRange = parseSolidityVersionRange(source);
        const dependencies = parseDependencies(source);
        const sourceTreeHash = this._getSourceTreeHash(fileName, sourceHash, dependencies);
        this._contractSourceData[fileName] = {
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
                const sourceData = this._contractSourceData[dependency];
                return this._getSourceTreeHash(dependency, sourceData.sourceHash, sourceData.dependencies);
            });
            const sourceTreeHashesBuffer = Buffer.concat([sourceHash, ...dependencySourceTreeHashes]);
            const sourceTreeHash = ethUtil.sha3(sourceTreeHashesBuffer);
            return sourceTreeHash;
        }
    }
}
