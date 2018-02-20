import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';
import * as path from 'path';
import solc = require('solc');
import * as Web3 from 'web3';

import { binPaths } from './solc/bin_paths';
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
    ImportContents,
} from './utils/types';
import { utils } from './utils/utils';

const ALL_CONTRACTS_IDENTIFIER = '*';
const SOLIDITY_VERSION_REGEX = /(?:solidity\s\^?)([0-9]{1,2}[.][0-9]{1,2}[.][0-9]{1,2})/;
const SOLIDITY_FILE_EXTENSION_REGEX = /(.*\.sol)/;
const IMPORT_REGEX = /(import\s)/;
const DEPENDENCY_PATH_REGEX = /"([^"]+)"/;

export class Compiler {
    private _contractsDir: string;
    private _networkId: number;
    private _optimizerEnabled: number;
    private _artifactsDir: string;
    private _contractSourcesIfExists?: ContractSources;
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
                    utils.consoleLog(`Reading ${fileName} source...`);
                } catch (err) {
                    utils.consoleLog(`Could not find file at ${contentPath}`);
                }
            } else {
                try {
                    const nestedSources = await Compiler._getContractSourcesAsync(contentPath);
                    sources = {
                        ...sources,
                        ...nestedSources,
                    };
                } catch (err) {
                    utils.consoleLog(`${contentPath} is not a directory or ${constants.SOLIDITY_FILE_EXTENSION} file`);
                }
            }
        }
        return sources;
    }
    /**
     * Gets contract dependendencies and keccak256 hash from source.
     * @param source Source code of contract.
     * @return Object with contract dependencies and keccak256 hash of source.
     */
    private static _getContractSpecificSourceData(source: string): ContractSpecificSourceData {
        const dependencies: string[] = [];
        const sourceHash = ethUtil.sha3(source);
        const solc_version = Compiler._parseSolidityVersion(source);
        const contractSpecificSourceData: ContractSpecificSourceData = {
            dependencies,
            solc_version,
            sourceHash,
        };
        const lines = source.split('\n');
        _.forEach(lines, line => {
            if (!_.isNull(line.match(IMPORT_REGEX))) {
                const dependencyMatch = line.match(DEPENDENCY_PATH_REGEX);
                if (!_.isNull(dependencyMatch)) {
                    const dependencyPath = dependencyMatch[1];
                    const fileName = path.basename(dependencyPath);
                    contractSpecificSourceData.dependencies.push(fileName);
                }
            }
        });
        return contractSpecificSourceData;
    }
    /**
     * Searches Solidity source code for compiler version.
     * @param  source Source code of contract.
     * @return Solc compiler version.
     */
    private static _parseSolidityVersion(source: string): string {
        const solcVersionMatch = source.match(SOLIDITY_VERSION_REGEX);
        if (_.isNull(solcVersionMatch)) {
            throw new Error('Could not find Solidity version in source');
        }
        const solcVersion = solcVersionMatch[1];
        return solcVersion;
    }
    /**
     * Normalizes the path found in the error message.
     * Example: converts 'base/Token.sol:6:46: Warning: Unused local variable'
     *          to 'Token.sol:6:46: Warning: Unused local variable'
     * This is used to prevent logging the same error multiple times.
     * @param  errMsg An error message from the compiled output.
     * @return The error message with directories truncated from the contract path.
     */
    private static _getNormalizedErrMsg(errMsg: string): string {
        const errPathMatch = errMsg.match(SOLIDITY_FILE_EXTENSION_REGEX);
        if (_.isNull(errPathMatch)) {
            throw new Error('Could not find a path in error message');
        }
        const errPath = errPathMatch[0];
        const baseContract = path.basename(errPath);
        const normalizedErrMsg = errMsg.replace(errPath, baseContract);
        return normalizedErrMsg;
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
     * Compiles all Solidity files found in contractsDir and writes JSON artifacts to artifactsDir.
     */
    public async compileAllAsync(): Promise<void> {
        await this._createArtifactsDirIfDoesNotExistAsync();
        this._contractSourcesIfExists = await Compiler._getContractSourcesAsync(this._contractsDir);
        _.forIn(this._contractSourcesIfExists, (source, fileName) => {
            this._contractSourceData[fileName] = Compiler._getContractSpecificSourceData(source);
        });
        const fileNames = this._specifiedContracts.has(ALL_CONTRACTS_IDENTIFIER)
            ? _.keys(this._contractSourcesIfExists)
            : Array.from(this._specifiedContracts.values());
        _.forEach(fileNames, fileName => {
            this._setSourceTreeHash(fileName);
        });
        await Promise.all(_.map(fileNames, async fileName => this._compileContractAsync(fileName)));
        this._solcErrors.forEach(errMsg => {
            utils.consoleLog(errMsg);
        });
    }
    /**
     * Compiles contract and saves artifact to artifactsDir.
     * @param fileName Name of contract with '.sol' extension.
     */
    private async _compileContractAsync(fileName: string): Promise<void> {
        if (_.isUndefined(this._contractSourcesIfExists)) {
            throw new Error('Contract sources not yet initialized');
        }
        const contractSpecificSourceData = this._contractSourceData[fileName];
        const currentArtifact = (await this._getContractArtifactOrReturnAsync(fileName)) as ContractArtifact;
        const sourceHash = `0x${contractSpecificSourceData.sourceHash.toString('hex')}`;
        const sourceTreeHash = `0x${contractSpecificSourceData.sourceTreeHash.toString('hex')}`;

        const shouldCompile =
            _.isUndefined(currentArtifact) ||
            currentArtifact.networks[this._networkId].optimizer_enabled !== this._optimizerEnabled ||
            currentArtifact.networks[this._networkId].source_tree_hash !== sourceTreeHash;
        if (!shouldCompile) {
            return;
        }

        const fullSolcVersion = binPaths[contractSpecificSourceData.solc_version];
        const solcBinPath = `./solc/solc_bin/${fullSolcVersion}`;
        const solcBin = require(solcBinPath);
        const solcInstance = solc.setupMethods(solcBin);

        utils.consoleLog(`Compiling ${fileName}...`);
        const source = this._contractSourcesIfExists[fileName];
        const input = {
            [fileName]: source,
        };
        const sourcesToCompile = {
            sources: input,
        };
        const compiled = solcInstance.compile(
            sourcesToCompile,
            this._optimizerEnabled,
            this._findImportsIfSourcesExist.bind(this),
        );

        if (!_.isUndefined(compiled.errors)) {
            _.forEach(compiled.errors, errMsg => {
                const normalizedErrMsg = Compiler._getNormalizedErrMsg(errMsg);
                this._solcErrors.add(normalizedErrMsg);
            });
        }

        const contractName = path.basename(fileName, constants.SOLIDITY_FILE_EXTENSION);
        const contractIdentifier = `${fileName}:${contractName}`;
        const abi: Web3.ContractAbi = JSON.parse(compiled.contracts[contractIdentifier].interface);
        const unlinked_binary = `0x${compiled.contracts[contractIdentifier].bytecode}`;
        const updated_at = Date.now();
        const contractNetworkData: ContractNetworkData = {
            solc_version: contractSpecificSourceData.solc_version,
            keccak256: sourceHash,
            source_tree_hash: sourceTreeHash,
            optimizer_enabled: this._optimizerEnabled,
            abi,
            unlinked_binary,
            updated_at,
        };

        let newArtifact: ContractArtifact;
        if (!_.isUndefined(currentArtifact)) {
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
        utils.consoleLog(`${fileName} artifact saved!`);
    }
    /**
     * Sets the source tree hash for a file and its dependencies.
     * @param fileName Name of contract file.
     */
    private _setSourceTreeHash(fileName: string) {
        const contractSpecificSourceData = this._contractSourceData[fileName];
        if (_.isUndefined(contractSpecificSourceData)) {
            throw new Error(`Contract data for ${fileName} not yet set`);
        }
        if (_.isUndefined(contractSpecificSourceData.sourceTreeHash)) {
            const dependencies = contractSpecificSourceData.dependencies;
            if (dependencies.length === 0) {
                contractSpecificSourceData.sourceTreeHash = contractSpecificSourceData.sourceHash;
            } else {
                _.forEach(dependencies, dependency => {
                    this._setSourceTreeHash(dependency);
                });
                const dependencySourceTreeHashes = _.map(
                    dependencies,
                    dependency => this._contractSourceData[dependency].sourceTreeHash,
                );
                const sourceTreeHashesBuffer = Buffer.concat([
                    contractSpecificSourceData.sourceHash,
                    ...dependencySourceTreeHashes,
                ]);
                contractSpecificSourceData.sourceTreeHash = ethUtil.sha3(sourceTreeHashesBuffer);
            }
        }
    }
    /**
     * Callback to resolve dependencies with `solc.compile`.
     * Throws error if contractSources not yet initialized.
     * @param  importPath Path to an imported dependency.
     * @return Import contents object containing source code of dependency.
     */
    private _findImportsIfSourcesExist(importPath: string): ImportContents {
        if (_.isUndefined(this._contractSourcesIfExists)) {
            throw new Error('Contract sources not yet initialized');
        }
        const fileName = path.basename(importPath);
        const source = this._contractSourcesIfExists[fileName];
        const importContents: ImportContents = {
            contents: source,
        };
        return importContents;
    }
    /**
     * Creates the artifacts directory if it does not already exist.
     */
    private async _createArtifactsDirIfDoesNotExistAsync(): Promise<void> {
        if (!fsWrapper.doesPathExistSync(this._artifactsDir)) {
            utils.consoleLog('Creating artifacts directory...');
            await fsWrapper.mkdirAsync(this._artifactsDir);
        }
    }
    /**
     * Gets contract data on network or returns if an artifact does not exist.
     * @param fileName Name of contract file.
     * @return Contract data on network or undefined.
     */
    private async _getContractArtifactOrReturnAsync(fileName: string): Promise<ContractArtifact | void> {
        let contractArtifact;
        const contractName = path.basename(fileName, constants.SOLIDITY_FILE_EXTENSION);
        const currentArtifactPath = `${this._artifactsDir}/${contractName}.json`;
        try {
            const opts = {
                encoding: 'utf8',
            };
            const contractArtifactString = await fsWrapper.readFileAsync(currentArtifactPath, opts);
            contractArtifact = JSON.parse(contractArtifactString);
            return contractArtifact;
        } catch (err) {
            utils.consoleLog(`Artifact for ${fileName} does not exist`);
            return contractArtifact;
        }
    }
}
