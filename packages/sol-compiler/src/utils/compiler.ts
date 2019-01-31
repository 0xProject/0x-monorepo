import { fetchAsync, logUtils } from '@0x/utils';
import { ResolverEngine } from '@resolver-engine/core';
import { ImportFile } from '@resolver-engine/imports';
import chalk from 'chalk';
import { ContractArtifact } from 'ethereum-types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';
import * as path from 'path';
import * as requireFromString from 'require-from-string';
import * as solc from 'solc';

import { binPaths } from '../solc/bin_paths';

import { constants } from './constants';
import { fsWrapper } from './fs_wrapper';
import { CompilationError } from './types';

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
    const currentArtifactPath = `${artifactsDir}/${contractName}.json`;
    try {
        const opts = {
            encoding: 'utf8',
        };
        const contractArtifactString = await fsWrapper.readFileAsync(currentArtifactPath, opts);
        contractArtifact = JSON.parse(contractArtifactString);
        return contractArtifact;
    } catch (err) {
        logUtils.warn(`Artifact for ${contractName} does not exist`);
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
    if (_.isNull(solcVersionRangeMatch)) {
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
    const SOLIDITY_FILE_EXTENSION_REGEX = /(.*\.sol)/;
    const errPathMatch = errMsg.match(SOLIDITY_FILE_EXTENSION_REGEX);
    if (_.isNull(errPathMatch)) {
        // This can occur if solidity outputs a general warning, e.g
        // Warning: This is a pre-release compiler version, please do not use it in production.
        return errMsg;
    }
    const errPath = errPathMatch[0];
    const baseContract = path.basename(errPath);
    const normalizedErrMsg = errMsg.replace(errPath, baseContract);
    return normalizedErrMsg;
}

// TODO consider replacing parseDependencies() with resolver-engine's findImports()
/**
 * Parses the contract source code and extracts the dendencies
 * @param  source Contract source code
 * @return List of dependendencies
 */
export function parseDependencies(contractSource: ImportFile): string[] {
    // TODO: Use a proper parser
    const source = contractSource.source;
    const IMPORT_REGEX = /(import\s)/;
    const DEPENDENCY_PATH_REGEX = /"([^"]+)"/; // Source: https://github.com/BlockChainCompany/soljitsu/blob/master/lib/shared.js
    const dependencies: string[] = [];
    const lines = source.split('\n');
    _.forEach(lines, line => {
        if (!_.isNull(line.match(IMPORT_REGEX))) {
            const dependencyMatch = line.match(DEPENDENCY_PATH_REGEX);
            if (!_.isNull(dependencyMatch)) {
                let dependencyPath = dependencyMatch[1];
                if (dependencyPath.startsWith('.')) {
                    dependencyPath = path.join(path.dirname(contractSource.url), dependencyPath);
                }
                dependencies.push(dependencyPath);
            }
        }
    });
    return dependencies;
}

/**
 * Compiles the contracts and prints errors/warnings
 * @param solcInstance Instance of a solc compiler
 * @param standardInput Solidity standard JSON input
 */
export function compile(solcInstance: solc.SolcInstance, standardInput: solc.StandardInput): solc.StandardOutput {
    const standardInputStr = JSON.stringify(standardInput);
    const standardOutputStr = solcInstance.compileStandardWrapper(standardInputStr, importPath => {
        throw new Error('Used callback. All sources should be resolved beforehand.');
    });
    const compiled: solc.StandardOutput = JSON.parse(standardOutputStr);
    if (!_.isUndefined(compiled.errors)) {
        printCompilationErrorsAndWarnings(compiled.errors);
    }
    return compiled;
}
/**
 * Separates errors from warnings, formats the messages and prints them. Throws if there is any compilation error (not warning).
 * @param solcErrors The errors field of standard JSON output that contains errors and warnings.
 */
function printCompilationErrorsAndWarnings(solcErrors: solc.SolcError[]): void {
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
export async function getSourceTreeHashAsync(
    resolver: ResolverEngine<ImportFile>,
    importPath: string,
): Promise<Buffer> {
    const importFile: ImportFile = await resolver.require(importPath);
    const dependencies = parseDependencies(importFile);
    const sourceHash = ethUtil.sha3(importFile.source);
    if (dependencies.length === 0) {
        return sourceHash;
    } else {
        const dependencySourceTreeHashes = await Promise.all(
            _.map(dependencies, async (dependency: string) => getSourceTreeHashAsync(resolver, dependency)),
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
export async function getSourcesWithDependenciesAsync(
    resolver: ResolverEngine<ImportFile>,
    contractPath: string,
    fullSources: { [sourceName: string]: { id: number } },
): Promise<{ sourceCodes: { [sourceName: string]: string }; sources: { [sourceName: string]: { id: number } } }> {
    const sources = { [contractPath]: { id: fullSources[contractPath].id } };
    const pamparampam = await resolver.require(contractPath);
    const sourceCodes = { [contractPath]: pamparampam.source };
    await recursivelyGatherDependencySourcesAsync(
        resolver,
        contractPath,
        sourceCodes[contractPath],
        fullSources,
        sources,
        sourceCodes,
    );
    return { sourceCodes, sources };
}

async function recursivelyGatherDependencySourcesAsync(
    resolver: ResolverEngine<ImportFile>,
    contractPath: string,
    contractSource: string,
    fullSources: { [sourceName: string]: { id: number } },
    sourcesToAppendTo: { [sourceName: string]: { id: number } },
    sourceCodesToAppendTo: { [sourceName: string]: string },
): Promise<void> {
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
            importPath = path.resolve(`/${contractFolder}`, importPath);

            // NOTE we want to remove leading slash ONLY if the path to contract
            // folder is not an absolute path (e.g. path to npm package)
            if (!contractFolder.startsWith('/')) {
                importPath = importPath.replace('/', '');
            }
        }

        if (_.isUndefined(sourcesToAppendTo[importPath])) {
            sourcesToAppendTo[importPath] = { id: fullSources[importPath].id };
            const importFile = await resolver.require(importPath);
            sourceCodesToAppendTo[importPath] = importFile.source;

            await recursivelyGatherDependencySourcesAsync(
                resolver,
                importPath,
                importFile.source,
                fullSources,
                sourcesToAppendTo,
                sourceCodesToAppendTo,
            );
        }
    }
}

/**
 * Gets the solidity compiler instance and full version name. If the compiler is already cached - gets it from FS,
 * otherwise - fetches it and caches it.
 * @param solcVersion The compiler version. e.g. 0.5.0
 */
export async function getSolcAsync(
    solcVersion: string,
): Promise<{ solcInstance: solc.SolcInstance; fullSolcVersion: string }> {
    const fullSolcVersion = binPaths[solcVersion];
    if (_.isUndefined(fullSolcVersion)) {
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
    return { solcInstance, fullSolcVersion };
}

/**
 * Solidity compiler emits the bytecode without a 0x prefix for a hex. This function fixes it if bytecode is present.
 * @param compiledContract The standard JSON output section for a contract. Geth modified in place.
 */
export function addHexPrefixToContractBytecode(compiledContract: solc.StandardContractOutput): void {
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
