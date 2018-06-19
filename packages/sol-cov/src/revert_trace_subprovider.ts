import { stripHexPrefix } from 'ethereumjs-util';
import * as _ from 'lodash';
import { getLogger, levels, Logger } from 'loglevel';

import { AbstractArtifactAdapter } from './artifact_adapters/abstract_artifact_adapter';
import { constants } from './constants';
import { getRevertTrace } from './revert_trace';
import { parseSourceMap } from './source_maps';
import { TraceCollectionSubprovider } from './trace_collection_subprovider';
import { ContractData, EvmCallStack, SourceRange } from './types';
import { utils } from './utils';

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * It is used to report call stack traces whenever a revert occurs.
 */
export class RevertTraceSubprovider extends TraceCollectionSubprovider {
    // Lock is used to not accept normal transactions while doing call/snapshot magic because they'll be reverted later otherwise
    private _contractsData!: ContractData[];
    private _artifactAdapter: AbstractArtifactAdapter;
    private _logger: Logger;

    /**
     * Instantiates a RevertTraceSubprovider instance
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
        this._artifactAdapter = artifactAdapter;
        this._logger = getLogger('sol-cov');
        this._logger.setLevel(isVerbose ? levels.TRACE : levels.ERROR);
    }
    // tslint:disable-next-line:no-unused-variable
    protected async _recordTxTraceAsync(address: string, data: string | undefined, txHash: string): Promise<void> {
        await this._web3Wrapper.awaitTransactionMinedAsync(txHash, 0);
        const trace = await this._web3Wrapper.getTransactionTraceAsync(txHash, {
            disableMemory: true,
            disableStack: false,
            disableStorage: true,
        });
        const evmCallStack = getRevertTrace(trace.structLogs, address);
        if (evmCallStack.length > 0) {
            // if getRevertTrace returns a call stack it means there was a
            // revert.
            await this._printStackTraceAsync(evmCallStack);
        }
    }
    private async _printStackTraceAsync(evmCallStack: EvmCallStack): Promise<void> {
        const stackTraceStrings: string[] = [];
        if (_.isUndefined(this._contractsData)) {
            this._contractsData = await this._artifactAdapter.collectContractsDataAsync();
        }
        for (const evmCallStackEntry of evmCallStack) {
            const isContractCreation = evmCallStackEntry.address === constants.NEW_CONTRACT;
            if (isContractCreation) {
                this._logger.error('Contract creation not supported');
                continue;
            }
            const bytecode = await this._web3Wrapper.getContractCodeAsync(evmCallStackEntry.address);
            const contractData = utils.getContractDataIfExists(this._contractsData, bytecode);
            if (_.isUndefined(contractData)) {
                const errMsg = isContractCreation
                    ? `Unknown contract creation transaction`
                    : `Transaction to an unknown address: ${evmCallStackEntry.address}`;
                this._logger.warn(errMsg);
                continue;
            }
            const bytecodeHex = stripHexPrefix(bytecode);
            const sourceMap = isContractCreation ? contractData.sourceMap : contractData.sourceMapRuntime;
            const pcToSourceRange = parseSourceMap(
                contractData.sourceCodes,
                sourceMap,
                bytecodeHex,
                contractData.sources,
            );
            // tslint:disable-next-line:no-unnecessary-initializer
            let sourceRange: SourceRange | undefined = undefined;
            let pc = evmCallStackEntry.structLog.pc;
            // Sometimes there is not a mapping for this pc (e.g. if the revert
            // actually happens in assembly). In that case, we want to keep
            // searching backwards by decrementing the pc until we find a
            // mapped source range.
            while (_.isUndefined(sourceRange)) {
                sourceRange = pcToSourceRange[pc];
                pc -= 1;
                if (pc <= 0) {
                    this._logger.warn(
                        `could not find matching sourceRange for structLog: ${evmCallStackEntry.structLog}`,
                    );
                    continue;
                }
            }
            const fileIndex = contractData.sources.indexOf(sourceRange.fileName);
            stackTraceStrings.push(getStackTraceString(sourceRange, contractData.sourceCodes[fileIndex]));
        }
        const dedupedTraceStrings = filterDuplicateTraceStrings(stackTraceStrings);
        if (dedupedTraceStrings.length > 0) {
            this._logger.error('\n\nStack trace for REVERT:\n');
            _.forEach(_.reverse(dedupedTraceStrings), traceString => {
                this._logger.error(traceString);
            });
            this._logger.error('\n');
        } else {
            this._logger.error('Could not determine stack trace');
        }
    }
}

function filterDuplicateTraceStrings(traceStrings: string[]): string[] {
    if (traceStrings.length === 0) {
        return [];
    }
    const results: string[] = [traceStrings[0]];
    let prev = traceStrings[0];
    _.forEach(traceStrings, traceString => {
        if (traceString !== prev) {
            results.push(traceString);
        }
        prev = traceString;
    });
    return results;
}

function getStackTraceString(sourceRange: SourceRange, sourceCode: string): string {
    const sourceCodeInRange = utils.getRange(sourceCode, sourceRange.location);
    return `${sourceRange.fileName}:${sourceRange.location.start.line}:${sourceRange.location.start.column}: \n\t${
        sourceCodeInRange.split('\n')[0]
    }`;
}
