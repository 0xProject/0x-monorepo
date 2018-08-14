import { assert } from '@0xproject/assert';
import { NameResolver, Resolver } from '@0xproject/sol-resolver';
import { fetchAsync, logUtils } from '@0xproject/utils';
import chalk from 'chalk';
import { ChildProcess, spawn } from 'child_process';
import * as ethUtil from 'ethereumjs-util';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import * as semver from 'semver';
import solc = require('solc');

import { compilerOptionsSchema } from './schemas/compiler_options_schema';
import { binPaths } from './solc/bin_paths';
import {
    constructResolver,
    createDirIfDoesNotExistAsync,
    getContractArtifactIfExistsAsync,
    getNormalizedErrMsg,
    parseDependencies,
    parseSolidityVersionRange,
} from './utils/compiler';
import { constants } from './utils/constants';
import { CompilerOptions, ContractArtifact, ContractVersionData } from './utils/types';
import { utils } from './utils/utils';

type TYPE_ALL_FILES_IDENTIFIER = '*';
const ALL_CONTRACTS_IDENTIFIER = '*';
const ALL_FILES_IDENTIFIER = '*';
const SOLC_BIN_DIR = path.join(__dirname, '..', '..', 'solc_bin');
const DEFAULT_CONTRACTS_DIR = path.resolve('contracts');
const DEFAULT_ARTIFACTS_DIR = path.resolve('artifacts');
const DEFAULT_MAX_PROCESSES = 7;
// Solc compiler settings cannot be configured from the commandline.
// If you need this configured, please create a `compiler.json` config file
// with your desired configurations.
const DEFAULT_COMPILER_SETTINGS: solc.CompilerSettings = {
    optimizer: {
        enabled: false,
    },
    outputSelection: {
        [ALL_FILES_IDENTIFIER]: {
            [ALL_CONTRACTS_IDENTIFIER]: ['abi', 'evm.bytecode.object'],
        },
    },
};
const CONFIG_FILE = 'compiler.json';

/**
 * The Compiler facilitates compiling Solidity smart contracts and saves the results
 * to artifact files.
 */
