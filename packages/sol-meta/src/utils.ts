import * as S from 'solidity-parser-antlr';

// TODO: Replace with Array.flatMap https://tc39.github.io/proposal-flatMap/#sec-Array.prototype.flatMap
export const flatMap = (a, f) => [].concat(...a.map(f));

export const pragmaNodes = (ast: S.SourceUnit): S.PragmaDirective[] =>
    ast.children.filter(({type}) => type == S.NodeType.PragmaDirective);
    
export const importNodes = (ast: S.SourceUnit): S.PragmaDirective[] =>
    ast.children.filter(({type}) => type == S.NodeType.ImportDirective);

export const contracts = (ast: S.SourceUnit): S.ContractDefinition[] =>
    ast.children.filter(({type}) => type == S.NodeType.ContractDefinition);

export const identifier = (name: string): S.Identifier => ({
    type: S.NodeType.Identifier,
    name,
})
