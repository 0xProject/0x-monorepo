import * as _ from 'lodash';

import { AbstractArtifactAdapter } from './artifact_adapters/abstract_artifact_adapter';
import { collectCoverageEntries } from './collect_coverage_entries';
import { SingleFileSubtraceHandler, TraceCollector } from './trace_collector';
import { TraceInfoSubprovider } from './trace_info_subprovider';
import {
    BranchCoverage,
    ContractData,
    Coverage,
    FunctionCoverage,
    FunctionDescription,
    SourceRange,
    StatementCoverage,
    StatementDescription,
    Subtrace,
    TraceInfo,
} from './types';
import { utils } from './utils';

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * It's used to compute your code coverage while running solidity tests.
 */
export class CoverageSubprovider extends TraceInfoSubprovider {
    private readonly _coverageCollector: TraceCollector;
    /**
     * Instantiates a CoverageSubprovider instance
     * @param artifactAdapter Adapter for used artifacts format (0x, truffle, giveth, etc.)
     * @param defaultFromAddress default from address to use when sending transactions
     * @param isVerbose If true, we will log any unknown transactions. Otherwise we will ignore them
     */
    constructor(artifactAdapter: AbstractArtifactAdapter, defaultFromAddress: string, isVerbose: boolean = true) {
        const traceCollectionSubproviderConfig = {
            shouldCollectTransactionTraces: true,
            shouldCollectGasEstimateTraces: true,
            shouldCollectCallTraces: true,
        };
        super(defaultFromAddress, traceCollectionSubproviderConfig);
        this._coverageCollector = new TraceCollector(artifactAdapter, isVerbose, coverageHandler);
    }
    protected async _handleTraceInfoAsync(traceInfo: TraceInfo): Promise<void> {
        await this._coverageCollector.computeSingleTraceCoverageAsync(traceInfo);
    }
    /**
     * Write the test coverage results to a file in Istanbul format.
     */
    public async writeCoverageAsync(): Promise<void> {
        await this._coverageCollector.writeOutputAsync();
    }
}

/**
 * Computed partial coverage for a single file & subtrace.
 * @param contractData      Contract metadata (source, srcMap, bytecode)
 * @param subtrace          A subset of a transcation/call trace that was executed within that contract
 * @param pcToSourceRange   A mapping from program counters to source ranges
 * @param fileIndex         Index of a file to compute coverage for
 * @return Partial istanbul coverage for that file & subtrace
 */
export const coverageHandler: SingleFileSubtraceHandler = (
    contractData: ContractData,
    subtrace: Subtrace,
    pcToSourceRange: { [programCounter: number]: SourceRange },
    fileIndex: number,
): Coverage => {
    const absoluteFileName = contractData.sources[fileIndex];
    const coverageEntriesDescription = collectCoverageEntries(contractData.sourceCodes[fileIndex]);

    // if the source wasn't provided for the fileIndex, we can't cover the file
    if (_.isUndefined(coverageEntriesDescription)) {
        return {};
    }

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
};
