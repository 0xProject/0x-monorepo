import { promisify } from '@0x/utils';
import chalk from 'chalk';
import { stripHexPrefix } from 'ethereumjs-util';
import * as fs from 'fs';
import { Collector } from 'istanbul';
import * as _ from 'lodash';
import { getLogger, levels, Logger } from 'loglevel';
import * as mkdirp from 'mkdirp';

import { AbstractArtifactAdapter } from './artifact_adapters/abstract_artifact_adapter';
import { constants } from './constants';
import { parseSourceMap } from './source_maps';
import {
    ContractData,
    Coverage,
    SourceRange,
    Subtrace,
    SubTraceInfo,
    SubTraceInfoExistingContract,
    SubTraceInfoNewContract,
} from './types';
import { utils } from './utils';

const mkdirpAsync = promisify<undefined>(mkdirp);

export type SingleFileSubtraceHandler = (
    contractData: ContractData,
    subtrace: Subtrace,
    pcToSourceRange: { [programCounter: number]: SourceRange },
    fileIndex: number,
) => Coverage;

/**
 * TraceCollector is used by CoverageSubprovider to compute code coverage based on collected trace data.
 */
export class TraceCollector {
    private readonly _artifactAdapter: AbstractArtifactAdapter;
    private readonly _logger: Logger;
    private _contractsData!: ContractData[];
    private readonly _collector = new Collector();
    private readonly _singleFileSubtraceHandler: SingleFileSubtraceHandler;

    /**
     * Instantiates a TraceCollector instance
     * @param artifactAdapter Adapter for used artifacts format (0x, truffle, giveth, etc.)
     * @param isVerbose If true, we will log any unknown transactions. Otherwise we will ignore them
     * @param singleFileSubtraceHandler A handler function for computing partial coverage for a single file & subtrace
     */
    constructor(
        artifactAdapter: AbstractArtifactAdapter,
        isVerbose: boolean,
        singleFileSubtraceHandler: SingleFileSubtraceHandler,
    ) {
        this._artifactAdapter = artifactAdapter;
        this._logger = getLogger('sol-tracing-utils');
        this._logger.setLevel(isVerbose ? levels.TRACE : levels.ERROR);
        this._singleFileSubtraceHandler = singleFileSubtraceHandler;
    }
    public async writeOutputAsync(): Promise<void> {
        const finalCoverage: Coverage = this._collector.getFinalCoverage();
        const stringifiedCoverage = JSON.stringify(finalCoverage, null, '\t');
        await mkdirpAsync('coverage');
        fs.writeFileSync('coverage/coverage.json', stringifiedCoverage);
    }
    public async getContractDataByTraceInfoIfExistsAsync(
        address: string,
        bytecode: string,
        isContractCreation: boolean,
    ): Promise<ContractData | undefined> {
        if (this._contractsData === undefined) {
            this._contractsData = await this._artifactAdapter.collectContractsDataAsync();
        }
        const contractData = utils.getContractDataIfExists(this._contractsData, bytecode);
        if (contractData === undefined) {
            /**
             * Length chooses so that both error messages are of the same length
             * and it's enough data to figure out which artifact has a problem.
             */
            const HEX_LENGTH = 16;
            const errMsg = isContractCreation
                ? `Unable to find matching bytecode for contract creation ${chalk.bold(
                      utils.shortenHex(bytecode, HEX_LENGTH),
                  )}, please check your artifacts. Ignoring...`
                : `Unable to find matching bytecode for contract address ${chalk.bold(
                      address,
                  )}, please check your artifacts. Ignoring...`;
            this._logger.warn(errMsg);
        }
        return contractData;
    }
    public async computeSingleTraceCoverageAsync(subTraceInfo: SubTraceInfo): Promise<void> {
        const isContractCreation = subTraceInfo.address === constants.NEW_CONTRACT;
        const bytecode = isContractCreation
            ? (subTraceInfo as SubTraceInfoNewContract).bytecode
            : (subTraceInfo as SubTraceInfoExistingContract).runtimeBytecode;
        const contractData = await this.getContractDataByTraceInfoIfExistsAsync(
            subTraceInfo.address,
            bytecode,
            isContractCreation,
        );
        if (contractData === undefined) {
            return;
        }
        const bytecodeHex = stripHexPrefix(bytecode);
        const sourceMap = isContractCreation ? contractData.sourceMap : contractData.sourceMapRuntime;
        const pcToSourceRange = parseSourceMap(contractData.sourceCodes, sourceMap, bytecodeHex, contractData.sources);
        _.map(contractData.sources, (_sourcePath: string, fileIndex: string) => {
            const singleFileCoverageForTrace = this._singleFileSubtraceHandler(
                contractData,
                subTraceInfo.subtrace,
                pcToSourceRange,
                _.parseInt(fileIndex),
            );
            this._collector.add(singleFileCoverageForTrace);
        });
    }
}
