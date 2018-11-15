import * as S from 'solidity-parser-antlr';

import { argumentExpressions, identifier, nameParameters } from './utils';
import { visit, Visitor } from './visitor';

const getterName = (name: string) => `${name}Get`;
const setterName = (name: string) => `${name}Set`;
const publicName = (name: string) => `${name}Public`;
const logEmitterName = (name: string) => `${name}Emit`;
const modifierTestName = (name: string) => `${name}Test`;

// Creates a public getter for a state variable
const getter = (stateVar: S.StateVariableDeclaration): S.FunctionDefinition => {
    const [{ name, typeName }] = stateVar.variables;
    return {
        type: S.NodeType.FunctionDefinition,
        name: getterName(name),
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
        name: setterName(name),
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
    if (func.name === null) {
        throw new Error('Anonymous function.');
    }
    const params = nameParameters(func.parameters);
    const call: S.FunctionCall = {
        type: S.NodeType.FunctionCall,
        expression: identifier(func.name as string),
        arguments: argumentExpressions(params),
        names: [],
    };
    return {
        ...func,
        name: publicName(func.name),
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
        name: logEmitterName(name),
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
        name: modifierTestName(name),
        visibility: S.Visibility.Public,
        isConstructor: false,
        stateMutability: S.StateMutability.Default,
        parameters: Array.isArray(parameters)
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
                arguments: Array.isArray(parameters) ? [] : argumentExpressions(parameters),
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

const visitor: Visitor<S.ContractMember[]> = {
    StateVariableDeclaration: (node: S.StateVariableDeclaration) => {
        const [vardecl] = node.variables;
        if (vardecl.visibility !== 'internal') {
            return [];
        }
        if (vardecl.isDeclaredConst) {
            return [getter(node)];
        }
        return [getter(node), setter(node)];
        // TODO: handle mappings: The keys become additional
        // function arguments to the getter and setter.
    },

    EventDefinition: (node: S.EventDefinition) => [emitEvent(node)],

    ModifierDefinition: (node: S.ModifierDefinition) => [testModifier(node)],

    FunctionDefinition: (func: S.FunctionDefinition) =>
        func.visibility === S.Visibility.Internal ? [wrapFunction(func)] : [],

    ASTNode: (node: S.ASTNode) => [],
};

export const exposeNode = (node: S.ContractMember): S.ContractMember[] => visit(node, visitor);
