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
    [lineNo: number]: boolean;
}

export interface FunctionCoverage {
    [functionId: string]: boolean;
}

export interface StatementCoverage {
    [statementId: string]: boolean;
}

export interface BranchCoverage {
    [branchId: string]: boolean[];
}

export interface Coverage {
    [fineName: string]: {
        l: LineCoverage;
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

export interface TraceInfoBase {
    coveredPcs: number[];
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
