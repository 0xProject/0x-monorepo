import * as fs from 'fs';
import { Collector } from 'istanbul';
import * as _ from 'lodash';
import * as path from 'path';

import { collectContractsData } from './collect_contract_data';
import { constants } from './constants';
import { collectCoverageEntries } from './instrument_solidity';
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

function getSingleFileCoverageForTrace(
    contractData: ContractData,
    coveredPcs: number[],
    pcToSourceRange: { [programCounter: number]: SourceRange },
    fileIndex: number,
): Coverage {
    const fileName = contractData.sources[fileIndex];
    const coverageEntriesDescription = collectCoverageEntries(contractData.sourceCodes[fileIndex], fileName);
    let sourceRanges = _.map(coveredPcs, coveredPc => pcToSourceRange[coveredPc]);
    sourceRanges = _.compact(sourceRanges); // Some PC's don't map to a source range and we just ignore them.
    sourceRanges = _.uniqBy(sourceRanges, s => JSON.stringify(s)); // We don't care if one PC was covered multiple times within a single transaction
    sourceRanges = _.filter(sourceRanges, sourceRange => sourceRange.fileName === fileName);
    const branchCoverage: BranchCoverage = {};
    for (const branchId of _.keys(coverageEntriesDescription.branchMap)) {
        const branchDescription = coverageEntriesDescription.branchMap[branchId];
        const isCovered = _.map(branchDescription.locations, location =>
            _.some(sourceRanges, range => utils.isRangeInside(range.location, location)),
        );
        branchCoverage[branchId] = isCovered;
    }
    const statementCoverage: StatementCoverage = {};
    for (const statementId of _.keys(coverageEntriesDescription.statementMap)) {
        const statementDescription = coverageEntriesDescription.statementMap[statementId];
        const isCovered = _.some(sourceRanges, range => utils.isRangeInside(range.location, statementDescription));
        statementCoverage[statementId] = isCovered;
    }
    const functionCoverage: FunctionCoverage = {};
    for (const fnId of _.keys(coverageEntriesDescription.fnMap)) {
        const functionDescription = coverageEntriesDescription.fnMap[fnId];
        const isCovered = _.some(sourceRanges, range => utils.isRangeInside(range.location, functionDescription.loc));
        functionCoverage[fnId] = isCovered;
    }
    const partialCoverage = {
        [contractData.sources[fileIndex]]: {
            ...coverageEntriesDescription,
            l: {}, // It's able to derive it from statement coverage
            path: fileName,
            f: functionCoverage,
            s: statementCoverage,
            b: branchCoverage,
        },
    };
    return partialCoverage;
}

export class CoverageManager {
    private _traceInfos: TraceInfo[] = [];
    private _contractsData: ContractData[] = [];
    private _getContractCodeAsync: (address: string) => Promise<string>;
    constructor(
        artifactsPath: string,
        sourcesPath: string,
        networkId: number,
        getContractCodeAsync: (address: string) => Promise<string>,
    ) {
        this._getContractCodeAsync = getContractCodeAsync;
        this._contractsData = collectContractsData(artifactsPath, sourcesPath, networkId);
    }
    public appendTraceInfo(traceInfo: TraceInfo): void {
        this._traceInfos.push(traceInfo);
    }
    public async writeCoverageAsync(): Promise<void> {
        const finalCoverage = await this._computeCoverageAsync();
        const jsonReplacer: null = null;
        const numberOfJsonSpaces = 4;
        const stringifiedCoverage = JSON.stringify(finalCoverage, jsonReplacer, numberOfJsonSpaces);
        fs.writeFileSync('coverage/coverage.json', stringifiedCoverage);
    }
    private async _computeCoverageAsync(): Promise<Coverage> {
        const collector = new Collector();
        for (const traceInfo of this._traceInfos) {
            if (traceInfo.address !== constants.NEW_CONTRACT) {
                // Runtime transaction
                const runtimeBytecode = (traceInfo as TraceInfoExistingContract).runtimeBytecode;
                const contractData = _.find(this._contractsData, { runtimeBytecode }) as ContractData;
                if (_.isUndefined(contractData)) {
                    throw new Error(`Transaction to an unknown address: ${traceInfo.address}`);
                }
                const bytecodeHex = contractData.runtimeBytecode.slice(2);
                const sourceMap = contractData.sourceMapRuntime;
                const pcToSourceRange = parseSourceMap(
                    contractData.sourceCodes,
                    sourceMap,
                    bytecodeHex,
                    contractData.sources,
                );
                for (let fileIndex = 0; fileIndex < contractData.sources.length; fileIndex++) {
                    const singleFileCoverageForTrace = getSingleFileCoverageForTrace(
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
                const contractData = _.find(this._contractsData, contractDataCandidate =>
                    bytecode.startsWith(contractDataCandidate.bytecode),
                ) as ContractData;
                if (_.isUndefined(contractData)) {
                    throw new Error(`Unknown contract creation transaction`);
                }
                const bytecodeHex = contractData.bytecode.slice(2);
                const sourceMap = contractData.sourceMap;
                const pcToSourceRange = parseSourceMap(
                    contractData.sourceCodes,
                    sourceMap,
                    bytecodeHex,
                    contractData.sources,
                );
                for (let fileIndex = 0; fileIndex < contractData.sources.length; fileIndex++) {
                    const singleFileCoverageForTrace = getSingleFileCoverageForTrace(
                        contractData,
                        traceInfo.coveredPcs,
                        pcToSourceRange,
                        fileIndex,
                    );
                    collector.add(singleFileCoverageForTrace);
                }
            }
        }
        // TODO: Submit a PR to DT
        return (collector as any).getFinalCoverage();
    }
}
