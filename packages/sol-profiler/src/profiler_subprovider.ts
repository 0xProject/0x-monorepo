import {
    AbstractArtifactAdapter,
    collectCoverageEntries,
    ContractData,
    Coverage,
    SingleFileSubtraceHandler,
    SourceRange,
    Subtrace,
    SubTraceInfo,
    TraceCollector,
    TraceInfo,
    TraceInfoSubprovider,
    utils,
} from '@0x/sol-tracing-utils';
import { logUtils } from '@0x/utils';
import { stripHexPrefix } from 'ethereumjs-util';
import * as _ from 'lodash';

import { costUtils } from './cost_utils';

const CREATE_COST = 32000;
const BASE_COST = 21000;
const DEPLOYED_BYTE_COST = 200;

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
    protected async _handleSubTraceInfoAsync(subTraceInfo: SubTraceInfo): Promise<void> {
        await this._profilerCollector.computeSingleTraceCoverageAsync(subTraceInfo);
    }
    // tslint:disable prefer-function-over-method
    protected async _handleTraceInfoAsync(traceInfo: TraceInfo): Promise<void> {
        const receipt = await this._web3Wrapper.getTransactionReceiptIfExistsAsync(traceInfo.txHash);
        if (receipt === undefined) {
            return;
        }
        if (receipt.gasUsed === BASE_COST) {
            // Value transfer
            return;
        }
        logUtils.header(`Profiling data for ${traceInfo.txHash}`);
        const callDataCost = costUtils.reportCallDataCost(traceInfo);
        const memoryCost = costUtils.reportMemoryCost(traceInfo);
        const opcodesCost = costUtils.reportOpcodesCost(traceInfo);
        const dataCopyingCost = costUtils.reportCopyingCost(traceInfo);
        const newContractCost = CREATE_COST;
        const transactionBaseCost = BASE_COST;
        let totalCost = callDataCost + opcodesCost + BASE_COST;
        logUtils.header('Final breakdown', '-');
        if (_.isString(receipt.contractAddress)) {
            const code = await this._web3Wrapper.getContractCodeAsync(receipt.contractAddress);
            const codeBuff = Buffer.from(stripHexPrefix(code), 'hex');
            const codeLength = codeBuff.length;
            const contractSizeCost = codeLength * DEPLOYED_BYTE_COST;
            totalCost += contractSizeCost + CREATE_COST;
            logUtils.table({
                'totalCost = callDataCost + opcodesCost + transactionBaseCost + newContractCost + contractSizeCost': totalCost,
                callDataCost,
                'opcodesCost (including memoryCost and dataCopyingCost)': opcodesCost,
                memoryCost,
                dataCopyingCost,
                transactionBaseCost,
                contractSizeCost,
                newContractCost,
            });
        } else {
            logUtils.table({
                'totalCost = callDataCost + opcodesCost + transactionBaseCost': totalCost,
                callDataCost,
                'opcodesCost (including memoryCost and dataCopyingCost)': opcodesCost,
                memoryCost,
                dataCopyingCost,
                transactionBaseCost,
            });
        }
        const unknownGas = receipt.gasUsed - totalCost;
        if (unknownGas !== 0) {
            logUtils.warn(
                `Unable to find the cause for ${unknownGas} gas. It's most probably an issue in sol-profiler. Please report on Github.`,
            );
        }
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
    const statementToGasConsumed: { [statementId: string]: number } = {};
    const statementIds = _.keys(profilerEntriesDescription.statementMap);
    // `interestingStructLogs` are those that map back to source ranges within the current file.
    // It also doesn't include any that cannot be mapped back
    // This is a perf optimization reducing the work done in the loop over `statementIds`.
    // TODO(logvinov): Optimize the loop below.
    const interestingStructLogs = _.filter(subtrace, structLog => {
        const sourceRange = pcToSourceRange[structLog.pc];
        if (sourceRange === undefined) {
            return false;
        }
        return sourceRange.fileName === absoluteFileName;
    });
    for (const statementId of statementIds) {
        const statementDescription = profilerEntriesDescription.statementMap[statementId];
        const totalGasCost = _.sum(
            _.map(interestingStructLogs, structLog => {
                const sourceRange = pcToSourceRange[structLog.pc];
                if (utils.isRangeInside(sourceRange.location, statementDescription)) {
                    return structLog.gasCost;
                } else {
                    return 0;
                }
            }),
        );
        statementToGasConsumed[statementId] = totalGasCost;
    }
    const partialProfilerOutput = {
        [absoluteFileName]: {
            ...profilerEntriesDescription,
            path: absoluteFileName,
            f: {}, // I's meaningless in profiling context
            s: statementToGasConsumed,
            b: {}, // I's meaningless in profiling context
        },
    };
    return partialProfilerOutput;
};
