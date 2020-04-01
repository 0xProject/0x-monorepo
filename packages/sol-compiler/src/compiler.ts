import { assert } from '@0x/assert';
import {
    ContractSource,
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
import { StandardInput } from 'solc';
import { promisify } from 'util';

import { compilerOptionsSchema } from './schemas/compiler_options_schema';
import {
    CompiledSources,
    createDirIfDoesNotExistAsync,
    getContractArtifactIfExistsAsync,
    getDependencyNameToPackagePath,
    getSolcJSReleasesAsync,
    getSolcJSVersionFromPath,
    getSourcesWithDependencies,
    getSourceTreeHash,
    normalizeSolcVersion,
    parseSolidityVersionRange,
} from './utils/compiler';
import { constants } from './utils/constants';
import { fsWrapper } from './utils/fs_wrapper';
import { utils } from './utils/utils';

import { ContractContentsByPath, ImportPrefixRemappings, SolcWrapper } from './solc_wrapper';
import { SolcWrapperV04 } from './solc_wrapper_v04';
import { SolcWrapperV05 } from './solc_wrapper_v05';
import { SolcWrapperV06 } from './solc_wrapper_v06';

export type TYPE_ALL_FILES_IDENTIFIER = '*';
export const ALL_CONTRACTS_IDENTIFIER = '*';
export const ALL_FILES_IDENTIFIER = '*';

const DEFAULT_COMPILER_OPTS: CompilerOptions = {
    contractsDir: path.resolve('contracts'),
    artifactsDir: path.resolve('artifacts'),
    contracts: ALL_CONTRACTS_IDENTIFIER as TYPE_ALL_FILES_IDENTIFIER,
    useDockerisedSolc: false,
    isOfflineMode: false,
    shouldSaveStandardInput: false,
};

interface ContractsByVersion {
    [solcVersion: string]: ContractContentsByPath;
}

interface ContractPathToData {
    [contractPath: string]: ContractData;
}

interface ContractData {
    currentArtifactIfExists: ContractArtifact | void;
    sourceTreeHashHex: string;
    contractName: string;
}

// tslint:disable no-non-null-assertion
/**
 * The Compiler facilitates compiling Solidity smart contracts and saves the results
 * to artifact files.
 */
export class Compiler {
    private readonly _opts: CompilerOptions;
    private readonly _resolver: Resolver;
    private readonly _nameResolver: NameResolver;
    private readonly _contractsDir: string;
    private readonly _artifactsDir: string;
    private readonly _solcVersionIfExists: string | undefined;
    private readonly _specifiedContracts: string[] | TYPE_ALL_FILES_IDENTIFIER;
    private readonly _isOfflineMode: boolean;
    private readonly _shouldSaveStandardInput: boolean;
    private readonly _solcWrappersByVersion: { [version: string]: SolcWrapper } = {};

    public static async getCompilerOptionsAsync(
        overrides: Partial<CompilerOptions> = {},
        file: string = 'compiler.json',
    ): Promise<CompilerOptions> {
        const fileConfig: CompilerOptions = (await promisify(fs.stat)(file)).isFile
            ? JSON.parse((await promisify(fs.readFile)(file, 'utf8')).toString())
            : {};
        assert.doesConformToSchema('compiler.json', fileConfig, compilerOptionsSchema);
        return {
            ...fileConfig,
            ...overrides,
        };
    }

    private static _createDefaultResolver(
        contractsDir: string,
        // tslint:disable-next-line: trailing-comma
        ...appendedResolvers: Resolver[]
    ): Resolver {
        const resolver = new FallthroughResolver();
        resolver.appendResolver(new URLResolver());
        resolver.appendResolver(new NPMResolver(contractsDir));
        resolver.appendResolver(new RelativeFSResolver(contractsDir));
        resolver.appendResolver(new FSResolver());
        for (const appendedResolver of appendedResolvers) {
            resolver.appendResolver(appendedResolver);
        }
        return resolver;
    }

    /**
     * Instantiates a new instance of the Compiler class.
     * @param opts Optional compiler options
     * @return An instance of the Compiler class.
     */
    constructor(opts: CompilerOptions = {}) {
        this._opts = { ...DEFAULT_COMPILER_OPTS, ...opts };
        assert.doesConformToSchema('opts', this._opts, compilerOptionsSchema);
        this._contractsDir = path.resolve(this._opts.contractsDir!);
        this._solcVersionIfExists =
            process.env.SOLCJS_PATH !== undefined
                ? getSolcJSVersionFromPath(process.env.SOLCJS_PATH)
                : this._opts.solcVersion;
        this._artifactsDir = this._opts.artifactsDir!;
        this._specifiedContracts = this._opts.contracts!;
        this._isOfflineMode = this._opts.isOfflineMode!;
        this._shouldSaveStandardInput = this._opts.shouldSaveStandardInput!;
        this._nameResolver = new NameResolver(this._contractsDir);
        this._resolver = Compiler._createDefaultResolver(this._contractsDir, this._nameResolver);
    }

    /**
     * Compiles selected Solidity files found in `contractsDir` and writes JSON artifacts to `artifactsDir`.
     */
    public async compileAsync(): Promise<void> {
        await createDirIfDoesNotExistAsync(this._artifactsDir);
        await createDirIfDoesNotExistAsync(constants.SOLC_BIN_DIR);
        await this._compileContractsAsync(this.getContractNamesToCompile(), true);
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
        const promisedOutputs = this._compileContractsAsync(this.getContractNamesToCompile(), false);
        return promisedOutputs;
    }

    /**
     * Watch contracts in the current project directory and recompile on changes.
     */
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
        watcher.on('change', () => {
            console.clear(); // tslint:disable-line:no-console
            logUtils.logWithTime('File change detected. Starting incremental compilation...');
            // NOTE: We can't await it here because that's a callback.
            // Instead we stop watching inside of it and start it again when we're finished.
            onFileChangedAsync(); // tslint:disable-line no-floating-promises
        });
    }

    /**
     * Gets a list of contracts to compile.
     */
    public getContractNamesToCompile(): string[] {
        let contractNamesToCompile;
        if (this._specifiedContracts === ALL_CONTRACTS_IDENTIFIER) {
            const allContracts = this._nameResolver.getAll();
            contractNamesToCompile = _.map(allContracts, contractSource =>
                path.basename(contractSource.path, constants.SOLIDITY_FILE_EXTENSION),
            );
        } else {
            return this._specifiedContracts;
        }
        return contractNamesToCompile;
    }

    private _getPathsToWatch(): string[] {
        const contractNames = this.getContractNamesToCompile();
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

    /**
     * Compiles contracts, and, if `shouldPersist` is true, saves artifacts to artifactsDir.
     * @param fileName Name of contract with '.sol' extension.
     * @return an array of compiler outputs, where each element corresponds to a different version of solc-js.
     */
    private async _compileContractsAsync(contractNames: string[], shouldPersist: boolean): Promise<StandardOutput[]> {
        // batch input contracts together based on the version of the compiler that they require.
        const contractsByVersion: ContractsByVersion = {};
        // map contract paths to data about them for later verification and persistence
        const contractPathToData: ContractPathToData = {};

        const solcJSReleases = await getSolcJSReleasesAsync(this._isOfflineMode);
        const resolvedContractSources: ContractSource[] = [];
        for (const contractName of contractNames) {
            const spyResolver = new SpyResolver(this._resolver);
            const contractSource = spyResolver.resolve(contractName);
            const sourceTreeHashHex = getSourceTreeHash(spyResolver, contractSource.path).toString('hex');
            const contractData = {
                contractName: path.basename(contractName, constants.SOLIDITY_FILE_EXTENSION),
                currentArtifactIfExists: await getContractArtifactIfExistsAsync(this._artifactsDir, contractName),
                sourceTreeHashHex: `0x${sourceTreeHashHex}`,
            };
            if (!this._shouldCompile(contractData)) {
                continue;
            }
            contractPathToData[contractSource.absolutePath] = contractData;
            let solcVersion: string | undefined;
            if (this._solcVersionIfExists) {
                solcVersion = this._solcVersionIfExists;
            } else {
                const solidityVersion = semver.maxSatisfying(
                    _.keys(solcJSReleases),
                    parseSolidityVersionRange(contractSource.source),
                );
                if (solidityVersion) {
                    solcVersion = normalizeSolcVersion(solcJSReleases[solidityVersion]);
                }
            }
            if (solcVersion === undefined) {
                throw new Error(
                    `Couldn't find any solidity version satisfying the constraint ${parseSolidityVersionRange(
                        contractSource.source,
                    )}`,
                );
            }
            // add input to the right version batch
            for (const resolvedContractSource of spyResolver.resolvedContractSources) {
                contractsByVersion[solcVersion] = contractsByVersion[solcVersion] || {};
                contractsByVersion[solcVersion][resolvedContractSource.absolutePath] = resolvedContractSource.source;
                resolvedContractSources.push(resolvedContractSource);
            }
        }

        const importRemappings = getDependencyNameToPackagePath(resolvedContractSources);
        const versions = Object.keys(contractsByVersion);

        const compilationResults = await Promise.all(
            versions.map(async solcVersion => {
                const contracts = contractsByVersion[solcVersion];
                logUtils.warn(
                    `Compiling ${Object.keys(contracts).length} contracts (${Object.keys(contracts).map(p =>
                        path.basename(p),
                    )}) with Solidity ${solcVersion}...`,
                );
                return this._getSolcWrapperForVersion(solcVersion).compileAsync(contracts, importRemappings);
            }),
        );

        if (shouldPersist) {
            await Promise.all(
                versions.map(async (solcVersion, i) => {
                    const compilationResult = compilationResults[i];
                    const contracts = contractsByVersion[solcVersion];
                    // tslint:disable-next-line: forin
                    await Promise.all(
                        Object.keys(contracts).map(async contractPath => {
                            const contractData = contractPathToData[contractPath];
                            if (contractData === undefined) {
                                return;
                            }
                            const { contractName } = contractData;
                            const compiledContract = compilationResult.output.contracts[contractPath][contractName];
                            if (compiledContract === undefined) {
                                throw new Error(
                                    `Contract ${contractName} not found in ${contractPath}. Please make sure your contract has the same name as it's file name`,
                                );
                            }
                            await this._persistCompiledContractAsync(
                                contractPath,
                                contractPathToData[contractPath].currentArtifactIfExists,
                                contractPathToData[contractPath].sourceTreeHashHex,
                                contractName,
                                solcVersion,
                                contracts,
                                compilationResult.input,
                                compilationResult.output,
                                importRemappings,
                            );
                        }),
                    );
                }),
            );
        }
        return compilationResults.map(r => r.output);
    }

    private _shouldCompile(contractData: ContractData): boolean {
        if (contractData.currentArtifactIfExists === undefined) {
            return true;
        } else {
            const currentArtifact = contractData.currentArtifactIfExists as ContractArtifact;
            const solc = this._getSolcWrapperForVersion(currentArtifact.compiler.version);
            const isUserOnLatestVersion = currentArtifact.schemaVersion === constants.LATEST_ARTIFACT_VERSION;
            const didCompilerSettingsChange = solc.areCompilerSettingsDifferent(currentArtifact.compiler.settings);
            const didSourceChange = currentArtifact.sourceTreeHashHex !== contractData.sourceTreeHashHex;
            return !isUserOnLatestVersion || didCompilerSettingsChange || didSourceChange;
        }
    }

    private _getSolcWrapperForVersion(solcVersion: string): SolcWrapper {
        const normalizedVersion = normalizeSolcVersion(solcVersion);
        return (
            this._solcWrappersByVersion[normalizedVersion] ||
            (this._solcWrappersByVersion[normalizedVersion] = this._createSolcInstance(normalizedVersion))
        );
    }

    private _createSolcInstance(solcVersion: string): SolcWrapper {
        if (solcVersion.startsWith('0.4.')) {
            return new SolcWrapperV04(solcVersion, this._opts);
        }
        if (solcVersion.startsWith('0.5.')) {
            return new SolcWrapperV05(solcVersion, this._opts);
        }
        if (solcVersion.startsWith('0.6')) {
            return new SolcWrapperV06(solcVersion, this._opts);
        }
        throw new Error(`Missing Solc wrapper implementation for version ${solcVersion}`);
    }

    private async _persistCompiledContractAsync(
        contractPath: string,
        currentArtifactIfExists: ContractArtifact | void,
        sourceTreeHashHex: string,
        contractName: string,
        solcVersion: string,
        sourcesByPath: ContractContentsByPath,
        compilerInput: StandardInput,
        compilerOutput: StandardOutput,
        importRemappings: ImportPrefixRemappings,
    ): Promise<void> {
        const compiledContract = compilerOutput.contracts[contractPath][contractName];
        // need to gather sourceCodes for this artifact, but compilerOutput.sources (the list of contract modules)
        // contains listings for every contract compiled during the compiler invocation that compiled the contract
        // to be persisted, which could include many that are irrelevant to the contract at hand.  So, gather up only
        // the relevant sources:
        const allSources: CompiledSources = {};
        // tslint:disable-next-line: forin
        for (const sourceContractPath in sourcesByPath) {
            const content = sourcesByPath[sourceContractPath];
            const { id } = compilerOutput.sources[sourceContractPath];
            allSources[sourceContractPath] = { id, content };
        }
        const usedSources = getSourcesWithDependencies(contractPath, allSources, importRemappings);

        const contractVersion: ContractVersionData = {
            compilerOutput: compiledContract,
            sourceTreeHashHex,
            sources: _.mapValues(usedSources, ({ id }) => ({ id })),
            sourceCodes: _.mapValues(usedSources, ({ content }) => content),
            compiler: {
                name: 'solc',
                version: solcVersion,
                settings: compilerInput.settings,
            },
        };

        let newArtifact: ContractArtifact;
        if (currentArtifactIfExists !== undefined) {
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
                chains: {},
            };
        }

        const artifactString = utils.stringifyWithFormatting(newArtifact);
        const currentArtifactPath = `${this._artifactsDir}/${contractName}.json`;
        await fsWrapper.writeFileAsync(currentArtifactPath, artifactString);
        logUtils.warn(`${contractName} artifact saved!`);

        if (this._shouldSaveStandardInput) {
            await fsWrapper.writeFileAsync(
                `${this._artifactsDir}/${contractName}.input.json`,
                utils.stringifyWithFormatting({
                    ...compilerInput,
                    // Insert solcVersion into input.
                    settings: {
                        ...compilerInput.settings,
                        version: solcVersion,
                    },
                }),
            );
            logUtils.warn(`${contractName} input artifact saved!`);
        }
    }
}
