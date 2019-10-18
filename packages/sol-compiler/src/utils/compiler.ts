import { ContractSource, Resolver } from '@0x/sol-resolver';
import { fetchAsync, logUtils } from '@0x/utils';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { ContractArtifact } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';
import * as path from 'path';
import * as requireFromString from 'require-from-string';
import * as solc from 'solc';

import { constants } from './constants';
import { fsWrapper } from './fs_wrapper';
import { BinaryPaths, CompilationError } from './types';

/**
 * Gets contract data on network or returns if an artifact does not exist.
 * @param artifactsDir Path to the artifacts directory.
 * @param contractName Name of contract.
 * @return Contract data on network or undefined.
 */
export async function getContractArtifactIfExistsAsync(
    artifactsDir: string,
    contractName: string,
): Promise<ContractArtifact | void> {
    let contractArtifact;
    const currentArtifactPath = `${artifactsDir}/${path.basename(
        contractName,
        constants.SOLIDITY_FILE_EXTENSION,
    )}.json`;
    try {
        const opts = {
            encoding: 'utf8',
        };
        const contractArtifactString = await fsWrapper.readFileAsync(currentArtifactPath, opts);
        contractArtifact = JSON.parse(contractArtifactString);
        return contractArtifact;
    } catch (err) {
        return undefined;
    }
}

/**
 * Creates a directory if it does not already exist.
 * @param artifactsDir Path to the directory.
 */
export async function createDirIfDoesNotExistAsync(dirPath: string): Promise<void> {
    if (!fsWrapper.doesPathExistSync(dirPath)) {
        logUtils.warn(`Creating directory at ${dirPath}...`);
        await fsWrapper.mkdirpAsync(dirPath);
    }
}

/**
 * Searches Solidity source code for compiler version range.
 * @param  source Source code of contract.
 * @return Solc compiler version range.
 */
export function parseSolidityVersionRange(source: string): string {
    const SOLIDITY_VERSION_RANGE_REGEX = /pragma\s+solidity\s+(.*);/;
    const solcVersionRangeMatch = source.match(SOLIDITY_VERSION_RANGE_REGEX);
    if (solcVersionRangeMatch === null) {
        throw new Error('Could not find Solidity version range in source');
    }
    const solcVersionRange = solcVersionRangeMatch[1];
    return solcVersionRange;
}

/**
 * Normalizes the path found in the error message. If it cannot be normalized
 * the original error message is returned.
 * Example: converts 'base/Token.sol:6:46: Warning: Unused local variable'
 *          to 'Token.sol:6:46: Warning: Unused local variable'
 * This is used to prevent logging the same error multiple times.
 * @param  errMsg An error message from the compiled output.
 * @return The error message with directories truncated from the contract path.
 */
export function getNormalizedErrMsg(errMsg: string): string {
    const SOLIDITY_FILE_EXTENSION_REGEX = /(.*\.sol):/;
    const errPathMatch = errMsg.match(SOLIDITY_FILE_EXTENSION_REGEX);
    if (errPathMatch === null) {
        // This can occur if solidity outputs a general warning, e.g
        // Warning: This is a pre-release compiler version, please do not use it in production.
        return errMsg;
    }
    const errPath = errPathMatch[0];
    const baseContract = path.basename(errPath);
    const normalizedErrMsg = errMsg.replace(errPath, baseContract);
    return normalizedErrMsg;
}

/**
 * Parses the contract source code and extracts the dendencies
 * @param  source Contract source code
 * @return List of dependendencies
 */
