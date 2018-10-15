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

export const nameParameters = (params: S.ParameterList, prefix:string = '_arg'): S.ParameterList => ({
    ...params,
    parameters: params.parameters.map((param, i) => ({
        ...param,
        name: param.name || `${prefix}${i}`
    }))
})

export const argumentExpressions = (params: S.ParameterList): S.Expression[] => 
    params.parameters.map(({name}) => {
        // TODO: rewrite using throw expressions or do notation
        if (name !== null) {
            return identifier(name)
        } else {
            throw new Error("Anonymous parameter");
        }
    });
