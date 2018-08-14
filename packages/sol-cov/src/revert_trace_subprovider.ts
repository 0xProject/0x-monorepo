import { stripHexPrefix } from 'ethereumjs-util';
import * as _ from 'lodash';
import { getLogger, levels, Logger } from 'loglevel';

import { AbstractArtifactAdapter } from './artifact_adapters/abstract_artifact_adapter';
import { constants } from './constants';
import { getSourceRangeSnippet } from './get_source_range_snippet';
import { getRevertTrace } from './revert_trace';
import { parseSourceMap } from './source_maps';
import { TraceCollectionSubprovider } from './trace_collection_subprovider';
import { ContractData, EvmCallStack, SourceRange, SourceSnippet } from './types';
import { utils } from './utils';

/**
 * This class implements the [web3-provider-engine](https://github.com/MetaMask/provider-engine) subprovider interface.
 * It is used to report call stack traces whenever a revert occurs.
 */
export class RevertTraceSubprovider extends TraceCollectionSubprovider {
    // Lock is used to not accept normal transactions while doing call/snapshot magic because they'll be reverted later otherwise
    private _contractsData!: ContractData[];
    private readonly _artifactAdapter: AbstractArtifactAdapter;
    private readonly _logger: Logger;

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
        const sourceSnippets: SourceSnippet[] = [];
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
            while (_.isUndefined(sourceRange) && pc > 0) {
                sourceRange = pcToSourceRange[pc];
                pc -= 1;
            }
            if (_.isUndefined(sourceRange)) {
                this._logger.warn(
                    `could not find matching sourceRange for structLog: ${JSON.stringify(
                        _.omit(evmCallStackEntry.structLog, 'stack'),
                    )}`,
                );
                continue;
            }

            const fileIndex = contractData.sources.indexOf(sourceRange.fileName);
            const sourceSnippet = getSourceRangeSnippet(sourceRange, contractData.sourceCodes[fileIndex]);
            if (sourceSnippet !== null) {
                sourceSnippets.push(sourceSnippet);
            }
        }
        const filteredSnippets = filterSnippets(sourceSnippets);
        if (filteredSnippets.length > 0) {
            this._logger.error('\n\nStack trace for REVERT:\n');
            _.forEach(_.reverse(filteredSnippets), snippet => {
                const traceString = getStackTraceString(snippet);
                this._logger.error(traceString);
            });
            this._logger.error('\n');
        } else {
            this._logger.error('REVERT detected but could not determine stack trace');
        }
    }
}

// removes duplicates and if statements
function filterSnippets(sourceSnippets: SourceSnippet[]): SourceSnippet[] {
    if (sourceSnippets.length === 0) {
        return [];
    }
    const results: SourceSnippet[] = [sourceSnippets[0]];
    let prev = sourceSnippets[0];
    for (const sourceSnippet of sourceSnippets) {
        if (sourceSnippet.type === 'IfStatement') {
            continue;
        } else if (sourceSnippet.source === prev.source) {
            prev = sourceSnippet;
            continue;
        }
        results.push(sourceSnippet);
        prev = sourceSnippet;
    }
    return results;
}

function getStackTraceString(sourceSnippet: SourceSnippet): string {
    let result = `${sourceSnippet.fileName}:${sourceSnippet.range.start.line}:${sourceSnippet.range.start.column}`;
    const snippetString = getSourceSnippetString(sourceSnippet);
    if (snippetString !== '') {
        result += `:\n        ${snippetString}`;
    }
    return result;
}

function getSourceSnippetString(sourceSnippet: SourceSnippet): string {
    switch (sourceSnippet.type) {
        case 'ContractDefinition':
            return `contract ${sourceSnippet.name}`;
        case 'FunctionDefinition':
            return `function ${sourceSnippet.name}`;
        default:
            return `${sourceSnippet.source}`;
    }
}