export function parseDependencies(contractSource: ContractSource): string[] {
    // TODO: Use a proper parser
    const source = contractSource.source;
    const IMPORT_REGEX = /(import\s)/;
    const DEPENDENCY_PATH_REGEX = /"([^"]+)"/; // Source: https://github.com/BlockChainCompany/soljitsu/blob/master/lib/shared.js
    const dependencies: string[] = [];
    const lines = source.split('\n');
    _.forEach(lines, line => {
        if (line.match(IMPORT_REGEX) !== null) {
            const dependencyMatch = line.match(DEPENDENCY_PATH_REGEX);
            if (dependencyMatch !== null) {
                let dependencyPath = dependencyMatch[1];
                if (dependencyPath.startsWith('.')) {
                    dependencyPath = path.join(path.dirname(contractSource.path), dependencyPath);
                }
                dependencies.push(dependencyPath);
            }
        }
    });
    return dependencies;
}

let solcJSReleasesCache: BinaryPaths | undefined;

/**
 * Fetches the list of available solidity compilers
 * @param isOfflineMode Offline mode flag
 */
export async function getSolcJSReleasesAsync(isOfflineMode: boolean): Promise<BinaryPaths> {
    if (isOfflineMode) {
        return constants.SOLC_BIN_PATHS;
    }
    if (solcJSReleasesCache === undefined) {
        const versionList = await fetch('https://ethereum.github.io/solc-bin/bin/list.json');
        const versionListJSON = await versionList.json();
        solcJSReleasesCache = versionListJSON.releases;
    }
    return solcJSReleasesCache as BinaryPaths;
}

/**
 * Compiles the contracts and prints errors/warnings
 * @param solcInstance Instance of a solc compiler
 * @param standardInput Solidity standard JSON input
 * @param isOfflineMode Offline mode flag
 */
export async function compileSolcJSAsync(
    solcInstance: solc.SolcInstance,
    standardInput: solc.StandardInput,
): Promise<solc.StandardOutput> {
    const standardInputStr = JSON.stringify(standardInput);
    const standardOutputStr = solcInstance.compileStandardWrapper(standardInputStr);
    const compiled: solc.StandardOutput = JSON.parse(standardOutputStr);
    return compiled;
}

/**
 * Compiles the contracts and prints errors/warnings
 * @param solcVersion Version of a solc compiler
 * @param standardInput Solidity standard JSON input
 */
export async function compileDockerAsync(
    solcVersion: string,
    standardInput: solc.StandardInput,
): Promise<solc.StandardOutput> {
    const standardInputStr = JSON.stringify(standardInput, null, 2);
    const dockerCommand = `docker run -i -a stdin -a stdout -a stderr ethereum/solc:${solcVersion} solc --standard-json`;
    const standardOutputStr = execSync(dockerCommand, { input: standardInputStr }).toString();
    const compiled: solc.StandardOutput = JSON.parse(standardOutputStr);
    return compiled;
}

/**
 * Example "relative" paths:
 * /user/leo/0x-monorepo/contracts/extensions/contracts/extension.sol -> extension.sol
 * /user/leo/0x-monorepo/node_modules/@0x/contracts-protocol/contracts/exchange.sol -> @0x/contracts-protocol/contracts/exchange.sol
 */
function makeContractPathRelative(
    absolutePath: string,
    contractsDir: string,
    dependencyNameToPath: { [dependencyName: string]: string },
): string {
    let contractPath = absolutePath.replace(`${contractsDir}/`, '');
    _.map(dependencyNameToPath, (packagePath: string, dependencyName: string) => {
        contractPath = contractPath.replace(packagePath, dependencyName);
    });
    return contractPath;
}

/**
 * Makes the path relative removing all system-dependent data. Converts absolute paths to a format suitable for artifacts.
 * @param absolutePathToSmth Absolute path to contract or source
 * @param contractsDir Current package contracts directory location
 * @param dependencyNameToPath Mapping of dependency name to package path
 */
export function makeContractPathsRelative(
    absolutePathToSmth: { [absoluteContractPath: string]: any },
    contractsDir: string,
    dependencyNameToPath: { [dependencyName: string]: string },
): { [contractPath: string]: any } {
    return _.mapKeys(absolutePathToSmth, (_val: any, absoluteContractPath: string) =>
        makeContractPathRelative(absoluteContractPath, contractsDir, dependencyNameToPath),
    );
}