export class Compiler {
    private readonly _resolver: Resolver;
    private readonly _nameResolver: NameResolver;
    private readonly _contractsDir: string;
    private readonly _compilerSettings: solc.CompilerSettings;
    private readonly _artifactsDir: string;
    private readonly _maxProcesses: number;
    private readonly _solcVersionIfExists: string | undefined;
    private readonly _specifiedContracts: string[] | TYPE_ALL_FILES_IDENTIFIER;
    /**
     * Instantiates a new instance of the Compiler class.
     * @return An instance of the Compiler class.
     */
    constructor(opts?: CompilerOptions) {
        assert.doesConformToSchema('opts', opts, compilerOptionsSchema);
        // TODO: Look for config file in parent directories if not found in current directory
        const config: CompilerOptions = fs.existsSync(CONFIG_FILE)
            ? JSON.parse(fs.readFileSync(CONFIG_FILE).toString())
            : {};
        const passedOpts = opts || {};
        assert.doesConformToSchema('compiler.json', config, compilerOptionsSchema);
        this._contractsDir = passedOpts.contractsDir || config.contractsDir || DEFAULT_CONTRACTS_DIR;
        this._solcVersionIfExists = passedOpts.solcVersion || config.solcVersion;
        this._compilerSettings = passedOpts.compilerSettings || config.compilerSettings || DEFAULT_COMPILER_SETTINGS;
        this._artifactsDir = passedOpts.artifactsDir || config.artifactsDir || DEFAULT_ARTIFACTS_DIR;
        this._specifiedContracts = passedOpts.contracts || config.contracts || ALL_CONTRACTS_IDENTIFIER;
        this._maxProcesses = passedOpts.maxProcesses || config.maxProcesses || DEFAULT_MAX_PROCESSES;
        this._nameResolver = new NameResolver(path.resolve(this._contractsDir));
        this._resolver = constructResolver(this._contractsDir);
    }
    /**
     * Compiles selected Solidity files found in `contractsDir` and writes JSON artifacts to `artifactsDir`.
     */
    public async compileAsync(): Promise<void> {
        await createDirIfDoesNotExistAsync(this._artifactsDir);
        await createDirIfDoesNotExistAsync(SOLC_BIN_DIR);
        let contractNamesToCompile: string[] = [];
        if (this._specifiedContracts === ALL_CONTRACTS_IDENTIFIER) {
            const allContracts = this._nameResolver.getAll();
            contractNamesToCompile = _.map(allContracts, contractSource =>
                path.basename(contractSource.path, constants.SOLIDITY_FILE_EXTENSION),
            );
        } else {
            contractNamesToCompile = this._specifiedContracts;
        }

        // divide up contractNamesToCompile into `this._maxProcesses` different
        // queues, implemented as promise chains, then wait on all the chains.

        const queues: Array<Promise<void>> = [];
        const queueSize = Math.ceil(contractNamesToCompile.length / this._maxProcesses);

        for (let i = 0; i < this._maxProcesses; i++) {
            // populate this queue with its slice of the (contractNamesToCompile) pie
            queues[i] = this._reduceContractsToPromiseChainAsync(
                contractNamesToCompile.slice(i * queueSize, (i + 1) * queueSize),
            );
        }
        await Promise.all(queues);
    }
    /**
     * Reduces an array of contract names to a chain of promises to compile
     * those contracts.  Compilation occurrs asynchronously out of process.
     */
    private async _reduceContractsToPromiseChainAsync(
        [firstContract, ...restOfContracts]: string[],
        chain?: Promise<void>,
    ): Promise<void> {
        if (_.isUndefined(firstContract)) {
            return Promise.resolve();
        }
        if (!chain) {
            return this._reduceContractsToPromiseChainAsync([firstContract, ...restOfContracts], Promise.resolve());
        }
        return chain
            .then(async () => {
                return this._compileContractAsync(firstContract);
            })
            .then(async () => {
                return this._reduceContractsToPromiseChainAsync(restOfContracts, chain);
            });
    }
    /**
     * Compiles contract and saves artifact to artifactsDir.
     * @param fileName Name of contract with '.sol' extension.
     */
    private async _compileContractAsync(contractName: string): Promise<void> {
        const contractSource = this._resolver.resolve(contractName);
        const absoluteContractPath = path.join(this._contractsDir, contractSource.path);
        const currentArtifactIfExists = await getContractArtifactIfExistsAsync(this._artifactsDir, contractName);
        const sourceTreeHashHex = `0x${this._getSourceTreeHash(absoluteContractPath).toString('hex')}`;
        const { shouldCompile, reason } = (() => {
            let reasonNotToCompile: string;
            if (_.isUndefined(currentArtifactIfExists)) {
                return { shouldCompile: true, reason: 'artifact does not exist' };
            } else {
                const currentArtifact = currentArtifactIfExists as ContractArtifact;

                const isUserOnLatestVersion = currentArtifact.schemaVersion === constants.LATEST_ARTIFACT_VERSION;
                if (isUserOnLatestVersion) {
                    reasonNotToCompile = 'user on latest version';
                } else {
                    return { shouldCompile: true, reason: 'user not on latest version' };
                }

                const didCompilerSettingsChange = !_.isEqual(currentArtifact.compiler.settings, this._compilerSettings);
                if (didCompilerSettingsChange) {
                    return { shouldCompile: true, reason: 'compiler settings have changed' };
                } else {
                    reasonNotToCompile = 'compiler settings have not changed';
                }

                const didSourceChange = currentArtifact.sourceTreeHashHex !== sourceTreeHashHex;
                if (didSourceChange) {
                    return { shouldCompile: true, reason: 'source has changed' };
                } else {
                    reasonNotToCompile = 'source has not changed';
                }

                return { shouldCompile: false, reason: reasonNotToCompile };
            }
        })();
        if (!shouldCompile) {
            logUtils.log(`Skipping compilation of ${contractName} because ${reason}`);
            return;
        }
        let solcVersion = this._solcVersionIfExists;
        if (_.isUndefined(solcVersion)) {
            const solcVersionRange = parseSolidityVersionRange(contractSource.source);
            const availableCompilerVersions = _.keys(binPaths);
            solcVersion = semver.maxSatisfying(availableCompilerVersions, solcVersionRange);
        }
        const fullSolcVersion = binPaths[solcVersion];

        const compilerBinFilename = path.join(SOLC_BIN_DIR, fullSolcVersion);
        let solcjs: string;
        const isCompilerAvailableLocally = fs.existsSync(compilerBinFilename);
        if (isCompilerAvailableLocally) {
            solcjs = fs.readFileSync(compilerBinFilename).toString();
        } else {
            logUtils.log(`Downloading ${fullSolcVersion}...`);
            const url = `${constants.BASE_COMPILER_URL}${fullSolcVersion}`;
            const response = await fetchAsync(url);
            const SUCCESS_STATUS = 200;
            if (response.status !== SUCCESS_STATUS) {
                throw new Error(`Failed to load ${fullSolcVersion}`);
            }
            solcjs = await response.text();
            fs.writeFileSync(compilerBinFilename, solcjs);
        }

        const standardInput: solc.StandardInput = {
            language: 'Solidity',
            sources: {
                [contractSource.path]: {
                    content: contractSource.source,
                },
            },
            settings: this._compilerSettings,
        };

        const solcProcess: ChildProcess = spawn('resolver-solc', [
            '--fullSolcVersion',
            fullSolcVersion,
            '--solcBinDir',
            SOLC_BIN_DIR,
            '--contractsDir',
            this._contractsDir,
        ]);

        logUtils.log(
            `PID ${solcProcess.pid} compiling ${contractName} with Solidity v${solcVersion} because ${reason}...`,
        );
        solcProcess.on('error', err => {
            logUtils.warn(`${solcProcess.pid}: error spawning resolver-solc process: ${err}`);
        });

        let stdout: string = '';
        solcProcess.stdout.on('data', (chunk: Buffer) => {
            stdout += chunk.toString();
        });

        solcProcess.stderr.on('data', data => {
            logUtils.log(`${solcProcess.pid}: ${data}`);
        });

        solcProcess.stdin.write(JSON.stringify(standardInput));
        solcProcess.stdin.end();

        return new Promise<void>(resolve => {
            solcProcess.on('close', (code: number, signal: string) => {
                if (code && code !== 0) {
                    logUtils.log(`${solcProcess.pid}: Compilation process exited with code ${code}`);
                }
                if (signal) {
                    logUtils.warn(`${solcProcess.pid}: Compilation process halted by signal ${signal}`);
                    resolve();
                }

                let compiled: solc.StandardOutput;
                try {
                    compiled = JSON.parse(stdout);
                } catch (err) {
                    logUtils.warn(`${solcProcess.pid}: Failed to JSON.parse() solc output '${stdout}'`);
                    throw err;
                }

                if (!_.isUndefined(compiled.errors)) {
                    const SOLIDITY_WARNING = 'warning';
                    const errors = _.filter(compiled.errors, entry => entry.severity !== SOLIDITY_WARNING);
                    const warnings = _.filter(compiled.errors, entry => entry.severity === SOLIDITY_WARNING);
                    if (!_.isEmpty(errors)) {
                        errors.forEach(error => {
                            const normalizedErrMsg = getNormalizedErrMsg(error.formattedMessage || error.message);
                            logUtils.log(`${solcProcess.pid}: ${chalk.red(normalizedErrMsg)}`);
                        });
                        process.exit(1);
                    } else {
                        warnings.forEach(warning => {
                            const normalizedWarningMsg = getNormalizedErrMsg(
                                warning.formattedMessage || warning.message,
                            );
                            logUtils.log(`${solcProcess.pid}: ${chalk.yellow(normalizedWarningMsg)}`);
                        });
                    }
                }
                const compiledData = compiled.contracts[contractSource.path][contractName];
                if (_.isUndefined(compiledData)) {
                    throw new Error(
                        `Contract ${contractName} not found in ${
                            contractSource.path
                        }. Please make sure your contract has the same name as it's file name`,
                    );
                }
                if (!_.isUndefined(compiledData.evm)) {
                    if (!_.isUndefined(compiledData.evm.bytecode) && !_.isUndefined(compiledData.evm.bytecode.object)) {
                        compiledData.evm.bytecode.object = ethUtil.addHexPrefix(compiledData.evm.bytecode.object);
                    }
                    if (
                        !_.isUndefined(compiledData.evm.deployedBytecode) &&
                        !_.isUndefined(compiledData.evm.deployedBytecode.object)
                    ) {
                        compiledData.evm.deployedBytecode.object = ethUtil.addHexPrefix(
                            compiledData.evm.deployedBytecode.object,
                        );
                    }
                }

                const sourceCodes = _.mapValues(
                    compiled.sources,
                    (_1, sourceFilePath) => this._resolver.resolve(sourceFilePath).source,
                );
                const contractVersion: ContractVersionData = {
                    compilerOutput: compiledData,
                    sources: compiled.sources,
                    sourceCodes,
                    sourceTreeHashHex,
                    compiler: {
                        name: 'solc',
                        version: fullSolcVersion,
                        settings: this._compilerSettings,
                    },
                };

                let newArtifact: ContractArtifact;
                if (!_.isUndefined(currentArtifactIfExists)) {
                    const currentArtifact = currentArtifactIfExists as ContractArtifact;
                    newArtifact = {
                        ...currentArtifact,
                        ...contractVersion,
                    };
                } else {
                    newArtifact = {
                        schemaVersion: constants.LATEST_ARTIFACT_VERSION,
                        contractName,
                        ...contractVersion,
                        networks: {},
                    };
                }

                const artifactString = utils.stringifyWithFormatting(newArtifact);
                const currentArtifactPath = `${this._artifactsDir}/${contractName}.json`;
                fs.writeFileSync(currentArtifactPath, artifactString);
                logUtils.log(`${solcProcess.pid}: ${contractName} artifact saved!`);

                resolve();
            });
        });
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
