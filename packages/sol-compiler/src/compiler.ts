import { assert } from '@0x/assert';
import {
    FallthroughResolver,
    FSResolver,
    NameResolver,
    NPMResolver,
    RelativeFSResolver,
    Resolver,
    URLResolver,
} from '@0x/sol-resolver';
import { fetchAsync, logUtils } from '@0x/utils';
import chalk from 'chalk';
import { CompilerOptions, ContractArtifact, ContractVersionData, StandardOutput } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import * as requireFromString from 'require-from-string';
import * as semver from 'semver';
import solc = require('solc');

import { compilerOptionsSchema } from './schemas/compiler_options_schema';
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
import { utils } from './utils/utils';

type TYPE_ALL_FILES_IDENTIFIER = '*';
const ALL_CONTRACTS_IDENTIFIER = '*';
const ALL_FILES_IDENTIFIER = '*';
const SOLC_BIN_DIR = path.join(__dirname, '..', '..', 'solc_bin');
const DEFAULT_CONTRACTS_DIR = path.resolve('contracts');
const DEFAULT_ARTIFACTS_DIR = path.resolve('artifacts');
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

interface VersionToInputs {
    [solcVersion: string]: {
        standardInput: solc.StandardInput;
        contractsToCompile: string[];
    };
}

interface ContractPathToData {
    [contractPath: string]: ContractData;
}