/**
 * Separates errors from warnings, formats the messages and prints them. Throws if there is any compilation error (not warning).
 * @param solcErrors The errors field of standard JSON output that contains errors and warnings.
 */
export function printCompilationErrorsAndWarnings(solcErrors: solc.SolcError[]): void {
    const SOLIDITY_WARNING = 'warning';
    const errors = _.filter(solcErrors, entry => entry.severity !== SOLIDITY_WARNING);
    const warnings = _.filter(solcErrors, entry => entry.severity === SOLIDITY_WARNING);
    if (!_.isEmpty(errors)) {
        errors.forEach(error => {
            const normalizedErrMsg = getNormalizedErrMsg(error.formattedMessage || error.message);
            logUtils.log(chalk.red('error'), normalizedErrMsg);
        });
        throw new CompilationError(errors.length);
    } else {
        warnings.forEach(warning => {
            const normalizedWarningMsg = getNormalizedErrMsg(warning.formattedMessage || warning.message);
            logUtils.log(chalk.yellow('warning'), normalizedWarningMsg);
        });
    }
}

/**
 * Gets the source tree hash for a file and its dependencies.
 * @param fileName Name of contract file.
 */
export function getSourceTreeHash(resolver: Resolver, importPath: string): Buffer {
    const contractSource = resolver.resolve(importPath);
    const dependencies = parseDependencies(contractSource);
    const sourceHash = ethUtil.sha3(contractSource.source);
    if (dependencies.length === 0) {
        return sourceHash;
    } else {
        const dependencySourceTreeHashes = _.map(dependencies, (dependency: string) =>
            getSourceTreeHash(resolver, dependency),
        );
        const sourceTreeHashesBuffer = Buffer.concat([sourceHash, ...dependencySourceTreeHashes]);
        const sourceTreeHash = ethUtil.sha3(sourceTreeHashesBuffer);
        return sourceTreeHash;
    }
}

/**
 * For the given @param contractPath, populates JSON objects to be used in the ContractVersionData interface's
 * properties `sources` (source code file names mapped to ID numbers) and `sourceCodes` (source code content of
 * contracts) for that contract.  The source code pointed to by contractPath is read and parsed directly (via
 * `resolver.resolve().source`), as are its imports, recursively.  The ID numbers for @return `sources` are
 * taken from the corresponding ID's in @param fullSources, and the content for @return sourceCodes is read from
 * disk (via the aforementioned `resolver.source`).
 */
export function getSourcesWithDependencies(
    resolver: Resolver,
    contractPath: string,
    fullSources: { [sourceName: string]: { id: number } },
): { sourceCodes: { [sourceName: string]: string }; sources: { [sourceName: string]: { id: number } } } {
    const sources = { [contractPath]: fullSources[contractPath] };
    const sourceCodes = { [contractPath]: resolver.resolve(contractPath).source };
    recursivelyGatherDependencySources(
        resolver,
        contractPath,
        sourceCodes[contractPath],
        fullSources,
        sources,
        sourceCodes,
    );
    return { sourceCodes, sources };
}

function recursivelyGatherDependencySources(
    resolver: Resolver,
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
        // HACK(albrow): We have, e.g.:
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
        if (importPath.startsWith('.')) {
            /**
             * Some imports path are relative ("../Token.sol", "./Wallet.sol")
             * while others are absolute ("Token.sol", "@0x/contracts/Wallet.sol")
             * And we need to append the base path for relative imports.
             */
            importPath = path.resolve(`/${contractFolder}`, importPath).replace('/', '');
        }

        if (sourcesToAppendTo[importPath] === undefined) {
            sourcesToAppendTo[importPath] = { id: fullSources[importPath].id };
            sourceCodesToAppendTo[importPath] = resolver.resolve(importPath).source;

            recursivelyGatherDependencySources(
                resolver,
                importPath,
                resolver.resolve(importPath).source,
                fullSources,
                sourcesToAppendTo,
                sourceCodesToAppendTo,
            );
        }
    }
}

