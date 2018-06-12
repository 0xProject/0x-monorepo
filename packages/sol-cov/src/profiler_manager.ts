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
    ContractData,
    Coverage,
    SingleFileSourceRange,
    SourceRange,
    Subtrace,
    TraceInfo,
    TraceInfoExistingContract,
    TraceInfoNewContract,
} from './types';
import { utils } from './utils';

const mkdirpAsync = promisify<undefined>(mkdirp);

/**
 * ProfilerManager is used by ProfilerSubprovider to profile code while running Solidity tests based on collected trace data.
 * HACK: It's almost the exact copy of CoverageManager but instead of reporting how much times was each statement executed - it reports - how expensive it was gaswise.
 */
export class ProfilerManager {
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
    }
    constructor(artifactAdapter: AbstractArtifactAdapter, isVerbose: boolean) {
        this._artifactAdapter = artifactAdapter;
        this._logger = getLogger('sol-cov');
        this._logger.setLevel(isVerbose ? levels.TRACE : levels.ERROR);
    }
    public async writeProfilerOutputAsync(): Promise<void> {
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
            const singleFileCoverageForTrace = ProfilerManager._getSingleFileCoverageForSubtrace(
                contractData,
                traceInfo.subtrace,
                pcToSourceRange,
                fileIndex,
            );
            this._collector.add(singleFileCoverageForTrace);
        }
    }
}
