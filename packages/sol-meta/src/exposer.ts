import * as S from 'solidity-parser-antlr';
import * as utils from './utils';
import { identifier, nameParameters, argumentExpressions } from './utils';

// Creates a public getter for a state variable
const getter = (stateVar: S.StateVariableDeclaration): S.FunctionDefinition => {
    const [{ name, typeName }] = stateVar.variables;
    return {
        type: S.NodeType.FunctionDefinition,
        name: `get_${name}`,
        visibility: S.Visibility.Public,
        isConstructor: false,
        stateMutability: S.StateMutability.View,
        parameters: {
            type: S.NodeType.ParameterList,
            parameters: [],
        },
        returnParameters: {
            type: S.NodeType.ParameterList,
            parameters: [
                {
                    type: S.NodeType.Parameter,
                    typeName,
                    name: null,
                    storageLocation: S.StorageLocation.Default,
                },
            ],
        },
        modifiers: [],
        body: {
            type: S.NodeType.Block,
            statements: [
                {
                    type: S.NodeType.ReturnStatement,
                    expression: identifier(name),
                },
            ],
        },
    };
};

// Creates a public getter for a state variable
const setter = (stateVar: S.StateVariableDeclaration): S.FunctionDefinition => {
    const [{ name, typeName }] = stateVar.variables;
    return {
        type: S.NodeType.FunctionDefinition,
        name: `set_${name}`,
        visibility: S.Visibility.Public,
        isConstructor: false,
        stateMutability: S.StateMutability.Default,
        parameters: {
            type: S.NodeType.ParameterList,
            parameters: [
                {
                    type: S.NodeType.Parameter,
                    typeName,
                    name: 'setterNewValue',
                    storageLocation: S.StorageLocation.Default,
                },
            ],
        },
        returnParameters: null,
        modifiers: [],
        body: {
            type: S.NodeType.Block,
            statements: [
                {
                    type: S.NodeType.ExpressionStatement,
                    expression: {
                        type: S.NodeType.BinaryOperation,
                        operator: '=',
                        left: identifier(name),
                        right: identifier('setterNewValue'),
                    },
                },
            ],
        },
    };
};

// Creates a public wrapper for a function
const wrapFunction = (func: S.FunctionDefinition): S.FunctionDefinition => {
    const params = nameParameters(func.parameters);
    const call: S.FunctionCall = {
        type: S.NodeType.FunctionCall,
        expression: identifier(func.name),
        arguments: argumentExpressions(params),
        names: [],
    };
    return {
        ...func,
        name: `public_${func.name}`,
        visibility: S.Visibility.Public,
        parameters: params,
        modifiers: [],
        body: {
            type: S.NodeType.Block,
            statements: [
                func.returnParameters
                    ? {
                          type: S.NodeType.ReturnStatement,
                          expression: call,
                      }
                    : {
                          type: S.NodeType.ExpressionStatement,
                          expression: call,
                      },
            ],
        },
    };
};

// Creates a public function that triggers a log event
const emitEvent = (event: S.EventDefinition): S.FunctionDefinition => {
    const { name, parameters } = event;
    return {
        type: S.NodeType.FunctionDefinition,
        name: `emit_${name}`,
        visibility: S.Visibility.Public,
        isConstructor: false,
        stateMutability: S.StateMutability.Default,
        parameters: {
            type: S.NodeType.ParameterList,
            parameters: parameters.parameters.map(param => ({
                ...param,
                isIndexed: false,
            })),
        },
        returnParameters: null,
        modifiers: [],
        body: {
            type: S.NodeType.Block,
            statements: [
                {
                    type: S.NodeType.EmitStatement,
                    eventCall: {
                        type: S.NodeType.FunctionCall,
                        expression: identifier(name),
                        arguments: argumentExpressions(parameters),
                        names: [],
                    },
                },
            ],
        },
    };
};

// Creates a public function that has modifier
const testModifier = (modifier: S.ModifierDefinition): S.FunctionDefinition => {
    const { name, parameters } = modifier;
    return {
        type: S.NodeType.FunctionDefinition,
        name: `modifier_${name}`,
        visibility: S.Visibility.Public,
        isConstructor: false,
        stateMutability: S.StateMutability.Default,
        parameters:
            parameters === null
                ? {
                      type: S.NodeType.ParameterList,
                      parameters: [],
                  }
                : parameters,
        returnParameters: {
            type: S.NodeType.ParameterList,
            parameters: [
                {
                    type: S.NodeType.Parameter,
                    typeName: {
                        type: S.NodeType.ElementaryTypeName,
                        name: 'bool',
                    },
                    name: 'executed',
                    storageLocation: S.StorageLocation.Default,
                },
            ],
        },
        modifiers: [
            {
                type: S.NodeType.ModifierInvocation,
                name,
                arguments: Array.isArray(parameters) ? argumentExpressions(parameters) : [],
            },
        ],
        body: {
            type: S.NodeType.Block,
            statements: [
                {
                    type: S.NodeType.ReturnStatement,
                    expression: {
                        type: S.NodeType.BooleanLiteral,
                        value: true,
                    },
                },
            ],
        },
    };
};

const exposeNode = (ast: S.ContractMember): S.ContractMember[] => {
    switch (ast.type) {
        default: {
            return [];
        }
        case 'StateVariableDeclaration': {
            const [vardecl] = ast.variables;
            if (vardecl.visibility !== 'internal') {
                return [];
            }
            return [getter(ast as S.StateVariableDeclaration), setter(ast as S.StateVariableDeclaration)];
            // TODO: handle mappings: The keys become additional
            // function arguments to the getter and setter.
        }
        case 'EventDefinition': {
            return [emitEvent(ast)];
        }
        case 'ModifierDefinition': {
            return [testModifier(ast as S.ModifierDefinition)];
        }
        case 'FunctionDefinition': {
            const func = ast;
            if (func.visibility !== 'internal') {
                return [];
            }
            return [wrapFunction(func)];
        }
    }
};

export function expose(filePath: string, ast: S.SourceUnit): S.SourceUnit {
    // TODO: gp down inheritance hierarchy and expose those events. etc as well
    // we probably want a separate `flattenInheritance` function or something
    // that traces the imports and does a fairly simple concatenation.

    return {
        type: S.NodeType.SourceUnit,
        children: [
            ...utils.pragmaNodes(ast),
            {
                type: S.NodeType.ImportDirective,
                path: filePath,
                unitAliases: null,
                symbolAliases: null,
            },
            ...utils.contracts(ast).map(ctr => ({
                type: S.NodeType.ContractDefinition,
                kind: 'contract',
                name: `${ctr.name}Exposed`,
                baseContracts: [
                    {
                        type: S.NodeType.InheritanceSpecifier,
                        baseName: {
                            namePath: ctr.name,
                        },
                    },
                ],
                subNodes: utils.flatMap(ctr.subNodes, exposeNode),
            })),
        ],
    };
}
