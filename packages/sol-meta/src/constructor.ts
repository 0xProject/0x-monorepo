import * as S from 'solidity-parser-antlr';

import * as utils from './utils';

export interface ConstructorArguments {
    [contractName: string]: utils.Litteral[];
}

export function makeConstructor(consArgs: ConstructorArguments): S.FunctionDefinition {
    // TODO: Only include actually used constructors.
    return {
        type: S.NodeType.FunctionDefinition,
        name: null,
        parameters: {
            type: S.NodeType.ParameterList,
            parameters: [],
        },
        returnParameters: null,
        visibility: S.Visibility.Public,
        stateMutability: S.StateMutability.Default,
        modifiers: Object.keys(consArgs).map<S.ModifierInvocation>(name => ({
            type: S.NodeType.ModifierInvocation,
            name,
            arguments: consArgs[name].map(utils.litteral),
        })),
        isConstructor: true,
        body: {
            type: S.NodeType.Block,
            statements: [],
        },
    };
}

// Solidity by itself does not give an error when a contract is unintentionally
// abstract. We can force Solidity to produce an error and point us to the
// abstract function by trying to runtime instantiate the contract. This function
// produces a small contract that tries to instantiate the given contract.
export function nonAbstractForcer(contractName: string): S.ContractDefinition {
    // contract SomeContractNonAbstractForcer {
    //     constructor() {
    //         new SomeContract();
    //     }
    // }
    return {
        type: S.NodeType.ContractDefinition,
        kind: S.ContractKind.Contract,
        name: `${contractName}NonAbstractForcer`,
        baseContracts: [],
        subNodes: [
            {
                type: S.NodeType.FunctionDefinition,
                name: null,
                parameters: {
                    type: S.NodeType.ParameterList,
                    parameters: [],
                },
                returnParameters: null,
                visibility: S.Visibility.Default,
                stateMutability: S.StateMutability.Default,
                modifiers: [],
                isConstructor: true,
                body: {
                    type: S.NodeType.Block,
                    statements: [
                        {
                            type: S.NodeType.ExpressionStatement,
                            expression: {
                                type: S.NodeType.NewExpression,
                                typeName: {
                                    type: S.NodeType.UserDefinedTypeName,
                                    namePath: contractName,
                                },
                            },
                        },
                    ],
                },
            },
        ],
    };
}
