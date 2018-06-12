import { promisify } from '@0xproject/utils';
import { stripHexPrefix } from 'ethereumjs-util';
import * as fs from 'fs';
import { Collector } from 'istanbul';
import * as _ from 'lodash';
import { getLogger, levels, Logger } from 'loglevel';
import * as mkdirp from 'mkdirp';

import { AbstractArtifactAdapter } from './artifact_adapters/abstract_artifact_adapter';
import { collectCoverageEntries } from './collect_coverage_entries';
import { constants } from './constants';
import { parseSourceMap } from './source_maps';
import {
    BranchCoverage,
    BranchDescription,
    ContractData,
    Coverage,
    FunctionCoverage,
    FunctionDescription,
    SingleFileSourceRange,
    SourceRange,
    StatementCoverage,
    StatementDescription,
    Subtrace,
    TraceInfo,
    TraceInfoExistingContract,
    TraceInfoNewContract,
} from './types';
import { utils } from './utils';

const mkdirpAsync = promisify<undefined>(mkdirp);

/**
 * CoverageManager is used by CoverageSubprovider to compute code coverage based on collected trace data.
 */
export class CoverageManager {
    private _artifactAdapter: AbstractArtifactAdapter;
    private _logger: Logger;
    private _contractsData!: ContractData[];
    private _collector = new Collector();
    /**
     * Computed partial coverage for a single file & subtrace
     * @param contractData      Contract metadata (source, srcMap, bytecode)
     * @param subtrace          A subset of a transcation/call trace that was executed within that contract
     * @param pcToSourceRange   A mapping from program counters to source ranges
     * @param fileIndex         Index of a file to compute coverage for
     * @return Partial istanbul coverage for that file & subtrace
     */
    private static _getSingleFileCoverageForSubtrace(
        contractData: ContractData,
        subtrace: Subtrace,
        pcToSourceRange: { [programCounter: number]: SourceRange },
        fileIndex: number,
    ): Coverage {
        const absoluteFileName = contractData.sources[fileIndex];
        const coverageEntriesDescription = collectCoverageEntries(contractData.sourceCodes[fileIndex]);
        let sourceRanges = _.map(subtrace, structLog => pcToSourceRange[structLog.pc]);
        sourceRanges = _.compact(sourceRanges); // Some PC's don't map to a source range and we just ignore them.
        // By default lodash does a shallow object comparasion. We JSON.stringify them and compare as strings.
        sourceRanges = _.uniqBy(sourceRanges, s => JSON.stringify(s)); // We don't care if one PC was covered multiple times within a single transaction
        sourceRanges = _.filter(sourceRanges, sourceRange => sourceRange.fileName === absoluteFileName);
        const branchCoverage: BranchCoverage = {};
        const branchIds = _.keys(coverageEntriesDescription.branchMap);
        for (const branchId of branchIds) {
            const branchDescription = coverageEntriesDescription.branchMap[branchId];
            const isBranchCoveredByBranchIndex = _.map(branchDescription.locations, location => {
                const isBranchCovered = _.some(sourceRanges, range => utils.isRangeInside(range.location, location));
                const timesBranchCovered = Number(isBranchCovered);
                return timesBranchCovered;
            });
            branchCoverage[branchId] = isBranchCoveredByBranchIndex;
        }
        const statementCoverage: StatementCoverage = {};
        const statementIds = _.keys(coverageEntriesDescription.statementMap);
        for (const statementId of statementIds) {
            const statementDescription = coverageEntriesDescription.statementMap[statementId];
            const isStatementCovered = _.some(sourceRanges, range =>
                utils.isRangeInside(range.location, statementDescription),
            );
            const timesStatementCovered = Number(isStatementCovered);
            statementCoverage[statementId] = timesStatementCovered;
        }
        const functionCoverage: FunctionCoverage = {};
        const functionIds = _.keys(coverageEntriesDescription.fnMap);
        for (const fnId of functionIds) {
            const functionDescription = coverageEntriesDescription.fnMap[fnId];
            const isFunctionCovered = _.some(sourceRanges, range =>
                utils.isRangeInside(range.location, functionDescription.loc),
            );
            const timesFunctionCovered = Number(isFunctionCovered);
            functionCoverage[fnId] = timesFunctionCovered;
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
            const timesModifierCovered = Number(isModifierCovered);
            statementCoverage[modifierStatementId] = timesModifierCovered;
        }
        const partialCoverage = {
            [absoluteFileName]: {
                ...coverageEntriesDescription,
                path: absoluteFileName,
                f: functionCoverage,
                s: statementCoverage,
                b: branchCoverage,
            },
        };
        return partialCoverage;
    }
    constructor(artifactAdapter: AbstractArtifactAdapter, isVerbose: boolean) {
        this._artifactAdapter = artifactAdapter;
        this._logger = getLogger('sol-cov');
        this._logger.setLevel(isVerbose ? levels.TRACE : levels.ERROR);
    }
    public async writeCoverageAsync(): Promise<void> {
        const finalCoverage = this._collector.getFinalCoverage();
        const stringifiedCoverage = JSON.stringify(finalCoverage, null, '\t');
        await mkdirpAsync('coverage');
        fs.writeFileSync('coverage/coverage.json', stringifiedCoverage);
    }
    public async computeSingleTraceCoverageAsync(traceInfo: TraceInfo): Promise<void> {
        if (_.isUndefined(this._contractsData)) {
            this._contractsData = await this._artifactAdapter.collectContractsDataAsync();
        }
        const isContractCreation = traceInfo.address === constants.NEW_CONTRACT;
        const bytecode = isContractCreation
            ? (traceInfo as TraceInfoNewContract).bytecode
            : (traceInfo as TraceInfoExistingContract).runtimeBytecode;
        const contractData = utils.getContractDataIfExists(this._contractsData, bytecode);
        if (_.isUndefined(contractData)) {
            const errMsg = isContractCreation
                ? `Unknown contract creation transaction`
                : `Transaction to an unknown address: ${traceInfo.address}`;
            this._logger.warn(errMsg);
            return;
        }
        const bytecodeHex = stripHexPrefix(bytecode);
        const sourceMap = isContractCreation ? contractData.sourceMap : contractData.sourceMapRuntime;
        const pcToSourceRange = parseSourceMap(contractData.sourceCodes, sourceMap, bytecodeHex, contractData.sources);
        for (let fileIndex = 0; fileIndex < contractData.sources.length; fileIndex++) {
            const singleFileCoverageForTrace = CoverageManager._getSingleFileCoverageForSubtrace(
                contractData,
                traceInfo.subtrace,
                pcToSourceRange,
                fileIndex,
            );
            this._collector.add(singleFileCoverageForTrace);
        }
    }
}
