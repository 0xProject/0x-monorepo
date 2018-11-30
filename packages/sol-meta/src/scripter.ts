import * as _ from 'lodash';
import * as S from 'solidity-parser-antlr';

import * as utils from './utils';
import { visit, Visitor } from './visitor';

export interface FunctionScriptReturn {
    inputs: { [argName: string]: string };
    outputs: [string];
}

export interface FunctionScriptRevert {
    inputs: { [argName: string]: string };
    revert: string;
}

export type FunctionScript = FunctionScriptReturn | FunctionScriptRevert;

export const isFunctionScriptReturn = (fs: FunctionScript): fs is FunctionScriptReturn => 'outputs' in fs;

export const isFunctionScriptRevert = (fs: FunctionScript): fs is FunctionScriptRevert => 'revert' in fs;

export const errorUnscriptedInput = (funcName: string) => `Unscripted input for ${funcName}`;

export const guard = (clauses: { [argName: string]: string }, statements: S.Statement[]): S.IfStatement => ({
    type: S.NodeType.IfStatement,
    condition: Object.keys(clauses).reduce<S.Expression>(
        (cond, argName) => ({
            type: S.NodeType.BinaryOperation,
            operator: '&&',
            left: cond,
            right: {
                type: S.NodeType.BinaryOperation,
                operator: '==',
                left: utils.identifier(argName),
                right: utils.literal(clauses[argName]),
            },
        }),
        utils.litTrue,
    ),
    trueBody: {
        type: S.NodeType.Block,
        statements,
    },
    falseBody: null,
});

export const scriptStatementReturn = (s: FunctionScriptReturn): S.IfStatement =>
    guard(s.inputs, [
        {
            type: S.NodeType.ReturnStatement,
            expression: {
                type: S.NodeType.TupleExpression,
                isArray: false,
                components: _.map(s.outputs, utils.literal),
            },
        },
    ]);

export const scriptStatementRevert = (s: FunctionScriptRevert): S.IfStatement =>
    guard(s.inputs, [
        {
            type: S.NodeType.ExpressionStatement,
            expression: {
                type: S.NodeType.FunctionCall,
                expression: utils.identifier('require'),
                arguments: [utils.litFalse, utils.litString(s.revert)],
            },
        },
    ] as S.ExpressionStatement[]);

export const scriptStatement = (s: FunctionScript): S.IfStatement =>
    isFunctionScriptReturn(s) ? scriptStatementReturn(s) : scriptStatementRevert(s);

export const scriptFunction = (func: S.FunctionDefinition, script: FunctionScript[]): S.FunctionDefinition => {
    if (func.isConstructor || func.name === null) {
        throw new Error(`Function can not be scripted because it is a constructor.`);
    }

    const catchAllScript = [
        ...script,
        {
            inputs: {},
            revert: errorUnscriptedInput(func.name),
        },
    ];

    const params = utils.nameParameters(func.parameters);
    const returns = utils.nameParameters(func.returnParameters as S.ParameterList, '_ret');
    return {
        type: S.NodeType.FunctionDefinition,
        name: func.name,
        parameters: params,
        returnParameters: returns,
        visibility: func.visibility,
        stateMutability: func.stateMutability,
        modifiers: [],
        isConstructor: false,
        body: {
            type: S.NodeType.Block,
            statements: _.map(catchAllScript, scriptStatement),
        },
    };
};
