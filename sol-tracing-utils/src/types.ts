import { StructLog, TransactionTrace } from 'ethereum-types';

export interface LineColumn {
    line: number;
    column: number;
}

export interface SourceRange {
    location: SingleFileSourceRange;
    fileName: string;
}

export interface SingleFileSourceRange {
    start: LineColumn;
    end: LineColumn;
}

export interface OffsetToLocation {
    [offset: number]: LineColumn;
}

export interface FunctionDescription {
    name: string;
    line: number;
    loc: SingleFileSourceRange;
    skip?: boolean;
}

export type StatementDescription = SingleFileSourceRange;

export interface BranchDescription {
    line: number;
    type: 'if' | 'switch' | 'cond-expr' | 'binary-expr';
    locations: SingleFileSourceRange[];
}

export interface FnMap {
    [functionId: string]: FunctionDescription;
}

export interface BranchMap {
    [branchId: string]: BranchDescription;
}

export interface StatementMap {
    [statementId: string]: StatementDescription;
}

export interface LineCoverage {
    [lineNo: number]: number;
}

export interface FunctionCoverage {
    [functionId: string]: number;
}

export interface StatementCoverage {
    [statementId: string]: number;
}

export interface BranchCoverage {
    [branchId: string]: number[];
}

export interface Coverage {
    [fineName: string]: {
        l?: LineCoverage;
        f: FunctionCoverage;
        s: StatementCoverage;
        b: BranchCoverage;
        fnMap: FnMap;
        branchMap: BranchMap;
        statementMap: StatementMap;
        path: string;
    };
}

export interface SourceCodes {
    [sourceId: number]: string;
}
export interface Sources {
    [sourceId: number]: string;
}

export interface ContractData {
    name: string;
    bytecode: string;
    sourceMap: string;
    runtimeBytecode: string;
    sourceMapRuntime: string;
    sourceCodes: SourceCodes;
    sources: Sources;
}

// Part of the trace executed within the same context
export type Subtrace = StructLog[];

export interface SubTraceInfoBase {
    subtrace: Subtrace;
    txHash: string;
    subcallDepth: number;
}

export interface SubTraceInfoNewContract extends SubTraceInfoBase {
    address: 'NEW_CONTRACT';
    bytecode: string;
}

export interface SubTraceInfoExistingContract extends SubTraceInfoBase {
    address: string;
    runtimeBytecode: string;
}

export type SubTraceInfo = SubTraceInfoNewContract | SubTraceInfoExistingContract;

export interface TraceInfo {
    trace: TransactionTrace;
    txHash: string;
    address: string;
    dataIfExists: string | undefined;
}

export enum BlockParamLiteral {
    Latest = 'latest',
}

export interface EvmCallStackEntry {
    structLog: StructLog;
    address: string;
}

export type EvmCallStack = EvmCallStackEntry[];

export interface SourceSnippet {
    source: string;
    fileName: string;
    range: SingleFileSourceRange;
}

export interface OpCodeToParamToStackOffset {
    [opCode: string]: {
        [param: string]: number;
    };
}

export interface OpCodeToGasCost {
    [opCode: string]: number;
}
