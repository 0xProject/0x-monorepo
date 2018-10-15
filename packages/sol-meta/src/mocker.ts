import * as S from 'solidity-parser-antlr';
import * as utils from './utils';
import {identifier, nameParameters, argumentExpressions} from './utils';

// TODO: both Actions and Functions can throw in addition to returning

const uint256: S.ElementaryTypeName = ({
    type: S.NodeType.ElementaryTypeName,
    name: 'uint256'
});

const zero: S.NumberLiteral = ({
    type: S.NodeType.NumberLiteral,
    number: '0',
    subdenomination: null // TODO
});

const call = (func: S.Expression, ...args: S.Expression[]): S.FunctionCall => ({
    type: S.NodeType.FunctionCall,
    expression: func,
    arguments: args,
    names: []
});

const emit = (name: string, ...args: S.Expression[]): S.EmitStatement => ({
    type: S.NodeType.EmitStatement,
    eventCall: call(identifier(name), ...args)
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

const makeCountedEvent = (name: string, parameters: S.ParameterList) =>
    makeEvent(name, {
        ...parameters,
        parameters: [
        {
            type: S.NodeType.Parameter,
            name: 'counter',
            typeName: uint256,
            storageLocation: S.StorageLocation.Default
        },
        ...parameters.parameters.map(param => ({
            ...param,
            storageLocation: S.StorageLocation.Default
        }))]
    });

const makeIncrement = (name: string): S.ExpressionStatement => ({
    type: S.NodeType.ExpressionStatement,
    expression: {
        type: S.NodeType.UnaryOperation,
        operator: '++',
        subExpression: identifier(name),
        isPrefix: false
    }
})

const makeAction = (
    name: string,
    visibility: S.Visibility,
    counterName: string,
    eventName: string,
    parameters: S.ParameterList
): S.FunctionDefinition => ({
    type: S.NodeType.FunctionDefinition,
    name,
    parameters,
    returnParameters: null,
    body: {
        type: S.NodeType.Block,
        statements: [
            emit(eventName, identifier(counterName),
                ...argumentExpressions(parameters)),
            makeIncrement(counterName)
        ]
    },
    visibility: visibility,
    modifiers: [],
    isConstructor: false,
    stateMutability: S.StateMutability.Default, 
});

const variableDeclaration = (
    name: string,
    typeName: S.Type
): S.VariableDeclaration => ({
    type: S.NodeType.VariableDeclaration,
    name,
    typeName,
    storageLocation: S.StorageLocation.Default,
    isStateVar: false,
    isIndexed: false
})

const makeResultType = (name: string, fields: S.ParameterList): S.StructDefinition => ({
    type: S.NodeType.StructDefinition,
    name,
    members: fields.parameters.map(({name, typeName}) =>
        variableDeclaration(name as string, typeName)
    )
});

const userType = (name: string): S.UserDefinedTypeName => ({
    type: S.NodeType.UserDefinedTypeName,
    namePath: name
})

const mapping = (keyType: S.Type, valueType: S.Type): S.Type => ({
    type: S.NodeType.Mapping,
    keyType,
    valueType,
});

const makeStorageVariable = (
    name: string,
    type: S.Type
): S.StateVariableDeclaration => ({
    type: S.NodeType.StateVariableDeclaration,
    variables: [variableDeclaration(name, type)],
    initialValue: null
})

const makeSetter = (
    name: string,
    resultTypeName: string,
    resultMapName: string
): S.FunctionDefinition => ({
    type: S.NodeType.FunctionDefinition,
    name,
    parameters: {
        type: S.NodeType.ParameterList,
        parameters: [{
            type: S.NodeType.Parameter,
            name: '_counter',
            typeName: uint256,
            storageLocation: S.StorageLocation.Default,
            isStateVar: false,
            isIndexed: false
        }, {
            type: S.NodeType.Parameter,
            name: '_value',
            typeName: userType(resultTypeName),
            storageLocation: S.StorageLocation.Default,
            isStateVar: false,
            isIndexed: false
        }]
    },
    returnParameters: null,
    visibility: S.Visibility.Public,
    modifiers: [],
    isConstructor: false,
    stateMutability: S.StateMutability.Default,
    body: {
        type: S.NodeType.Block,
        statements: [{
            type: S.NodeType.ExpressionStatement,
            expression: {
                type: S.NodeType.BinaryOperation,
                operator: '=',
                left: {
                    type: S.NodeType.IndexAccess,
                    base: identifier(resultMapName),
                    index: identifier('_counter')
                },
                right: identifier('_value')
            }
        }]
    }
})

const makeFunction = (
    name: string,
    visibility: S.Visibility,
    counterName: string,
    eventName: string,
    resultTypeName: string,
    resultMapName: string,
    parameters: S.ParameterList,
    returnParameters: S.ParameterList
): S.FunctionDefinition => ({
    type: S.NodeType.FunctionDefinition,
    name,
    parameters,
    returnParameters,
    visibility: visibility,
    modifiers: [],
    isConstructor: false,
    stateMutability: S.StateMutability.Default,
    body: {
        type: S.NodeType.Block,
        statements: [
            emit(eventName, identifier(counterName),
                ...argumentExpressions(parameters)),
            {
                type: S.NodeType.VariableDeclarationStatement,
                variables: [{
                    ...variableDeclaration('result', userType(resultTypeName)),
                    storageLocation: S.StorageLocation.Storage,
                }],
                initialValue: {
                    type: S.NodeType.IndexAccess,
                    base: identifier(resultMapName),
                    index: identifier(counterName)
                }
            },
            makeIncrement(counterName),
            {
                type: S.NodeType.ReturnStatement,
                expression: {
                    type: S.NodeType.TupleExpression,
                    isArray: false,
                    components: returnParameters.parameters.map(
                        ({name}): S.MemberAccess => ({
                            type: S.NodeType.MemberAccess,
                            expression: identifier('result'),
                            memberName: name as string
                        })
                    )
                }
            }
        ]
    }
});

const mockAction = (func: S.FunctionDefinition): S.ContractMember[] => {
    const counterName = `_${func.name}_counter`;
    const eventName = `_${func.name}_log`;
    const params = nameParameters(func.parameters);
    return [
        makeCounter(counterName),
        makeCountedEvent(eventName, params),
        makeAction(func.name, func.visibility, counterName, eventName, params)
    ];
};

const mockFunction = (func: S.FunctionDefinition): S.ContractMember[] => {
    const counterName = `_${func.name}_counter`;
    const resultTypeName = `_${func.name}_Result`;
    const resultMapName = `_${func.name}_results`;
    const eventName = `_${func.name}_log`;
    const setterName = `_${func.name}_set`;
    const params = nameParameters(func.parameters);
    const returns = nameParameters(func.returnParameters as S.ParameterList,
        '_ret');
    return [
        makeCounter(counterName),
        makeCountedEvent(eventName, params),
        makeResultType(resultTypeName, returns),
        makeStorageVariable(resultMapName,
            mapping(uint256, userType(resultTypeName))),
        makeSetter(setterName, resultTypeName, resultMapName),
        makeFunction(func.name, func.visibility, counterName, eventName,
            resultTypeName, resultMapName, params, returns)
    ];
}

const isDeclaration = (func: S.FunctionDefinition) => func.body === null;

const hasReturns = (func: S.FunctionDefinition) => func.returnParameters !== null;

const visitor = {
    
    FunctionDefinition: (func) => 
        isDeclaration(func)
        ? (
            hasReturns(func)
            ? mockFunction(func)
            : mockAction(func)
        ) 
        : [],
    
    default: (node) => node,
}

const pragmaSolVersion: S.PragmaDirective = {
    type: S.NodeType.PragmaDirective,
    name: 'solidity',
    value: '^0.4.24'
};

const pragmaAbiV2: S.PragmaDirective = {
    type: S.NodeType.PragmaDirective,
    name: 'experimental',
    value: 'ABIEncoderV2'
};

const importDirective = (path: string): S.ImportDirective => ({
    type: S.NodeType.ImportDirective,
    path,
    symbolAliases: null
})

export function mock(ast: S.SourceUnit): S.SourceUnit {
    
    // TODO: gp down inheritance hierarchy and expose those events. etc as well
    // we probably want a separate `flattenInheritance` function or something
    // that traces the imports and does a fairly simple concatenation.
    return {
        type: S.NodeType.SourceUnit,
        children: [
            pragmaSolVersion,
            pragmaAbiV2,
            importDirective('interface.sol'),
            ...utils.contracts(ast).map((ctr) => ({
                type: S.NodeType.ContractDefinition,
                kind: S.ContractKind.Contract,
                name: `${ctr.name}Mock`,
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