interface ContractData {
    currentArtifactIfExists: ContractArtifact | void;
    sourceTreeHashHex: string;
    contractName: string;
}

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
    private readonly _solcVersionIfExists: string | undefined;
    private readonly _specifiedContracts: string[] | TYPE_ALL_FILES_IDENTIFIER;
    private static async _getSolcAsync(
        solcVersion: string,
    ): Promise<{ solcInstance: solc.SolcInstance; fullSolcVersion: string }> {
        const fullSolcVersion = binPaths[solcVersion];
        if (_.isUndefined(fullSolcVersion)) {
            throw new Error(`${solcVersion} is not a known compiler version`);
        }
        const compilerBinFilename = path.join(SOLC_BIN_DIR, fullSolcVersion);
        let solcjs: string;
        if (await fsWrapper.doesFileExistAsync(compilerBinFilename)) {
            solcjs = (await fsWrapper.readFileAsync(compilerBinFilename)).toString();
        } else {
            logUtils.warn(`Downloading ${fullSolcVersion}...`);
            const url = `${constants.BASE_COMPILER_URL}${fullSolcVersion}`;
            const response = await fetchAsync(url);
            const SUCCESS_STATUS = 200;
            if (response.status !== SUCCESS_STATUS) {
                throw new Error(`Failed to load ${fullSolcVersion}`);
            }
            solcjs = await response.text();
            await fsWrapper.writeFileAsync(compilerBinFilename, solcjs);
        }
        if (solcjs.length === 0) {
            throw new Error('No compiler available');
        }
        const solcInstance = solc.setupMethods(requireFromString(solcjs, compilerBinFilename));
        return { solcInstance, fullSolcVersion };
    }
    private static _addHexPrefixToContractBytecode(compiledContract: solc.StandardContractOutput): void {
        if (!_.isUndefined(compiledContract.evm)) {
            if (!_.isUndefined(compiledContract.evm.bytecode) && !_.isUndefined(compiledContract.evm.bytecode.object)) {
                compiledContract.evm.bytecode.object = ethUtil.addHexPrefix(compiledContract.evm.bytecode.object);
            }
            if (
                !_.isUndefined(compiledContract.evm.deployedBytecode) &&
                !_.isUndefined(compiledContract.evm.deployedBytecode.object)
            ) {
                compiledContract.evm.deployedBytecode.object = ethUtil.addHexPrefix(
                    compiledContract.evm.deployedBytecode.object,
                );
            }
        }
    }
    /**
     * Instantiates a new instance of the Compiler class.
     * @param opts Optional compiler options
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
        await this._compileContractsAsync(this._getContractNamesToCompile(), true);
    }
    /**
     * Compiles Solidity files specified during instantiation, and returns the
     * compiler output given by solc.  Return value is an array of outputs:
     * Solidity modules are batched together by version required, and each
     * element of the returned array corresponds to a compiler version, and
     * each element contains the output for all of the modules compiled with
     * that version.
     */
    public async getCompilerOutputsAsync(): Promise<StandardOutput[]> {
        const promisedOutputs = this._compileContractsAsync(this._getContractNamesToCompile(), false);
        return promisedOutputs;
    }
    private _getContractNamesToCompile(): string[] {
        let contractNamesToCompile;
        if (this._specifiedContracts === ALL_CONTRACTS_IDENTIFIER) {
            const allContracts = this._nameResolver.getAll();
            contractNamesToCompile = _.map(allContracts, contractSource =>
                path.basename(contractSource.path, constants.SOLIDITY_FILE_EXTENSION),
            );
        } else {
            contractNamesToCompile = this._specifiedContracts.map(specifiedContract =>
                path.basename(specifiedContract, constants.SOLIDITY_FILE_EXTENSION),
            );
        }
        return contractNamesToCompile;
    }
    /**
     * Compiles contracts, and, if `shouldPersist` is true, saves artifacts to artifactsDir.
     * @param fileName Name of contract with '.sol' extension.
     * @return an array of compiler outputs, where each element corresponds to a different version of solc-js.
     */
    private async _compileContractsAsync(contractNames: string[], shouldPersist: boolean): Promise<StandardOutput[]> {
        // batch input contracts together based on the version of the compiler that they require.
        const versionToInputs: VersionToInputs = {};

        // map contract paths to data about them for later verification and persistence
        const contractPathToData: ContractPathToData = {};

        for (const contractName of contractNames) {
            const contractSource = this._resolver.resolve(contractName);
            const contractData = {
                contractName,
                currentArtifactIfExists: await getContractArtifactIfExistsAsync(this._artifactsDir, contractName),
                sourceTreeHashHex: `0x${this._getSourceTreeHash(
                    path.join(this._contractsDir, contractSource.path),
                ).toString('hex')}`,
            };
            if (!this._shouldCompile(contractData)) {
                continue;
            }
            contractPathToData[contractSource.path] = contractData;
            const solcVersion = _.isUndefined(this._solcVersionIfExists)
                ? semver.maxSatisfying(_.keys(binPaths), parseSolidityVersionRange(contractSource.source))
                : this._solcVersionIfExists;
            const isFirstContractWithThisVersion = _.isUndefined(versionToInputs[solcVersion]);
            if (isFirstContractWithThisVersion) {
                versionToInputs[solcVersion] = {
                    standardInput: {
                        language: 'Solidity',
                        sources: {},
                        settings: this._compilerSettings,
                    },
                    contractsToCompile: [],
                };
            }
            // add input to the right version batch
            versionToInputs[solcVersion].standardInput.sources[contractSource.path] = {
                content: contractSource.source,
            };
            versionToInputs[solcVersion].contractsToCompile.push(contractSource.path);
        }

        const compilerOutputs: StandardOutput[] = [];

        const solcVersions = _.keys(versionToInputs);
        for (const solcVersion of solcVersions) {
            const input = versionToInputs[solcVersion];
            logUtils.warn(
                `Compiling ${input.contractsToCompile.length} contracts (${
                    input.contractsToCompile
                }) with Solidity v${solcVersion}...`,
            );

            const { solcInstance, fullSolcVersion } = await Compiler._getSolcAsync(solcVersion);

            const compilerOutput = this._compile(solcInstance, input.standardInput);
            compilerOutputs.push(compilerOutput);

            for (const contractPath of input.contractsToCompile) {
                const contractName = contractPathToData[contractPath].contractName;

                const compiledContract = compilerOutput.contracts[contractPath][contractName];
                if (_.isUndefined(compiledContract)) {
                    throw new Error(
                        `Contract ${contractName} not found in ${contractPath}. Please make sure your contract has the same name as it's file name`,
                    );
                }

                Compiler._addHexPrefixToContractBytecode(compiledContract);

                if (shouldPersist) {
                    await this._persistCompiledContractAsync(
                        contractPath,
                        contractPathToData[contractPath].currentArtifactIfExists,
                        contractPathToData[contractPath].sourceTreeHashHex,
                        contractName,
                        fullSolcVersion,
                        compilerOutput,
                    );
                }
            }
        }

        return compilerOutputs;
    }
    private _shouldCompile(contractData: ContractData): boolean {
        if (_.isUndefined(contractData.currentArtifactIfExists)) {
            return true;
        } else {
            const currentArtifact = contractData.currentArtifactIfExists as ContractArtifact;
            const isUserOnLatestVersion = currentArtifact.schemaVersion === constants.LATEST_ARTIFACT_VERSION;
            const didCompilerSettingsChange = !_.isEqual(currentArtifact.compiler.settings, this._compilerSettings);
            const didSourceChange = currentArtifact.sourceTreeHashHex !== contractData.sourceTreeHashHex;
            return !isUserOnLatestVersion || didCompilerSettingsChange || didSourceChange;
        }
    }
    private async _persistCompiledContractAsync(
        contractPath: string,
        currentArtifactIfExists: ContractArtifact | void,
        sourceTreeHashHex: string,
        contractName: string,
        fullSolcVersion: string,
        compilerOutput: solc.StandardOutput,
    ): Promise<void> {
        const compiledContract = compilerOutput.contracts[contractPath][contractName];

        // need to gather sourceCodes for this artifact, but compilerOutput.sources (the list of contract modules)
        // contains listings for for every contract compiled during the compiler invocation that compiled the contract
        // to be persisted, which could include many that are irrelevant to the contract at hand.  So, gather up only
        // the relevant sources:
        const { sourceCodes, sources } = this._getSourcesWithDependencies(contractPath, compilerOutput.sources);

        const contractVersion: ContractVersionData = {
            compilerOutput: compiledContract,
            sources,
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
        await fsWrapper.writeFileAsync(currentArtifactPath, artifactString);
        logUtils.warn(`${contractName} artifact saved!`);
    }
    /**
     * For the given @param contractPath, populates JSON objects to be used in the ContractVersionData interface's
     * properties `sources` (source code file names mapped to ID numbers) and `sourceCodes` (source code content of
     * contracts) for that contract.  The source code pointed to by contractPath is read and parsed directly (via
     * `this._resolver.resolve().source`), as are its imports, recursively.  The ID numbers for @return `sources` are
     * taken from the corresponding ID's in @param fullSources, and the content for @return sourceCodes is read from
     * disk (via the aforementioned `resolver.source`).
     */
    private _getSourcesWithDependencies(
        contractPath: string,
        fullSources: { [sourceName: string]: { id: number } },
    ): { sourceCodes: { [sourceName: string]: string }; sources: { [sourceName: string]: { id: number } } } {
        const sources = { [contractPath]: { id: fullSources[contractPath].id } };
        const sourceCodes = { [contractPath]: this._resolver.resolve(contractPath).source };
        this._recursivelyGatherDependencySources(
            contractPath,
            sourceCodes[contractPath],
            fullSources,
            sources,
            sourceCodes,
        );
        return { sourceCodes, sources };
    }
    private _recursivelyGatherDependencySources(
        contractPath: string,
        contractSource: string,
        fullSources: { [sourceName: string]: { id: number } },
        sourcesToAppendTo: { [sourceName: string]: { id: number } },
        sourceCodesToAppendTo: { [sourceName: string]: string },
    ): void {
        const importStatementMatches = contractSource.match(/\nimport[^;]*;/g);
        if (importStatementMatches === null) {
            return;
        }
        for (const importStatementMatch of importStatementMatches) {
            const importPathMatches = importStatementMatch.match(/\"([^\"]*)\"/);
            if (importPathMatches === null || importPathMatches.length === 0) {
                continue;
            }

            let importPath = importPathMatches[1];
            // HACK(ablrow): We have, e.g.:
            //
            //      importPath   = "../../utils/LibBytes/LibBytes.sol"
            //      contractPath = "2.0.0/protocol/AssetProxyOwner/AssetProxyOwner.sol"
            //
            // Resolver doesn't understand "../" so we want to pass
            // "2.0.0/utils/LibBytes/LibBytes.sol" to resolver.
            //
            // This hack involves using path.resolve. But path.resolve returns
            // absolute directories by default. We trick it into thinking that
            // contractPath is a root directory by prepending a '/' and then
            // removing the '/' the end.
            //
            //      path.resolve("/a/b/c", ""../../d/e") === "/a/d/e"
            //
            const lastPathSeparatorPos = contractPath.lastIndexOf('/');
            const contractFolder = lastPathSeparatorPos === -1 ? '' : contractPath.slice(0, lastPathSeparatorPos + 1);
            importPath = path.resolve('/' + contractFolder, importPath).replace('/', '');

            if (_.isUndefined(sourcesToAppendTo[importPath])) {
                sourcesToAppendTo[importPath] = { id: fullSources[importPath].id };
                sourceCodesToAppendTo[importPath] = this._resolver.resolve(importPath).source;

                this._recursivelyGatherDependencySources(
                    importPath,
                    this._resolver.resolve(importPath).source,
                    fullSources,
                    sourcesToAppendTo,
                    sourceCodesToAppendTo,
                );
            }
        }
    }
    private _compile(solcInstance: solc.SolcInstance, standardInput: solc.StandardInput): solc.StandardOutput {
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
                    logUtils.warn(chalk.red(normalizedErrMsg));
                });
                throw new Error('Compilation errors encountered');
            } else {
                warnings.forEach(warning => {
                    const normalizedWarningMsg = getNormalizedErrMsg(warning.formattedMessage || warning.message);
                    logUtils.warn(chalk.yellow(normalizedWarningMsg));
                });
            }
        }
        return compiled;
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