/**
 * Gets the solidity compiler instance. If the compiler is already cached - gets it from FS,
 * otherwise - fetches it and caches it.
 * @param solcVersion The compiler version. e.g. 0.5.0
 * @param isOfflineMode Offline mode flag
 */
export async function getSolcJSAsync(solcVersion: string, isOfflineMode: boolean): Promise<solc.SolcInstance> {
    const solcJSReleases = await getSolcJSReleasesAsync(isOfflineMode);
    const fullSolcVersion = solcJSReleases[solcVersion];
    if (fullSolcVersion === undefined) {
        throw new Error(`${solcVersion} is not a known compiler version`);
    }
    const compilerBinFilename = path.join(constants.SOLC_BIN_DIR, fullSolcVersion);
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
    return solcInstance;
}

/**
 * Gets the solidity compiler instance from a module path.
 * @param path The path to the solc module.
 */
export function getSolcJSFromPath(modulePath: string): solc.SolcInstance {
    return require(modulePath);
}

/**
 * Gets the solidity compiler version from a module path.
 * @param path The path to the solc module.
 */
export function getSolcJSVersionFromPath(modulePath: string): string {
    return require(modulePath).version();
}

/**
 * Solidity compiler emits the bytecode without a 0x prefix for a hex. This function fixes it if bytecode is present.
 * @param compiledContract The standard JSON output section for a contract. Geth modified in place.
 */
export function addHexPrefixToContractBytecode(compiledContract: solc.StandardContractOutput): void {
    if (compiledContract.evm !== undefined) {
        if (compiledContract.evm.bytecode !== undefined && compiledContract.evm.bytecode.object !== undefined) {
            compiledContract.evm.bytecode.object = ethUtil.addHexPrefix(compiledContract.evm.bytecode.object);
        }
        if (
            compiledContract.evm.deployedBytecode !== undefined &&
            compiledContract.evm.deployedBytecode.object !== undefined
        ) {
            compiledContract.evm.deployedBytecode.object = ethUtil.addHexPrefix(
                compiledContract.evm.deployedBytecode.object,
            );
        }
    }
}

/**
 * Takes the list of resolved contract sources from `SpyResolver` and produces a mapping from dependency name
 * to package path used in `remappings` later, as well as in generating the "relative" source paths saved to the artifact files.
 * @param contractSources The list of resolved contract sources
 */
export function getDependencyNameToPackagePath(
    contractSources: ContractSource[],
): { [dependencyName: string]: string } {
    const allTouchedFiles = contractSources.map(contractSource => `${contractSource.absolutePath}`);
    const NODE_MODULES = 'node_modules';
    const allTouchedDependencies = _.filter(allTouchedFiles, filePath => filePath.includes(NODE_MODULES));
    const dependencyNameToPath: { [dependencyName: string]: string } = {};
    _.map(allTouchedDependencies, dependencyFilePath => {
        const lastNodeModulesStart = dependencyFilePath.lastIndexOf(NODE_MODULES);
        const lastNodeModulesEnd = lastNodeModulesStart + NODE_MODULES.length;
        const importPath = dependencyFilePath.substr(lastNodeModulesEnd + 1);
        let packageName;
        let packageScopeIfExists;
        let dependencyName;
        if (_.startsWith(importPath, '@')) {
            [packageScopeIfExists, packageName] = importPath.split('/');
            dependencyName = `${packageScopeIfExists}/${packageName}`;
        } else {
            [packageName] = importPath.split('/');
            dependencyName = `${packageName}`;
        }
        const dependencyPackagePath = path.join(dependencyFilePath.substr(0, lastNodeModulesEnd), dependencyName);
        dependencyNameToPath[dependencyName] = dependencyPackagePath;
    });
    return dependencyNameToPath;
}
