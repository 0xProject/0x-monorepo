import * as _ from 'lodash';
import * as S from 'solidity-parser-antlr';

import * as utils from './utils';
// Note(recmo): False positive, see https://github.com/palantir/tslint/issues/3418
// tslint:disable-next-line:no-duplicate-imports
import { argumentExpressions, identifier, nameParameters } from './utils';

// Todo rename to stubber.

// TODO: both Actions and Functions can throw in addition to returning. Throwing should take arbitrary data.

export const mockContractName = (contractName: string) => `${contractName}Mock`;
export const programmerName = (funcName: string) => `${funcName}Mock`;
export const logEventName = (funcName: string) => `${funcName}Called`;
export const errorNoMock = (funcName: string) => `Abstract function ${funcName} called`;
export const errorUnprogrammedInput = (funcName: string) => `Unprogrammed input for ${funcName}`;

const call = (func: S.Expression, ...args: S.Expression[]): S.FunctionCall => ({
    type: S.NodeType.FunctionCall,
    expression: func,
    arguments: args,
    names: [],
});

const emit = (name: string, ...args: S.Expression[]): S.EmitStatement => ({
    type: S.NodeType.EmitStatement,
    eventCall: call(identifier(name), ...args),
});

const makeCounter = (name: string): S.StateVariableDeclaration => ({
    type: S.NodeType.StateVariableDeclaration,
    variables: [
        {
            type: S.NodeType.VariableDeclaration,
            typeName: utils.types.uint256,
            name,
            expression: utils.litNumber(0),
            visibility: S.Visibility.Internal,
            isStateVar: true,
            isDeclaredConst: false,
            isIndexed: false,
        },
    ],
    initialValue: utils.litNumber(0),
});

const makeEvent = (name: string, parameters: S.ParameterList): S.EventDefinition => ({
    type: S.NodeType.EventDefinition,
    name,
    parameters,
    isAnonymous: false,
});

const makeCountedEvent = (name: string, parameters: S.ParameterList) =>
    makeEvent(name, {
        ...parameters,
        parameters: [
            {
                type: S.NodeType.Parameter,
                name: 'counter',
                typeName: utils.types.uint256,
                storageLocation: S.StorageLocation.Default,
            },
            ..._.map(parameters.parameters, param => ({
                ...param,
                storageLocation: S.StorageLocation.Default,
            })),
        ],
    });

const makeIncrement = (name: string): S.ExpressionStatement => ({
    type: S.NodeType.ExpressionStatement,
    expression: {
        type: S.NodeType.UnaryOperation,
        operator: '++',
        subExpression: identifier(name),
        isPrefix: false,
    },
});

const makeAction = (
    name: string,
    visibility: S.Visibility,
    stateMutability: S.StateMutability,
    counterName: string,
    eventName: string,
    parameters: S.ParameterList,
): S.FunctionDefinition => ({
    type: S.NodeType.FunctionDefinition,
    name,
    parameters,
    returnParameters: null,
    body: {
        type: S.NodeType.Block,
        statements: [
            emit(eventName, identifier(counterName), ...argumentExpressions(parameters)),
            makeIncrement(counterName),
        ],
    },
    visibility,
    modifiers: [],
    isConstructor: false,
    stateMutability,
});

const variableDeclaration = (name: string, typeName: S.Type): S.VariableDeclaration => ({
    type: S.NodeType.VariableDeclaration,
    name,
    typeName,
    storageLocation: S.StorageLocation.Default,
    isStateVar: false,
    isIndexed: false,
});

const makeResultType = (name: string, fields: S.ParameterList): S.StructDefinition => ({
    type: S.NodeType.StructDefinition,
    name,
    members: [
        variableDeclaration('_enabled', utils.types.bool),
        variableDeclaration('_reverts', utils.types.bool),
        ..._.map(fields.parameters, ({ name: memberName, typeName }) =>
            variableDeclaration(memberName as string, typeName),
        ),
    ],
});

const userType = (name: string): S.UserDefinedTypeName => ({
    type: S.NodeType.UserDefinedTypeName,
    namePath: name,
});

const mapping = (keyType: S.Type, valueType: S.Type): S.Type => ({
    type: S.NodeType.Mapping,
    keyType,
    valueType,
});

const makeStorageVariable = (name: string, type: S.Type): S.StateVariableDeclaration => ({
    type: S.NodeType.StateVariableDeclaration,
    variables: [variableDeclaration(name, type)],
    initialValue: null,
});

const makeSetter = (name: string, resultTypeName: string, resultMapName: string): S.FunctionDefinition => ({
    type: S.NodeType.FunctionDefinition,
    name,
    parameters: {
        type: S.NodeType.ParameterList,
        parameters: [
            {
                type: S.NodeType.Parameter,
                name: '_counter',
                typeName: utils.types.uint256,
                storageLocation: S.StorageLocation.Default,
                isStateVar: false,
                isIndexed: false,
            },
            {
                type: S.NodeType.Parameter,
                name: '_value',
                typeName: userType(resultTypeName),
                storageLocation: S.StorageLocation.Default,
                isStateVar: false,
                isIndexed: false,
            },
        ],
    },
    returnParameters: null,
    visibility: S.Visibility.Public,
    modifiers: [],
    isConstructor: false,
    stateMutability: S.StateMutability.Default,
    body: {
        type: S.NodeType.Block,
        statements: [
            {
                type: S.NodeType.ExpressionStatement,
                expression: {
                    type: S.NodeType.BinaryOperation,
                    operator: '=',
                    left: {
                        type: S.NodeType.IndexAccess,
                        base: identifier(resultMapName),
                        index: identifier('_counter'),
                    },
                    right: identifier('_value'),
                },
            },
        ],
    },
});

