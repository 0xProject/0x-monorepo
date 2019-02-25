import {
    AbstractArtifactAdapter,
    collectCoverageEntries,
    constants,
    ContractData,
    Coverage,
    FunctionDescription,
    getOffsetToLocation,
    getSourceRangeSnippet,
    OffsetToLocation,
    parseSourceMap,
    SingleFileSourceRange, SingleFileSubtraceHandler, SourceRange,
    Subtrace, SubTraceInfo, SubTraceInfoExistingContract,
    SubTraceInfoNewContract,
    TraceCollector,
    TraceInfo,
    TraceInfoSubprovider,
    utils,
} from '@0x/sol-tracing-utils';
import { logUtils } from '@0x/utils';
import chalk from 'chalk';
import { stripHexPrefix } from 'ethereumjs-util';
import * as _ from 'lodash';
import * as path from 'path';
import * as parser from 'solidity-parser-antlr';

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
        const isContractCreation = subTraceInfo.address === constants.NEW_CONTRACT;
        const bytecode = isContractCreation
            ? (subTraceInfo as SubTraceInfoNewContract).bytecode
            : (subTraceInfo as SubTraceInfoExistingContract).runtimeBytecode;
        const contractData = await this._profilerCollector.getContractDataByTraceInfoIfExistsAsync(
            subTraceInfo.address,
            bytecode,
            isContractCreation,
        );
        if (_.isUndefined(contractData)) {
            return;
        }
        const bytecodeHex = stripHexPrefix(bytecode);
        const functionsLocationsByFileIndex = getFunctionsLocationsByFileIndex(contractData.sourceCodes);
        const sourceMap = isContractCreation ? contractData.sourceMap : contractData.sourceMapRuntime;
        const pcToSourceRange = parseSourceMap(contractData.sourceCodes, sourceMap, bytecodeHex, contractData.sources);
        const fileNameToFileIndex = _.invert(contractData.sources);
        let lastFunctionName: string = '_';
        const callStack: string[] = [];
        _.forEach(subTraceInfo.subtrace, structLog => {
            const sourceRange = pcToSourceRange[structLog.pc];
            const fileIndex = fileNameToFileIndex[sourceRange.fileName];
            const functionDescription = findFunctionDescription(functionsLocationsByFileIndex[fileIndex], sourceRange);
            const functionName = functionDescription.name;
            if (functionName !== lastFunctionName) {
                if (callStack.includes(functionName) && !functionName.includes('contract')) {
                    while (callStack.includes(functionName)) {
                        callStack.pop();
                    }
                    callStack.push(functionName);
                } else {
                    const isCall = callStack.length < 1;
                    const isReturn = !isCall && functionName === callStack[callStack.length - 1];
                    if (isReturn) {
                        callStack.pop();
                    } else {
                        callStack.push(functionName);
                    }

                }
                console.log(callStack.map(str => chalk.bold(str)).join(' - '));
            }
            lastFunctionName = functionName;
        });
        process.exit(0);
    }
    // tslint:disable prefer-function-over-method
    protected async _handleTraceInfoAsync(traceInfo: TraceInfo): Promise<void> {
        const receipt = await this._web3Wrapper.getTransactionReceiptIfExistsAsync(traceInfo.txHash);
        if (_.isUndefined(receipt)) {
            return;
        }
        if (receipt.gasUsed === BASE_COST) {
            // Value transfer
            return;
        }
        logUtils.header(`Profiling data for ${traceInfo.txHash}`);
        traceInfo.trace.structLogs = utils.normalizeStructLogs(traceInfo.trace.structLogs);
        const callDataCost = costUtils.reportCallDataCost(traceInfo);
        const memoryCost = costUtils.reportMemoryCost(traceInfo);
        const opcodesCost = costUtils.reportOpcodesCost(traceInfo);
        const dataCopyingCost = costUtils.reportCopyingCost(traceInfo);
        const newContractCost = CREATE_COST;
        const transactionBaseCost = BASE_COST;
        let totalCost = callDataCost + opcodesCost + BASE_COST;
        logUtils.header('Final breakdown', '-');
        if (!_.isNull(receipt.contractAddress)) {
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

// tslint:disable max-classes-per-file
class ASTVisitor {
    private _entryId = 0;
    private readonly _functions: FunctionDescription[] = [];
    private readonly _offsetToLocation: OffsetToLocation;
    constructor(offsetToLocation: OffsetToLocation) {
        this._offsetToLocation = offsetToLocation;
    }
    public getFunctionDescriptions(): FunctionDescription[] {
        return this._functions;
    }
    public FunctionDefinition(ast: parser.FunctionDefinition): void {
        this._visitFunctionLikeDefinition(ast);
    }
    public ContractDefinition(ast: parser.ContractDefinition): void {
        this._visitFunctionLikeDefinition({
            ...ast,
            name: `contract ${ast.name}`,
        });
    }
    public ModifierDefinition(ast: parser.ModifierDefinition): void {
        this._visitFunctionLikeDefinition(ast);
    }
    public AssemblyFunctionDefinition(ast: parser.AssemblyFunctionDefinition): void {
        this._visitFunctionLikeDefinition(ast);
    }
    private _getExpressionRange(ast: parser.ASTNode): SingleFileSourceRange {
        const astRange = ast.range as [number, number];
        const start = this._offsetToLocation[astRange[0]];
        const end = this._offsetToLocation[astRange[1] + 1];
        const range = {
            start,
            end,
        };
        return range;
    }
    private _visitFunctionLikeDefinition(ast: parser.ModifierDefinition | parser.FunctionDefinition | parser.AssemblyFunctionDefinition): void {
        const loc = this._getExpressionRange(ast);
        this._functions.push({
            name: (ast as any).name || 'no-name-function',
            line: loc.start.line,
            loc,
        });
    }
}

function collectFunctionDescriptions(sourceCode: string): FunctionDescription[] {
    const ast = parser.parse(sourceCode, { range: true });
    const offsetToLocation = getOffsetToLocation(sourceCode);
    const visitor = new ASTVisitor(offsetToLocation);
    parser.visit(ast, visitor);
    return visitor.getFunctionDescriptions();

}

function getFunctionsLocationsByFileIndex(sourceCodes: { [fileIndex: number]: string }): { [fileIndex: string]: FunctionDescription[] } {
    return _.mapValues(sourceCodes, sourceCode => collectFunctionDescriptions(sourceCode));
}

function findFunctionDescription(functionDescriptions: FunctionDescription[], sourceRange: SourceRange): FunctionDescription {
    const DEFAULT_FN_DESC = { name: path.basename(sourceRange.fileName), line: 0, loc: { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } } };
    const fnDescs = _.filter(functionDescriptions, fnDesc => utils.isRangeInside(sourceRange.location, fnDesc.loc));
    if (fnDescs.length === 0) {
        return DEFAULT_FN_DESC;
    } else {
        const sorted = _.sortBy(fnDescs, [(fnDesc: FunctionDescription) => fnDesc.loc.end.line - fnDesc.loc.start.line]);
        return sorted[0];
    }
}
