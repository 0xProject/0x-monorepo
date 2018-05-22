import { promisify } from '@0xproject/utils';
import { addHexPrefix, stripHexPrefix } from 'ethereumjs-util';
import * as fs from 'fs';
import { Collector } from 'istanbul';
import * as _ from 'lodash';
import { getLogger, levels, Logger, LogLevel } from 'loglevel';
import * as mkdirp from 'mkdirp';
import * as path from 'path';

import { AbstractArtifactAdapter } from './artifact_adapters/abstract_artifact_adapter';
import { collectCoverageEntries } from './collect_coverage_entries';
import { constants } from './constants';
import { parseSourceMap } from './source_maps';
import {
    BranchCoverage,
    BranchDescription,
    BranchMap,
    ContractData,
    Coverage,
    FnMap,
    FunctionCoverage,
    FunctionDescription,
    LineColumn,
    SingleFileSourceRange,
    SourceRange,
    StatementCoverage,
    StatementDescription,
    StatementMap,
    TraceInfo,
    TraceInfoExistingContract,
    TraceInfoNewContract,
} from './types';
import { utils } from './utils';

const mkdirpAsync = promisify<undefined>(mkdirp);

export class CoverageManager {
    private _artifactAdapter: AbstractArtifactAdapter;
    private _logger: Logger;
    private _traceInfos: TraceInfo[] = [];
    private _getContractCodeAsync: (address: string) => Promise<string>;
    private static _getSingleFileCoverageForTrace(
        contractData: ContractData,
        coveredPcs: number[],
        pcToSourceRange: { [programCounter: number]: SourceRange },
        fileIndex: number,
    ): Coverage {
        const absoluteFileName = contractData.sources[fileIndex];
        const coverageEntriesDescription = collectCoverageEntries(contractData.sourceCodes[fileIndex]);
        let sourceRanges = _.map(coveredPcs, coveredPc => pcToSourceRange[coveredPc]);
        sourceRanges = _.compact(sourceRanges); // Some PC's don't map to a source range and we just ignore them.
        // By default lodash does a shallow object comparasion. We JSON.stringify them and compare as strings.
        sourceRanges = _.uniqBy(sourceRanges, s => JSON.stringify(s)); // We don't care if one PC was covered multiple times within a single transaction
        sourceRanges = _.filter(sourceRanges, sourceRange => sourceRange.fileName === absoluteFileName);
        const branchCoverage: BranchCoverage = {};
        const branchIds = _.keys(coverageEntriesDescription.branchMap);
        for (const branchId of branchIds) {
            const branchDescription = coverageEntriesDescription.branchMap[branchId];
            const isCoveredByBranchIndex = _.map(branchDescription.locations, location =>
                _.some(sourceRanges, range => utils.isRangeInside(range.location, location)),
            );
            branchCoverage[branchId] = isCoveredByBranchIndex;
        }
        const statementCoverage: StatementCoverage = {};
        const statementIds = _.keys(coverageEntriesDescription.statementMap);
        for (const statementId of statementIds) {
            const statementDescription = coverageEntriesDescription.statementMap[statementId];
            const isCovered = _.some(sourceRanges, range => utils.isRangeInside(range.location, statementDescription));
            statementCoverage[statementId] = isCovered;
        }
        const functionCoverage: FunctionCoverage = {};
        const functionIds = _.keys(coverageEntriesDescription.fnMap);
        for (const fnId of functionIds) {
            const functionDescription = coverageEntriesDescription.fnMap[fnId];
            const isCovered = _.some(sourceRanges, range =>
                utils.isRangeInside(range.location, functionDescription.loc),
            );
            functionCoverage[fnId] = isCovered;
        }
        // HACK: Solidity doesn't emit any opcodes that map back to modifiers with no args, that's why we map back to the
        // function range and check if there is any covered statement within that range.
        for (const modifierStatementId of coverageEntriesDescription.modifiersStatementIds) {
            if (statementCoverage[modifierStatementId]) {
                // Already detected as covered
                continue;
            }
            const modifierDescription = coverageEntriesDescription.statementMap[modifierStatementId];
            const enclosingFunction = _.find(coverageEntriesDescription.fnMap, functionDescription =>
                utils.isRangeInside(modifierDescription, functionDescription.loc),
            ) as FunctionDescription;
            const isModifierCovered = _.some(
                coverageEntriesDescription.statementMap,
                (statementDescription: StatementDescription, statementId: number) => {
                    const isInsideTheModifierEnclosingFunction = utils.isRangeInside(
                        statementDescription,
                        enclosingFunction.loc,
                    );
                    const isCovered = statementCoverage[statementId];
                    return isInsideTheModifierEnclosingFunction && isCovered;
                },
            );
            statementCoverage[modifierStatementId] = isModifierCovered;
        }
        const partialCoverage = {
            [absoluteFileName]: {
                ...coverageEntriesDescription,
                l: {}, // It's able to derive it from statement coverage
                path: absoluteFileName,
                f: functionCoverage,
                s: statementCoverage,
                b: branchCoverage,
            },
        };
        return partialCoverage;
    }
    private static _bytecodeToBytecodeRegex(bytecode: string): string {
        const bytecodeRegex = bytecode
            // Library linking placeholder: __ConvertLib____________________________
            .replace(/_.*_/, '.*')
            // Last 86 characters is solidity compiler metadata that's different between compilations
            .replace(/.{86}$/, '')
            // Libraries contain their own address at the beginning of the code and it's impossible to know it in advance
            .replace(/^0x730000000000000000000000000000000000000000/, '0x73........................................');
        return bytecodeRegex;
    }
    private static _getContractDataIfExists(contractsData: ContractData[], bytecode: string): ContractData | undefined {
        if (!bytecode.startsWith('0x')) {
            throw new Error('0x missing');
        }
        const contractData = _.find(contractsData, contractDataCandidate => {
            const bytecodeRegex = CoverageManager._bytecodeToBytecodeRegex(contractDataCandidate.bytecode);
            const runtimeBytecodeRegex = CoverageManager._bytecodeToBytecodeRegex(
                contractDataCandidate.runtimeBytecode,
            );
            return !_.isNull(bytecode.match(bytecodeRegex)) || !_.isNull(bytecode.match(runtimeBytecodeRegex));
        });
        return contractData;
    }
    constructor(
        artifactAdapter: AbstractArtifactAdapter,
        getContractCodeAsync: (address: string) => Promise<string>,
        isVerbose: boolean,
    ) {
        this._getContractCodeAsync = getContractCodeAsync;
        this._artifactAdapter = artifactAdapter;
        this._logger = getLogger('sol-cov');
        this._logger.setLevel(isVerbose ? levels.TRACE : levels.ERROR);
    }
    public appendTraceInfo(traceInfo: TraceInfo): void {
        this._traceInfos.push(traceInfo);
    }
    public async writeCoverageAsync(): Promise<void> {
        const finalCoverage = await this._computeCoverageAsync();
        const stringifiedCoverage = JSON.stringify(finalCoverage, null, '\t');
        await mkdirpAsync('coverage');
        fs.writeFileSync('coverage/coverage.json', stringifiedCoverage);
    }
    private async _computeCoverageAsync(): Promise<Coverage> {
        const contractsData = await this._artifactAdapter.collectContractsDataAsync();
        const collector = new Collector();
        for (const traceInfo of this._traceInfos) {
            if (traceInfo.address !== constants.NEW_CONTRACT) {
                // Runtime transaction
                const runtimeBytecode = (traceInfo as TraceInfoExistingContract).runtimeBytecode;
                const contractData = CoverageManager._getContractDataIfExists(contractsData, runtimeBytecode);
                if (_.isUndefined(contractData)) {
                    this._logger.warn(`Transaction to an unknown address: ${traceInfo.address}`);
                    continue;
                }
                const bytecodeHex = stripHexPrefix(runtimeBytecode);
                const sourceMap = contractData.sourceMapRuntime;
                const pcToSourceRange = parseSourceMap(
                    contractData.sourceCodes,
                    sourceMap,
                    bytecodeHex,
                    contractData.sources,
                );
                for (let fileIndex = 0; fileIndex < contractData.sources.length; fileIndex++) {
                    const singleFileCoverageForTrace = CoverageManager._getSingleFileCoverageForTrace(
                        contractData,
                        traceInfo.coveredPcs,
                        pcToSourceRange,
                        fileIndex,
                    );
                    collector.add(singleFileCoverageForTrace);
                }
            } else {
                // Contract creation transaction
                const bytecode = (traceInfo as TraceInfoNewContract).bytecode;
                const contractData = CoverageManager._getContractDataIfExists(contractsData, bytecode);
                if (_.isUndefined(contractData)) {
                    this._logger.warn(`Unknown contract creation transaction`);
                    continue;
                }
                const bytecodeHex = stripHexPrefix(bytecode);
                const sourceMap = contractData.sourceMap;
                const pcToSourceRange = parseSourceMap(
                    contractData.sourceCodes,
                    sourceMap,
                    bytecodeHex,
                    contractData.sources,
                );
                for (let fileIndex = 0; fileIndex < contractData.sources.length; fileIndex++) {
                    const singleFileCoverageForTrace = CoverageManager._getSingleFileCoverageForTrace(
                        contractData,
                        traceInfo.coveredPcs,
                        pcToSourceRange,
                        fileIndex,
                    );
                    collector.add(singleFileCoverageForTrace);
                }
            }
        }
        return collector.getFinalCoverage();
    }
}
