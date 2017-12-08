import {promisify} from '@0xproject/utils';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';
import * as path from 'path';
import solc = require('solc');
import * as Web3 from 'web3';

import {binPaths} from './../solc/bin_paths';
import {fsWrapper} from './utils/fs_wrapper';
import {
    CompilerOptions,
    ContractArtifact,
    ContractData,
    ContractNetworks,
    ContractSources,
    ImportContents,
    SolcErrors,
} from './utils/types';
import {utils} from './utils/utils';

const SOLIDITY_FILE_EXTENSION = '.sol';

export class Compiler {
    private contractsDir: string;
    private networkId: number;
    private optimizerEnabled: number;
    private artifactsDir: string;
    private contractSourcesIfExists?: ContractSources;
    private solcErrors: Set<string>;
    /**
     * Recursively retrieves Solidity source code from directory.
     * @param  dirPath Directory to search.
     * @return Mapping of contract name to contract source.
     */
    private static async getContractSourcesAsync(dirPath: string): Promise<ContractSources> {
        let dirContents: string[] = [];
        try {
            dirContents = await fsWrapper.readdirAsync(dirPath);
        } catch (err) {
            throw new Error(`No directory found at ${dirPath}`);
        }
        let sources: ContractSources = {};
        for (const name of dirContents) {
            const contentPath = `${dirPath}/${name}`;
            if (path.extname(name) === SOLIDITY_FILE_EXTENSION) {
                try {
                    const opts = {
                        encoding: 'utf8',
                    };
                    sources[name] = await fsWrapper.readFileAsync(contentPath, opts);
                    utils.consoleLog(`Reading ${name} source...`);
                } catch (err) {
                    utils.consoleLog(`Could not find file at ${contentPath}`);
                }
            } else {
                try {
                    const nestedSources = await Compiler.getContractSourcesAsync(contentPath);
                    sources = {
                        ...sources,
                        ...nestedSources,
                    };
                } catch (err) {
                    utils.consoleLog(`${contentPath} is not a directory or ${SOLIDITY_FILE_EXTENSION} file`);
                }
            }
        }
        return sources;
    }
    /**
     * Searches Solidity source code for compiler version.
     * @param  source Source code of contract.
     * @return Solc compiler version.
     */
    private static parseSolidityVersion(source: string): string {
        const solcVersionMatch = source.match(/(?:solidity\s\^?)([0-9]{1,2}[.][0-9]{1,2}[.][0-9]{1,2})/);
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
    private static getNormalizedErrMsg(errMsg: string): string {
        const errPathMatch = errMsg.match(/(.*\.sol)/);
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
        this.contractsDir = opts.contractsDir;
        this.networkId = opts.networkId;
        this.optimizerEnabled = opts.optimizerEnabled;
        this.artifactsDir = opts.artifactsDir;
        this.solcErrors = new Set();
    }
    /**
     * Compiles all Solidity files found in contractsDir and writes JSON artifacts to artifactsDir.
     */
    public async compileAllAsync(): Promise<void> {
        await this.createArtifactsDirIfDoesNotExistAsync();
        this.contractSourcesIfExists = await Compiler.getContractSourcesAsync(this.contractsDir);

        const contractBaseNames = _.keys(this.contractSourcesIfExists);
        const compiledContractPromises = _.map(contractBaseNames, async (contractBaseName: string): Promise<void> => {
            return this.compileContractAsync(contractBaseName);
        });
        await Promise.all(compiledContractPromises);

        this.solcErrors.forEach(errMsg => {
            utils.consoleLog(errMsg);
        });
    }
    /**
     * Compiles contract and saves artifact to artifactsDir.
     * @param contractBaseName Name of contract with '.sol' extension.
     */
    private async compileContractAsync(contractBaseName: string): Promise<void> {
        if (_.isUndefined(this.contractSourcesIfExists)) {
            throw new Error('Contract sources not yet initialized');
        }

        const source = this.contractSourcesIfExists[contractBaseName];
        const contractName = path.basename(contractBaseName, SOLIDITY_FILE_EXTENSION);
        const currentArtifactPath = `${this.artifactsDir}/${contractName}.json`;
        const sourceHash = `0x${ethUtil.sha3(source).toString('hex')}`;

        let currentArtifactString: string;
        let currentArtifact: ContractArtifact;
        let oldNetworks: ContractNetworks;
        let shouldCompile: boolean;
        try {
            const opts = {
                encoding: 'utf8',
            };
            currentArtifactString = await fsWrapper.readFileAsync(currentArtifactPath, opts);
            currentArtifact = JSON.parse(currentArtifactString);
            oldNetworks = currentArtifact.networks;
            const oldNetwork: ContractData = oldNetworks[this.networkId];
            shouldCompile = _.isUndefined(oldNetwork) ||
                            oldNetwork.keccak256 !== sourceHash ||
                            oldNetwork.optimizer_enabled !== this.optimizerEnabled;
        } catch (err) {
            shouldCompile = true;
        }

        if (!shouldCompile) {
            return;
        }

        const input = {
            [contractBaseName]: source,
        };
        const solcVersion = Compiler.parseSolidityVersion(source);
        const fullSolcVersion = binPaths[solcVersion];
        const solcBinPath = `./../solc/solc_bin/${fullSolcVersion}`;
        const solcBin = require(solcBinPath);
        const solcInstance = solc.setupMethods(solcBin);

        utils.consoleLog(`Compiling ${contractBaseName}...`);
        const sourcesToCompile = {
            sources: input,
        };
        const compiled = solcInstance.compile(sourcesToCompile,
                                              this.optimizerEnabled,
                                              this.findImportsIfSourcesExist.bind(this));

        if (!_.isUndefined(compiled.errors)) {
            _.each(compiled.errors, errMsg => {
                const normalizedErrMsg = Compiler.getNormalizedErrMsg(errMsg);
                this.solcErrors.add(normalizedErrMsg);
            });
        }

        const contractIdentifier = `${contractBaseName}:${contractName}`;
        const abi: Web3.ContractAbi = JSON.parse(compiled.contracts[contractIdentifier].interface);
        const unlinked_binary = `0x${compiled.contracts[contractIdentifier].bytecode}`;
        const updated_at = Date.now();
        const contractData: ContractData = {
            solc_version: solcVersion,
            keccak256: sourceHash,
            optimizer_enabled: this.optimizerEnabled,
            abi,
            unlinked_binary,
            updated_at,
        };

        let newArtifact: ContractArtifact;
        if (!_.isUndefined(currentArtifactString)) {
            newArtifact = {
                ...currentArtifact,
                networks: {
                    ...oldNetworks,
                    [this.networkId]: contractData,
                },
            };
        } else {
            newArtifact = {
                contract_name: contractName,
                networks: {
                    [this.networkId]: contractData,
                },
            };
        }

        const artifactString = utils.stringifyWithFormatting(newArtifact);
        await fsWrapper.writeFileAsync(currentArtifactPath, artifactString);
        utils.consoleLog(`${contractBaseName} artifact saved!`);
    }
    /**
     * Callback to resolve dependencies with `solc.compile`.
     * Throws error if contractSources not yet initialized.
     * @param  importPath Path to an imported dependency.
     * @return Import contents object containing source code of dependency.
     */
    private findImportsIfSourcesExist(importPath: string): ImportContents {
        if (_.isUndefined(this.contractSourcesIfExists)) {
            throw new Error('Contract sources not yet initialized');
        }
        const contractBaseName = path.basename(importPath);
        const source = this.contractSourcesIfExists[contractBaseName];
        const importContents: ImportContents = {
            contents: source,
        };
        return importContents;
    }
    /**
     * Creates the artifacts directory if it does not already exist.
     */
    private async createArtifactsDirIfDoesNotExistAsync(): Promise<void> {
        if (!fsWrapper.doesPathExistSync(this.artifactsDir)) {
            utils.consoleLog('Creating artifacts directory...');
            await fsWrapper.mkdirAsync(this.artifactsDir);
        }
    }
}
