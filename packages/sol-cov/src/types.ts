import { StructLog } from 'ethereum-types';
import * as Parser from 'solidity-parser-antlr';

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

export interface LocationByOffset {
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

export interface ContractData {
    bytecode: string;
    sourceMap: string;
    runtimeBytecode: string;
    sourceMapRuntime: string;
    sourceCodes: string[];
    sources: string[];
}

// Part of the trace executed within the same context
export type Subtrace = StructLog[];

export interface TraceInfoBase {
    subtrace: Subtrace;
    txHash: string;
}

export interface TraceInfoNewContract extends TraceInfoBase {
    address: 'NEW_CONTRACT';
    bytecode: string;
}

export interface TraceInfoExistingContract extends TraceInfoBase {
    address: string;
    runtimeBytecode: string;
}

export type TraceInfo = TraceInfoNewContract | TraceInfoExistingContract;

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
    type: string;
    node: Parser.ASTNode;
    name: string | null;
    range: SingleFileSourceRange;
}
