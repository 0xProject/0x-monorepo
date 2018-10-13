import * as S from 'solidity-parser-antlr';
import * as utils from './utils';
import {identifier} from './utils';

// Creates a public getter for a state variable
const getter = (stateVar: S.StateVariableDeclaration): S.FunctionDefinition => {
    const [{name, typeName }] = (stateVar as any).variables;
    return {
        type: S.NodeType.FunctionDefinition,
        name: `get_${name}`,
        visibility: S.Visibility.Public,
        isConstructor: false,
        stateMutability: S.StateMutability.View,
        parameters: {
            type: S.NodeType.ParameterList,
            parameters: []
        },
        returnParameters: {
            type: S.NodeType.ParameterList,
            parameters: [{
                type: S.NodeType.Parameter,
                typeName,
                name: null,
                storageLocation: S.StorageLocation.Default,
            }]
        },
        modifiers: [],
        body: {
            type: S.NodeType.Block,
            statements: [{
                type: S.NodeType.ReturnStatement,
                expression: identifier(name)
            }]
        },
    };
}

// Creates a public getter for a state variable
const setter = (stateVar: S.StateVariableDeclaration): S.FunctionDefinition => {
    const [{name, typeName }] = (stateVar as any).variables;
    return {
        type: S.NodeType.FunctionDefinition,
        name: `set_${name}`,
        visibility: S.Visibility.Public,
        isConstructor: false,
        stateMutability: S.StateMutability.Default,
        parameters: {
            type: S.NodeType.ParameterList,
            parameters: [{
                type: S.NodeType.Parameter,
                typeName,
                name: 'setterNewValue',
                storageLocation: S.StorageLocation.Default,
            }],
        },
        returnParameters: null,
        modifiers: [],
        body: {
            type: S.NodeType.Block,
            statements: [{
                type: S.NodeType.ExpressionStatement,
                expression: {
                    type: S.NodeType.BinaryOperation,
                    operator: '=',
                    left: identifier(name),
                    right: identifier('setterNewValue')
                }
            }]
        },
    };
}

// Creates a public wrapper for a function
const wrapFunction = (func: S.FunctionDefinition): S.FunctionDefinition => {
    const call = {
        type: S.NodeType.FunctionCall,
        expression: identifier(func.name),
        arguments: (func as any).parameters.parameters.map(
            ({name}) => identifier(name)
        )
    };
    return {
        ...func,
        name: `public_${func.name}`,
        visibility: S.Visibility.Public,
        modifiers: [],
        body: {
            type: S.NodeType.Block,
            statements: [
                (func as any).returnParameters ?
                {
                    type: S.NodeType.ReturnStatement,
                    expression: call
                } :
                {
                    type: S.NodeType.ExpressionStatement,
                    expression: call
                }
            ]
        }
    };
}

// Creates a public function that triggers a log event
const emitEvent = (event: S.EventDefinition): S.FunctionDefinition => {
    const {name, parameters} = event as any;
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
                isIndexed: false
            }))
        },
        returnParameters: null,
        modifiers: [],
        body: {
            type: S.NodeType.Block,
            statements: [/* */ {
                type: S.NodeType.EmitStatement,
                eventCall: /*<S.FunctionCall>*/ {
                    type: S.NodeType.FunctionCall,
                    expression: identifier(name),
                    arguments: parameters.parameters.map(
                        ({name}) => identifier(name)
                    ),
                    names: []
                }
            }]
        },
    };
}

// Creates a public function that has modifier
const testModifier = (modifier: S.ModifierDefinition): S.FunctionDefinition => {
    const {name, parameters} = modifier as any;
    return {
        type: S.NodeType.FunctionDefinition,
        name: `modifier_${name}`,
        visibility: S.Visibility.Public,
        isConstructor: false,
        stateMutability: S.StateMutability.Default,
        parameters: Array.isArray(parameters) ?
            {
                type: S.NodeType.ParameterList,
                parameters: []
            } :
            parameters,
        returnParameters: {
            type: S.NodeType.ParameterList,
            parameters: [{
                type: S.NodeType.Parameter,
                typeName: {
                    type: S.NodeType.ElementaryTypeName,
                    name: 'bool'
                },
                name: 'executed',
                storageLocation: S.StorageLocation.Default
            }]
        },
        modifiers: [{
            type: S.NodeType.ModifierInvocation,
            name,
            arguments: Array.isArray(parameters) ?
                [] :
                parameters.parameters.map(
                    ({name}) => identifier(name)
                )
        }],
        body: {
            type: S.NodeType.Block,
            statements: [
                {
                    type: S.NodeType.ReturnStatement,
                    expression: {
                        type: S.NodeType.BooleanLiteral,
                        value: true,
                    }
                }
            ]
        },
    };
}

const exposeNode = (ast: S.ContractMember): S.ContractMember[] => {
    switch (ast.type) {
        default: {
            return [];
        }
        case 'StateVariableDeclaration': {
            const [vardecl] = (ast as any).variables;
            if (vardecl.visibility !== 'internal') {
                return [];
            }
            return [
                getter(ast as S.StateVariableDeclaration),
                setter(ast as S.StateVariableDeclaration)
            ];
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
            const func = ast as any;
            if (func.visibility !== 'internal') {
                return [];
            }
            return [wrapFunction(func)];
        }
    }
}

export function expose(filePath: string, ast: S.SourceUnit): S.SourceUnit {
    
    // TODO: gp down inheritance hierarchy and expose those events. etc as well
    // we probably want a separate `flattenInheritance` function or something
    // that traces the imports and does a fairly simple concatenation.
    
    return {
        type: S.NodeType.SourceUnit,
        children: [
            ...utils.pragmaNodes(ast), {
                type: S.NodeType.ImportDirective,
                path:  filePath,
                unitAliases: null,
                symbolAliases: null
            },
            ...utils.contracts(ast).map((ctr: any) => ({
                type: S.NodeType.ContractDefinition,
                kind: 'contract',
                name: `${ctr.name}Exposed`,
                baseContracts: [{
                    type: S.NodeType.InheritanceSpecifier,
                    baseName: {
                        namePath: ctr.name,
                    }
                }],
                subNodes: utils.flatMap(ctr.subNodes, exposeNode),
            }))
        ]
    }
}
