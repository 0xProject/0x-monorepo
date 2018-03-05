// tslint:disable:completed-docs
declare module 'solidity-parser-sc' {
    // This is too time-consuming to define and we don't rely on it anyway
    export type AST = any;
    export function parse(sourceCode: string): AST;
}
