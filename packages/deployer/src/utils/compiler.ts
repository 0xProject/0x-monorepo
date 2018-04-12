import { AbiType, ContractAbi, MethodAbi } from '@0xproject/types';
import { logUtils } from '@0xproject/utils';
import * as _ from 'lodash';
import * as path from 'path';
import * as solc from 'solc';

import { constants } from './constants';
import { fsWrapper } from './fs_wrapper';
import { ContractArtifact, ContractSources, FunctionNameToSeenCount } from './types';

/**
 * Constructs a system-wide unique identifier for a source file.
 * @param directoryNamespace Namespace of the source file's root contract directory.
 * @param sourceFilePath Path to a source file, relative to contractBaseDir.
 * @return sourceFileId A system-wide unique identifier for the source file.
 */
export function constructUniqueSourceFileId(directoryNamespace: string, sourceFilePath: string): string {
    const namespacePrefix = !_.isEmpty(directoryNamespace) ? `/${directoryNamespace}` : '';
    const sourceFilePathNoLeadingSlash = sourceFilePath.replace(/^\/+/g, '');
    const sourceFileId = `${namespacePrefix}/${sourceFilePathNoLeadingSlash}`;
    return sourceFileId;
}
/**
 * Constructs a system-wide unique identifier for a dependency file.
 * @param dependencyFilePath Path from a sourceFile to a dependency.
 * @param  contractBaseDir Base contracts directory of search tree.
 * @return sourceFileId A system-wide unique identifier for the source file.
 */
export function constructDependencyFileId(dependencyFilePath: string, sourceFilePath: string): string {
    if (_.startsWith(dependencyFilePath, '/')) {
        // Path of the form /namespace/path/to/dependency.sol
        return dependencyFilePath;
    } else {
        // Dependency is relative to the source file: ./dependency.sol, ../../some/path/dependency.sol, etc.
        // Join the two paths to construct a valid source file id: /namespace/path/to/dependency.sol
        return path.join(path.dirname(sourceFilePath), dependencyFilePath);
    }
}
/**
 * Constructs a system-wide unique identifier for a contract.
 * @param directoryNamespace Namespace of the source file's root contract directory.
 * @param sourceFilePath Path to a source file, relative to contractBaseDir.
 * @return sourceFileId A system-wide unique identifier for contract.
 */
export function constructContractId(directoryNamespace: string, sourceFilePath: string): string {
    const namespacePrefix = !_.isEmpty(directoryNamespace) ? `${directoryNamespace}:` : '';
    const sourceFileName = path.basename(sourceFilePath, constants.SOLIDITY_FILE_EXTENSION);
    const contractId = `${namespacePrefix}${sourceFileName}`;
    return contractId;
}
/**
 * Gets contract data on network or returns if an artifact does not exist.
 * @param artifactsDir Path to the artifacts directory.
 * @param fileName Name of contract file.
 * @return Contract data on network or undefined.
 */
export async function getContractArtifactIfExistsAsync(
    artifactsDir: string,
    fileName: string,
): Promise<ContractArtifact | void> {
    let contractArtifact;
    const contractName = path.basename(fileName, constants.SOLIDITY_FILE_EXTENSION);
    const currentArtifactPath = `${artifactsDir}/${contractName}.json`;
    try {
        const opts = {
            encoding: 'utf8',
        };
        const contractArtifactString = await fsWrapper.readFileAsync(currentArtifactPath, opts);
        contractArtifact = JSON.parse(contractArtifactString);
        return contractArtifact;
    } catch (err) {
        logUtils.log(`Artifact for ${fileName} does not exist`);
        return undefined;
    }
}

/**
 * Creates a directory if it does not already exist.
 * @param artifactsDir Path to the directory.
 */
export async function createDirIfDoesNotExistAsync(dirPath: string): Promise<void> {
    if (!fsWrapper.doesPathExistSync(dirPath)) {
        logUtils.log(`Creating directory at ${dirPath}...`);
        await fsWrapper.mkdirAsync(dirPath);
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
 * Normalizes the path found in the error message.
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
        throw new Error('Could not find a path in error message');
    }
    const errPath = errPathMatch[0];
    const baseContract = path.basename(errPath);
    const normalizedErrMsg = errMsg.replace(errPath, baseContract);
    return normalizedErrMsg;
}

/**
 * Parses the contract source code and extracts the dendencies
 * @param  source Contract source code
 * @param sourceFilePath File path of the source code.
 * @return List of dependendencies
 */
export function parseDependencies(source: string, sourceFileId: string): string[] {
    // TODO: Use a proper parser
    const IMPORT_REGEX = /(import\s)/;
    const DEPENDENCY_PATH_REGEX = /"([^"]+)"/; // Source: https://github.com/BlockChainCompany/soljitsu/blob/master/lib/shared.js
    const dependencies: string[] = [];
    const lines = source.split('\n');
    _.forEach(lines, line => {
        if (!_.isNull(line.match(IMPORT_REGEX))) {
            const dependencyMatch = line.match(DEPENDENCY_PATH_REGEX);
            if (!_.isNull(dependencyMatch)) {
                const dependencyPath = dependencyMatch[1];
                const dependencyId = constructDependencyFileId(dependencyPath, sourceFileId);
                dependencies.push(dependencyId);
            }
        }
    });
    return dependencies;
}

/**
 * Callback to resolve dependencies with `solc.compile`.
 * Throws error if contractSources not yet initialized.
 * @param  contractSources Source codes of contracts.
 * @param  sourceFileId ID of the source file.
 * @param  importPath Path of dependency source file.
 * @return Import contents object containing source code of dependency.
 */
export function findImportIfExist(
    contractSources: ContractSources,
    sourceFileId: string,
    importPath: string,
): solc.ImportContents {
    const dependencyFileId = constructDependencyFileId(importPath, sourceFileId);
    const source = contractSources[dependencyFileId];
    if (_.isUndefined(source)) {
        throw new Error(`Contract source not found for ${dependencyFileId}`);
    }
    const importContents: solc.ImportContents = {
        contents: source,
    };
    return importContents;
}