const makeFunction = (
    name: string,
    visibility: S.Visibility,
    stateMutability: S.StateMutability,
    counterName: string,
    eventName: string,
    resultTypeName: string,
    resultMapName: string,
    parameters: S.ParameterList,
    returnParameters: S.ParameterList,
): S.FunctionDefinition => ({
    type: S.NodeType.FunctionDefinition,
    name,
    parameters,
    returnParameters,
    visibility,
    stateMutability,
    modifiers: [],
    isConstructor: false,
    body: {
        type: S.NodeType.Block,
        statements: [
            emit(eventName, identifier(counterName), ...argumentExpressions(parameters)),
            {
                type: S.NodeType.VariableDeclarationStatement,
                variables: [
                    {
                        ...variableDeclaration('_result', userType(resultTypeName)),
                        storageLocation: S.StorageLocation.Storage,
                    },
                ],
                initialValue: {
                    type: S.NodeType.IndexAccess,
                    base: identifier(resultMapName),
                    index: identifier(counterName),
                },
            },
            makeIncrement(counterName),
            {
                type: S.NodeType.IfStatement,
                condition: {
                    type: S.NodeType.MemberAccess,
                    expression: identifier('_result'),
                    memberName: '_enabled',
                },
                falseBody: null,
                trueBody: {
                    type: S.NodeType.Block,
                    statements: [
                        {
                            type: S.NodeType.ExpressionStatement,
                            expression: call(identifier('require'), {
                                type: S.NodeType.UnaryOperation,
                                operator: '!',
                                isPrefix: true,
                                subExpression: {
                                    type: S.NodeType.MemberAccess,
                                    expression: identifier('_result'),
                                    memberName: '_reverts',
                                },
                            }),
                        },
                        {
                            type: S.NodeType.ReturnStatement,
                            expression: {
                                type: S.NodeType.TupleExpression,
                                isArray: false,
                                components: _.map(
                                    returnParameters.parameters,
                                    ({ name: memberName }): S.MemberAccess => ({
                                        type: S.NodeType.MemberAccess,
                                        expression: identifier('_result'),
                                        memberName: memberName as string,
                                    }),
                                ),
                            },
                        },
                    ],
                },
            },
            {
                type: S.NodeType.ExpressionStatement,
                expression: call(identifier('require'), utils.litFalse, utils.litString(errorUnprogrammedInput(name))),
            },
        ],
    },
});

export const stubThrow = (func: S.FunctionDefinition): S.ContractMember[] => {
    if (func.isConstructor || func.name === null) {
        throw new Error(`Function can not be mocked because it is a constructor.`);
    }
    return [
        {
            ...func,
            body: {
                type: S.NodeType.Block,
                statements: [
                    {
                        type: S.NodeType.ExpressionStatement,
                        expression: call(
                            identifier('require'),
                            utils.litFalse,
                            utils.litString(errorNoMock(func.name)),
                        ),
                    },
                ],
            },
        },
    ];
};

export const stubAction = (func: S.FunctionDefinition): S.ContractMember[] => {
    if (func.isConstructor || func.name === null) {
        throw new Error(`Function can not be mocked because it is a constructor.`);
    }
    if (func.stateMutability === S.StateMutability.Pure) {
        // Pure actions don't make sense, but check anyway
        throw new Error(`Function ${func.name} can not be mocked because it is pure.`);
    }

    const counterName = `_${func.name}_counter`;
    const eventName = `_${func.name}_log`;
    const params = nameParameters(func.parameters);
    return [
        makeCounter(counterName),
        makeCountedEvent(eventName, params),
        makeAction(func.name, func.visibility, func.stateMutability, counterName, eventName, params),
    ];
};

export const stubFunctionRuntime = (func: S.FunctionDefinition): S.ContractMember[] => {
    if (func.isConstructor || func.name === null) {
        throw new Error(`Constructors can not be stubbed.`);
    }
    if (func.stateMutability === S.StateMutability.Pure) {
        throw new Error(`Function ${func.name} can not be stubbed because it is pure.`);
    }

    const counterName = `_${func.name}_counter`;
    const resultTypeName = `_${func.name}_Result`;
    const resultMapName = `_${func.name}_results`;
    const eventName = logEventName(func.name);
    const setterName = programmerName(func.name);
    const params = nameParameters(func.parameters);
    const returns = nameParameters(func.returnParameters as S.ParameterList, '_ret');
    return [
        makeCounter(counterName),
        makeCountedEvent(eventName, params),
        makeResultType(resultTypeName, returns),
        makeStorageVariable(resultMapName, mapping(utils.types.uint256, userType(resultTypeName))),
        makeSetter(setterName, resultTypeName, resultMapName),
        makeFunction(
            func.name,
            func.visibility,
            func.stateMutability,
            counterName,
            eventName,
            resultTypeName,
            resultMapName,
            params,
            returns,
        ),
    ];
};

const isDeclaration = (func: S.FunctionDefinition) => func.body === null;

const hasReturns = (func: S.FunctionDefinition) => func.returnParameters !== null;

export const stubFunction = (func: S.FunctionDefinition): S.ContractMember[] => {
    if (!isDeclaration(func)) {
        throw new Error(`Can only stub abstract functions.`);
    }
    if (func.stateMutability === S.StateMutability.Pure) {
        return stubThrow(func);
    } else {
        if (hasReturns(func)) {
            return stubFunctionRuntime(func);
        } else {
            return stubAction(func);
        }
    }
};
