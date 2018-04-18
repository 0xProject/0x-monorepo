import {
    ContractSource,
    ContractSources,
    EnumerableResolver,
    FallthroughResolver,
    FSResolver,
    NameResolver,
    NPMResolver,
    RelativeFSResolver,
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
    ContractVersionData,
} from './utils/types';
import { utils } from './utils/utils';

const ALL_CONTRACTS_IDENTIFIER = '*';
const SOLC_BIN_DIR = path.join(__dirname, '..', '..', 'solc_bin');
const DEFAULT_CONTRACTS_DIR = path.resolve('contracts');
const DEFAULT_ARTIFACTS_DIR = path.resolve('artifacts');
const DEFAULT_COMPILER_SETTINGS: solc.CompilerSettings = {
    optimizer: {
        enabled: false,
    },
    outputSelection: {
        '*': {
            '*': ['abi', 'evm.bytecode.object'],
        },
    },
};
const CONFIG_FILE = 'compiler.json';

/**
 * The Compiler facilitates compiling Solidity smart contracts and saves the results
 * to artifact files.
 */
export class Compiler {
    private _resolver: Resolver;
    private _nameResolver: NameResolver;
    private _contractsDir: string;
    private _compilerSettings: solc.CompilerSettings;
    private _artifactsDir: string;
    private _specifiedContracts: string[] | '*';
    /**
     * Instantiates a new instance of the Compiler class.
     * @return An instance of the Compiler class.
     */
    constructor(opts: CompilerOptions) {
        const config: CompilerOptions = fs.existsSync(CONFIG_FILE)
            ? JSON.parse(fs.readFileSync(CONFIG_FILE).toString())
            : {};
        this._contractsDir = opts.contractsDir || config.contractsDir || DEFAULT_CONTRACTS_DIR;
        this._compilerSettings = opts.compilerSettings || config.compilerSettings || DEFAULT_COMPILER_SETTINGS;
        this._artifactsDir = opts.artifactsDir || config.artifactsDir || DEFAULT_ARTIFACTS_DIR;
        this._specifiedContracts = opts.contracts || config.contracts || '*';
        this._nameResolver = new NameResolver(path.resolve(this._contractsDir));
        const resolver = new FallthroughResolver();
        resolver.appendResolver(new URLResolver());
        const packagePath = path.resolve('');
        resolver.appendResolver(new NPMResolver(packagePath));
        resolver.appendResolver(new RelativeFSResolver(this._contractsDir));
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
        if (this._specifiedContracts === ALL_CONTRACTS_IDENTIFIER) {
            const allContracts = this._nameResolver.getAll();
            contractNamesToCompile = _.map(allContracts, contractSource =>
                path.basename(contractSource.path, constants.SOLIDITY_FILE_EXTENSION),
            );
        } else {
            contractNamesToCompile = this._specifiedContracts;
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
        const absoluteContractPath = path.join(this._contractsDir, contractSource.path);
        const currentArtifactIfExists = await getContractArtifactIfExistsAsync(this._artifactsDir, contractName);
        const sourceTreeHashHex = `0x${this._getSourceTreeHash(absoluteContractPath).toString('hex')}`;
        let shouldCompile = false;
        if (_.isUndefined(currentArtifactIfExists)) {
            shouldCompile = true;
        } else {
            const currentArtifact = currentArtifactIfExists as ContractArtifact;
            shouldCompile =
                currentArtifact.schemaVersion !== '2.0.0' ||
                !_.isEqual(currentArtifact.compiler.settings, this._compilerSettings) ||
                currentArtifact.sourceTreeHashHex !== sourceTreeHashHex;
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
        const standardInput: solc.StandardInput = {
            language: 'Solidity',
            sources: {
                [contractSource.path]: {
                    content: contractSource.source,
                },
            },
            settings: this._compilerSettings,
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
        const compiledData = compiled.contracts[contractSource.path][contractName];
        if (_.isUndefined(compiledData)) {
            throw new Error(
                `Contract ${contractName} not found in ${
                    contractSource.path
                }. Please make sure your contract has the same name as it's file name`,
            );
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
                version: solcVersion,
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
                schemaVersion: '2.0.0',
                contractName,
                ...contractVersion,
                networks: {},
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
