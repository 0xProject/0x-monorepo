import { logUtils } from '@0xproject/utils';
import * as _ from 'lodash';
import * as path from 'path';
import * as solc from 'solc';

import { constants } from './constants';
import { fsWrapper } from './fs_wrapper';
import { ContractArtifact, ContractSources } from './types';

/**
 * Gets contract data on network or returns if an artifact does not exist.
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
 * Creates the artifacts directory if it does not already exist.
 */
export async function createArtifactsDirIfDoesNotExistAsync(artifactsDir: string): Promise<void> {
    if (!fsWrapper.doesPathExistSync(artifactsDir)) {
        logUtils.log('Creating artifacts directory...');
        await fsWrapper.mkdirAsync(artifactsDir);
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

export function parseDependencies(source: string): string[] {
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
                const basenName = path.basename(dependencyPath);
                dependencies.push(basenName);
            }
        }
    });
    return dependencies;
}

/**
 * Callback to resolve dependencies with `solc.compile`.
 * Throws error if contractSources not yet initialized.
 * @param  importPath Path to an imported dependency.
 * @return Import contents object containing source code of dependency.
 */
export function findImportIfExist(contractSources: ContractSources, importPath: string): solc.ImportContents {
    const fileName = path.basename(importPath);
    const source = contractSources[fileName];
    if (_.isUndefined(source)) {
        throw new Error(`Contract source not found for ${fileName}`);
    }
    const importContents: solc.ImportContents = {
        contents: source,
    };
    return importContents;
}
