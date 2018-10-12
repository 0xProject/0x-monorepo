import * as S from 'solidity-parser-antlr';

// TODO: Replace with Array.flatMap https://tc39.github.io/proposal-flatMap/#sec-Array.prototype.flatMap
export const flatMap = (a, f) => [].concat(...a.map(f));

export const pragmaNodes = (ast: S.SourceUnit): S.PragmaDirective[] =>
    (ast as any).children.filter(({type}) => type == 'PragmaDirective');
    
export const importNodes = (ast: S.SourceUnit): S.PragmaDirective[] =>
    (ast as any).children.filter(({type}) => type == 'ImportDirective');

export const contracts = (ast: S.SourceUnit): S.ContractDefinition[] =>
    (ast as any).children.filter(({type}) => type == 'ContractDefinition');

export const identifier = (name: string): S.ASTNode =>
    (<S.Identifier> {
        type: 'Identifier',
        name,
    })
