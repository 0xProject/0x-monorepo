import * as S from 'solidity-parser-antlr';
import * as utils from './utils';
import {identifier} from './utils';

// Creates a public getter for a state variable
const getter = (stateVar: S.StateVariableDeclaration): S.ASTNode => {
    const [{name, typeName }] = (stateVar as any).variables;
    return <S.FunctionDefinition> {
        type: 'FunctionDefinition',
        name: `get_${name}`,
        visibility: 'public',
        isConstructor: false,
        stateMutability: 'view',
        parameters: <S.ParameterList> {
            type: 'ParameterList',
            parameters: []
        },
        returnParameters: <S.ParameterList> {
            type: 'ParameterList',
            parameters: [
                <S.Parameter> {
                    type: 'Parameter',
                    typeName,
                    name: null
                }
            ]
        },
        modifiers: [],
        body: <S.Block> {
            type: 'Block',
            statements: [<S.ReturnStatement> {
                type: 'ReturnStatement',
                expression: identifier(name)
            }]
        },
    };
}

// Creates a public getter for a state variable
const setter = (stateVar: S.StateVariableDeclaration): S.ASTNode => {
    const [{name, typeName }] = (stateVar as any).variables;
    return <S.FunctionDefinition> {
        type: 'FunctionDefinition',
        name: `set_${name}`,
        visibility: 'public',
        isConstructor: false,
        stateMutability: '',
        parameters: <S.ParameterList> {
            type: 'ParameterList',
            parameters: [
                <S.Parameter> {
                    type: 'Parameter',
                    typeName,
                    name: 'setterNewValue'
                },
            ],
        },
        returnParameters: null,
        modifiers: [],
        body: <S.Block> {
            type: 'Block',
            statements: [<S.ExpressionStatement> {
                type: 'ExpressionStatement',
                expression: <S.BinaryOperation> {
                    type: 'BinaryOperation',
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
    const call = /*<S.FunctionCall>*/ <S.ASTNode> {
        type: 'FunctionCall',
        expression: identifier(func.name),
        arguments: (func as any).parameters.parameters.map(
            ({name}) => identifier(name)
        )
    };
    return <S.FunctionDefinition> {
        ...func,
        name: `public_${func.name}`,
        visibility: 'public',
        modifiers: [],
        body: <S.Block> {
            type: 'Block',
            statements: [
                (func as any).returnParameters ?
                <S.ReturnStatement> {
                    type: 'ReturnStatement',
                    expression: call
                } :
                <S.ExpressionStatement> {
                    type: 'ExpressionStatement',
                    expression: call
                }
            ]
        }
    };
}

// Creates a public function that triggers a log event
const emitEvent = (event: S.EventDefinition): S.FunctionDefinition => {
    const {name, parameters} = event as any;
    return <S.FunctionDefinition> {
        type: 'FunctionDefinition',
        name: `emit_${name}`,
        visibility: 'public',
        isConstructor: false,
        stateMutability: '',
        parameters: <S.ParameterList> {
            type: 'ParameterList',
            parameters: parameters.parameters.map(param => ({
                ...param,
                isIndexed: false
            }))
        },
        returnParameters: null,
        modifiers: [],
        body: <S.Block> {
            type: 'Block',
            statements: [/* <S.EmitStatement> */ <S.ASTNode> {
                type: 'EmitStatement',
                eventCall: /*<S.FunctionCall>*/ <S.ASTNode> {
                    type: 'FunctionCall',
                    expression: identifier(name),
                    arguments: parameters.parameters.map(
                        ({name}) => identifier(name)
                    )
                }
            }]
        },
    };
}

// Creates a public function that has modifier
const testModifier = (modifier: S.ModifierDefinition): S.FunctionDefinition => {
    const {name, parameters} = modifier as any;
    return <S.FunctionDefinition> {
        type: 'FunctionDefinition',
        name: `modifier_${name}`,
        visibility: 'public',
        isConstructor: false,
        stateMutability: '',
        parameters: Array.isArray(parameters) ?
            <S.ParameterList> {
                type: 'ParameterList',
                parameters: []
            } :
            parameters,
        returnParameters: <S.ParameterList> {
            type: 'ParameterList',
            parameters: [<S.Parameter> {
                type: 'Parameter',
                typeName: <S.ElementaryTypeName> {
                    type: 'ElementaryTypeName',
                    name: 'bool'
                },
                name: 'executed'
            }]
        },
        modifiers: [<S.ModifierInvocation> {
            type: 'ModifierInvocation',
            name,
            arguments: Array.isArray(parameters) ?
                [] :
                parameters.parameters.map(
                    ({name}) => identifier(name)
                )
        }],
        body: <S.Block> {
            type: 'Block',
            statements: [
                <S.ReturnStatement> {
                    type: 'ReturnStatement',
                    expression: /*<S.BooleanLiteral>*/ <S.ASTNode> {
                        type: 'BooleanLiteral',
                        value: true,
                    }
                }
            ]
        },
    };
}

const exposeNode = (ast: S.ASTNode): S.ASTNode[] => {
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
    
    return <S.SourceUnit> {
        type: 'SourceUnit',
        children: <S.ASTNode[]> [
            ...pragmaNodes(ast),
            <S.ImportDirective> {
                type: 'ImportDirective',
                path:  filePath,
                unitAliases: null,
                symbolAliases: null
            },
            ...contracts(ast).map((ctr: any) => (<S.ContractDefinition> {
                type: 'ContractDefinition',
                kind: 'contract',
                name: `${ctr.name}Exposed`,
                baseContracts: [<S.InheritanceSpecifier> {
                    type: 'InheritanceSpecifier',
                    baseName: {
                        namePath: ctr.name,
                    }
                }],
                subNodes: flatMap(ctr.subNodes, exposeNode),
            }))
        ]
    }
}
