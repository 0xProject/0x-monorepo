import * as _ from 'lodash';

import { AbstractArtifactAdapter } from './artifact_adapters/abstract_artifact_adapter';
import { collectCoverageEntries } from './collect_coverage_entries';
import { SingleFileSubtraceHandler, TraceCollector } from './trace_collector';
import { TraceInfoSubprovider } from './trace_info_subprovider';
import { ContractData, Coverage, SourceRange, Subtrace, TraceInfo } from './types';
import { utils } from './utils';

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * ProfilerSubprovider is used to profile Solidity code while running tests.
 */
export class ProfilerSubprovider extends TraceInfoSubprovider {
    private readonly _profilerCollector: TraceCollector;
    /**
     * Instantiates a ProfilerSubprovider instance
     * @param artifactAdapter Adapter for used artifacts format (0x, truffle, giveth, etc.)
     * @param defaultFromAddress default from address to use when sending transactions
     * @param isVerbose If true, we will log any unknown transactions. Otherwise we will ignore them
     */
    constructor(artifactAdapter: AbstractArtifactAdapter, defaultFromAddress: string, isVerbose: boolean = true) {
        const traceCollectionSubproviderConfig = {
            shouldCollectTransactionTraces: true,
            shouldCollectGasEstimateTraces: false,
            shouldCollectCallTraces: false,
        };
        super(defaultFromAddress, traceCollectionSubproviderConfig);
        this._profilerCollector = new TraceCollector(artifactAdapter, isVerbose, profilerHandler);
    }
    protected async _handleTraceInfoAsync(traceInfo: TraceInfo): Promise<void> {
        await this._profilerCollector.computeSingleTraceCoverageAsync(traceInfo);
    }
    /**
     * Write the test profiler results to a file in Istanbul format.
     */
    public async writeProfilerOutputAsync(): Promise<void> {
        await this._profilerCollector.writeOutputAsync();
    }
}

/**
 * Computed partial coverage for a single file & subtrace for the purposes of
 * gas profiling.
 * @param contractData      Contract metadata (source, srcMap, bytecode)
 * @param subtrace          A subset of a transcation/call trace that was executed within that contract
 * @param pcToSourceRange   A mapping from program counters to source ranges
 * @param fileIndex         Index of a file to compute coverage for
 * @return Partial istanbul coverage for that file & subtrace
 */
export const profilerHandler: SingleFileSubtraceHandler = (
    contractData: ContractData,
    subtrace: Subtrace,
    pcToSourceRange: { [programCounter: number]: SourceRange },
    fileIndex: number,
): Coverage => {
    const absoluteFileName = contractData.sources[fileIndex];
    const profilerEntriesDescription = collectCoverageEntries(contractData.sourceCodes[fileIndex]);
    const gasConsumedByStatement: { [statementId: string]: number } = {};
    const statementIds = _.keys(profilerEntriesDescription.statementMap);
    for (const statementId of statementIds) {
        const statementDescription = profilerEntriesDescription.statementMap[statementId];
        const totalGasCost = _.sum(
            _.map(subtrace, structLog => {
                const sourceRange = pcToSourceRange[structLog.pc];
                if (_.isUndefined(sourceRange)) {
                    return 0;
                }
                if (sourceRange.fileName !== absoluteFileName) {
                    return 0;
                }
                if (utils.isRangeInside(sourceRange.location, statementDescription)) {
                    return structLog.gasCost;
                } else {
                    return 0;
                }
            }),
        );
        gasConsumedByStatement[statementId] = totalGasCost;
    }
    const partialProfilerOutput = {
        [absoluteFileName]: {
            ...profilerEntriesDescription,
            path: absoluteFileName,
            f: {}, // I's meaningless in profiling context
            s: gasConsumedByStatement,
            b: {}, // I's meaningless in profiling context
        },
    };
    return partialProfilerOutput;
};
