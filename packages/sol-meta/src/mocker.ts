import * as S from 'solidity-parser-antlr';
import * as utils from './utils';
import {identifier} from './utils';

const uint256: S.ElementaryTypeName = ({
    type: S.NodeType.ElementaryTypeName,
    name: 'uint256'
});

const zero: S.NumberLiteral = ({
    type: S.NodeType.NumberLiteral,
    number: '0',
    // TODO subdenomination: null
});

const id = (name:string): S.Identifier => ({
    type: S.NodeType.Identifier,
    name
});

const call = (func: S.Expression, ...args: S.Expression[]): S.FunctionCall => ({
    type: S.NodeType.FunctionCall,
    expression: func,
    arguments: args,
    names: []
});

const emit = (name: string, ...args: S.Expression[]): S.EmitStatement => ({
    type: S.NodeType.EmitStatement,
    eventCall: call(id(name), ...args)
});

const makeCounter = (name: string): S.StateVariableDeclaration => ({
    type: S.NodeType.StateVariableDeclaration,
    variables: [{
        type: S.NodeType.VariableDeclaration,
        typeName: uint256,
        name,
        expression: zero,
        visibility: S.Visibility.Internal,
        isStateVar: true,
        isDeclaredConst: false,
        isIndexed: false
    }],
    initialValue: zero,
});

const makeEvent = (name: string, parameters: S.ParameterList): S.EventDefinition => ({
    type: S.NodeType.EventDefinition,
    name,
    parameters,
    isAnonymous: false
});

const makeAction = (name: string, parameters: S.ParameterList): S.FunctionDefinition => ({
    type: S.NodeType.FunctionDefinition,
    name,
    parameters,
    returnParameters: null,
    body: {
        type: S.NodeType.Block,
        statements: [
            emit(
                name,
                id('dispatchTransferFrom_counter'),
                ...(parameters as any).parameters.map(({name}) => id(name))
            ),
            {
                type: S.NodeType.ExpressionStatement,
                expression: {
                    type: S.NodeType.UnaryOperation,
                    operator: '++',
                    subExpression: id('dispatchTransferFrom_counter'),
                    isPrefix: false
                }
            }
        ]
    },
    visibility: S.Visibility.Internal,
    modifiers: [],
    isConstructor: false,
    stateMutability: S.StateMutability.Default, 
});

const isDeclaration = (func: S.FunctionDefinition) => func.body == null;

const visitor = {
    
    default: (node) => node,
}

export function mock(ast: S.SourceUnit): S.SourceUnit {
    
    // TODO: gp down inheritance hierarchy and expose those events. etc as well
    // we probably want a separate `flattenInheritance` function or something
    // that traces the imports and does a fairly simple concatenation.
    return {
        type: S.NodeType.SourceUnit,
        children: [
            ...utils.pragmaNodes(ast),
            ...utils.importNodes(ast),
            ...utils.contracts(ast).map((ctr): S.ContractDefinition => ({
                type: S.NodeType.ContractDefinition,
                kind: S.ContractKind.Contract,
                name: `${ctr.name}Exposed`,
                baseContracts: [{
                    type: S.NodeType.InheritanceSpecifier,
                    baseName: {
                        type: S.NodeType.UserDefinedTypeName,
                        namePath: ctr.name,
                    }
                }],
                subNodes: utils.flatMap(ctr.subNodes, node =>
                    (visitor[node.type] || visitor.default)(node)
                ),
            }))
        ]
    }
}
