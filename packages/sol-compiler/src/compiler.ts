import { assert } from '@0x/assert';
import {
    FallthroughResolver,
    FSResolver,
    NameResolver,
    NPMResolver,
    RelativeFSResolver,
    Resolver,
    SpyResolver,
    URLResolver,
} from '@0x/sol-resolver';
import { logUtils } from '@0x/utils';
import * as chokidar from 'chokidar';
import { CompilerOptions, ContractArtifact, ContractVersionData, StandardOutput } from 'ethereum-types';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import * as pluralize from 'pluralize';
import * as semver from 'semver';
import solc = require('solc');

import { compilerOptionsSchema } from './schemas/compiler_options_schema';
import { binPaths } from './solc/bin_paths';
import {
    addHexPrefixToContractBytecode,
    compile,
    createDirIfDoesNotExistAsync,
    getContractArtifactIfExistsAsync,
    getSolcAsync,
    getSourcesWithDependencies,
    getSourceTreeHash,
    parseSolidityVersionRange,
} from './utils/compiler';
import { constants } from './utils/constants';
import { fsWrapper } from './utils/fs_wrapper';
import { utils } from './utils/utils';

type TYPE_ALL_FILES_IDENTIFIER = '*';
const ALL_CONTRACTS_IDENTIFIER = '*';

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
    private readonly _opts: CompilerOptions;
    private readonly _resolver: Resolver;
    private readonly _nameResolver: NameResolver;
    /**
     * Instantiates a new instance of the Compiler class.
     * @param opts Optional compiler options
     * @return An instance of the Compiler class.
     */
    constructor(opts: CompilerOptions) {
        assert.doesConformToSchema('opts', opts, compilerOptionsSchema);
        this._opts = opts;
        this._nameResolver = new NameResolver(path.resolve(this._opts.contractsDir));
        const resolver = new FallthroughResolver();
        resolver.appendResolver(new URLResolver());
        const packagePath = path.resolve('');
        resolver.appendResolver(new NPMResolver(packagePath));
        resolver.appendResolver(new RelativeFSResolver(this._opts.contractsDir));
        resolver.appendResolver(new FSResolver());
        resolver.appendResolver(this._nameResolver);
        this._resolver = resolver;
    }
    /**
     * Compiles selected Solidity files found in `contractsDir` and writes JSON artifacts to `artifactsDir`.
     */
    public async compileAsync(): Promise<void> {
        await createDirIfDoesNotExistAsync(this._opts.artifactsDir);
        await createDirIfDoesNotExistAsync(constants.SOLC_BIN_DIR);
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
    public async watchAsync(): Promise<void> {
        console.clear(); // tslint:disable-line:no-console
        logUtils.logWithTime('Starting compilation in watch mode...');
        const MATCH_NOTHING_REGEX = '^$';
        const IGNORE_DOT_FILES_REGEX = /(^|[\/\\])\../;
        // Initially we watch nothing. We'll add the paths later.
        const watcher = chokidar.watch(MATCH_NOTHING_REGEX, { ignored: IGNORE_DOT_FILES_REGEX });
        const onFileChangedAsync = async () => {
            watcher.unwatch('*'); // Stop watching
            try {
                await this.compileAsync();
                logUtils.logWithTime('Found 0 errors. Watching for file changes.');
            } catch (err) {
                if (err.typeName === 'CompilationError') {
                    logUtils.logWithTime(
                        `Found ${err.errorsCount} ${pluralize('error', err.errorsCount)}. Watching for file changes.`,
                    );
                } else {
                    logUtils.logWithTime('Found errors. Watching for file changes.');
                }
            }

            const pathsToWatch = this._getPathsToWatch();
            watcher.add(pathsToWatch);
        };
        await onFileChangedAsync();
        watcher.on('change', (changedFilePath: string) => {
            console.clear(); // tslint:disable-line:no-console
            logUtils.logWithTime('File change detected. Starting incremental compilation...');
            // NOTE: We can't await it here because that's a callback.
            // Instead we stop watching inside of it and start it again when we're finished.
            onFileChangedAsync(); // tslint:disable-line no-floating-promises
        });
    }
    private _getPathsToWatch(): string[] {
        const contractNames = this._getContractNamesToCompile();
        const spyResolver = new SpyResolver(this._resolver);
        for (const contractName of contractNames) {
            const contractSource = spyResolver.resolve(contractName);
            // NOTE: We ignore the return value here. We don't want to compute the source tree hash.
            // We just want to call a SpyResolver on each contracts and it's dependencies and
            // this is a convenient way to reuse the existing code that does that.
            // We can then get all the relevant paths from the `spyResolver` below.
            getSourceTreeHash(spyResolver, contractSource.path);
        }
        const pathsToWatch = _.uniq(spyResolver.resolvedContractSources.map(cs => cs.absolutePath));
        return pathsToWatch;
    }
    private _getContractNamesToCompile(): string[] {
        let contractNamesToCompile;
        if (this._opts.contracts === ALL_CONTRACTS_IDENTIFIER) {
            const allContracts = this._nameResolver.getAll();
            contractNamesToCompile = _.map(allContracts, contractSource =>
                path.basename(contractSource.path, constants.SOLIDITY_FILE_EXTENSION),
            );
        } else {
            contractNamesToCompile = this._opts.contracts.map((contract: string) =>
                path.basename(contract, constants.SOLIDITY_FILE_EXTENSION),
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
            const sourceTreeHashHex = getSourceTreeHash(
                this._resolver,
                path.join(this._opts.contractsDir, contractSource.path),
            ).toString('hex');
            const contractData = {
                contractName,
                currentArtifactIfExists: await getContractArtifactIfExistsAsync(this._opts.artifactsDir, contractName),
                sourceTreeHashHex: `0x${sourceTreeHashHex}`,
            };
            if (!this._shouldCompile(contractData)) {
                continue;
            }
            contractPathToData[contractSource.path] = contractData;
            const solcVersion = _.isUndefined(this._opts.solcVersion)
                ? semver.maxSatisfying(_.keys(binPaths), parseSolidityVersionRange(contractSource.source))
                : this._opts.solcVersion;
            const isFirstContractWithThisVersion = _.isUndefined(versionToInputs[solcVersion]);
            if (isFirstContractWithThisVersion) {
                versionToInputs[solcVersion] = {
                    standardInput: {
                        language: 'Solidity',
                        sources: {},
                        settings: this._opts.compilerSettings,
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

            const { solcInstance, fullSolcVersion } = await getSolcAsync(solcVersion);
            const compilerOutput = compile(this._resolver, solcInstance, input.standardInput);
            compilerOutputs.push(compilerOutput);

            for (const contractPath of input.contractsToCompile) {
                const contractName = contractPathToData[contractPath].contractName;

                const compiledContract = compilerOutput.contracts[contractPath][contractName];
                if (_.isUndefined(compiledContract)) {
                    throw new Error(
                        `Contract ${contractName} not found in ${contractPath}. Please make sure your contract has the same name as it's file name`,
                    );
                }

                addHexPrefixToContractBytecode(compiledContract);

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
            const didCompilerSettingsChange = !_.isEqual(currentArtifact.compiler.settings, this._opts.compilerSettings);
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
        // contains listings for every contract compiled during the compiler invocation that compiled the contract
        // to be persisted, which could include many that are irrelevant to the contract at hand.  So, gather up only
        // the relevant sources:
        const { sourceCodes, sources } = getSourcesWithDependencies(
            this._resolver,
            contractPath,
            compilerOutput.sources,
        );

        const contractVersion: ContractVersionData = {
            compilerOutput: compiledContract,
            sources,
            sourceCodes,
            sourceTreeHashHex,
            compiler: {
                name: 'solc',
                version: fullSolcVersion,
                settings: this._opts.compilerSettings,
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
        const currentArtifactPath = `${this._opts.artifactsDir}/${contractName}.json`;
        await fsWrapper.writeFileAsync(currentArtifactPath, artifactString);
        logUtils.warn(`${contractName} artifact saved!`);
    }
}
