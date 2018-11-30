// TODO: instead use https://github.com/prettier-solidity/prettier-plugin-solidity/blob/master/src/printer.js

import * as _ from 'lodash';
import * as S from 'solidity-parser-antlr';

import { visit, Visitor } from './visitor';

const stresc = (s: string) => `\"${s}\"`;
const indent = (s: string) => `\t${s.replace(/\n/g, '\n\t')}`;
const block = (s: string) => `{\n${indent(s)}\n}`;
const unparen = (s: string) => s.replace(/^\((.*)\)$/, '$1');

const visitor: Visitor<string> = {
    // Source level

    SourceUnit: ({ children }) => _.map(children, unparse).join('\n'),

    PragmaDirective: ({ name, value }) => `pragma ${name} ${value};`,

    ImportDirective: ({ path, symbolAliases }) =>
        `import ` +
        (symbolAliases
            ? `{${_.map(symbolAliases, ([from, to]) => from + (to ? ` as ${to}` : '')).join(', ')}} from `
            : '') +
        `${stresc(path)};`,

    ContractDefinition: ({ name, kind, baseContracts, subNodes }) =>
        `${kind} ${name} ${baseContracts.length > 0 ? 'is ' : ''}` +
        _.map(baseContracts, unparse).join(', ') +
        block('\n' + _.map(subNodes, unparse).join('\n\n')),

    InheritanceSpecifier: ({ baseName: { namePath } }) => namePath,

    // Contract level

    UsingForDeclaration: ({ typeName, libraryName }) => `using ${libraryName} for ${unparse(typeName)};`,

    StateVariableDeclaration: ({ variables }) => _.map(variables, unparse).join(', ') + ';',

    StructDefinition: ({ name, members }) => `struct ${name} ${block(_.map(members, unparse).join(';\n') + ';')}`,

    EnumDefinition: ({ name, members }) => `enum ${name} ${block(_.map(members, unparse).join(',\n'))}`,

    EnumValue: ({ name }) => name,

    EventDefinition: ({ name, parameters }) => `event ${name}${unparse(parameters)};`,

    ModifierDefinition: ({ name, parameters, body }) =>
        `modifier ${name}${Array.isArray(parameters) ? '' : unparse(parameters)} ${unparse(body)}`,
    // Note: when there is no parameter block, instead of an ASTNode there is a []

    FunctionDefinition: ({
        visibility,
        name,
        parameters,
        body,
        modifiers,
        isConstructor,
        stateMutability,
        returnParameters,
    }) =>
        (isConstructor ? 'constructor' : `function ${name}`) +
        unparse(parameters) +
        '\n' +
        indent(
            (visibility && visibility != 'default' ? visibility + ' ' : '') +
                (stateMutability || '') +
                _.map(modifiers, unparse).join('\n') +
                (returnParameters ? `\nreturns ${unparse(returnParameters)}` : ''),
        ) +
        '\n' +
        (body ? unparse(body) : ';'),

    ParameterList: ({ parameters }) => `(${_.map(parameters, unparse).join(', ')})`,

    Parameter: ({ typeName, name, storageLocation }) => `${unparse(typeName)} ${storageLocation || ''} ${name || ''}`,

    ModifierInvocation: ({ name, arguments: args }) => `${name}(${_.map(args, unparse).join(', ')})`,

    // Statements

    Block: ({ statements }) => block(_.map(statements, unparse).join('\n')),

    VariableDeclarationStatement: ({ variables, initialValue }) =>
        _.map(variables, unparse) + (initialValue ? ` = ${unparse(initialValue)};` : ';'),

    ExpressionStatement: ({ expression }) => `${unparen(unparse(expression))};`,

    EmitStatement: ({ eventCall }) => `emit ${unparen(unparse(eventCall))};`,

    ReturnStatement: ({ expression }) => `return ${expression ? unparse(expression) : ''};`,

    BreakStatement: ({}) => `break;`,

    ContinueStatement: ({}) => `continue;`,

    ThrowStatement: ({}) => `throw;`,

    IfStatement: ({ condition, trueBody, falseBody }) =>
        `if (${unparse(condition)})\n${unparse(trueBody)}` + (falseBody ? `else\n${unparse(falseBody)}` : ''),

    ForStatement: ({ initExpression: i, conditionExpression: c, loopExpression: l, body }) =>
        `for (${unparse(i).replace(';', '')}; ${unparse(c)}; ${unparse(l).replace(';', '')}) ${unparse(body)}`,

    InlineAssemblyStatement: (
        { language, body }, // TODO language
    ) => `assembly ${unparse(body)}`,

    // Types

    ElementaryTypeName: ({ name }) => name,

    UserDefinedTypeName: ({ namePath }) => namePath,

    ArrayTypeName: ({ baseTypeName, length }) => `${unparse(baseTypeName)}[${length ? unparse(length) : ''}]`,

    Mapping: ({ keyType, valueType }) => `mapping (${unparse(keyType)} => ${unparse(valueType)})`,

    // Expressions

    Identifier: ({ name }) => name,

    BooleanLiteral: ({ value }) => (value ? 'true' : 'false'),

    NumberLiteral: (
        { number: value, subdenomination }, // TODO subdenomination
    ) => value,

    StringLiteral: ({ value }) => stresc(value),

    FunctionCall: (
        { expression, arguments: args, names }, // TODO: names
    ) => `(${unparse(expression)}(${_.map(args, unparse).join(', ')}))`,

    Conditional: ({ condition, trueExpression, falseExpression }) =>
        `(${unparse(condition)} ? ${unparse(trueExpression)} : ${unparse(falseExpression)})`,

    UnaryOperation: ({ operator, subExpression, isPrefix }) =>
        `(${isPrefix ? operator : ''}${unparse(subExpression)}${isPrefix ? '' : operator})`,

    BinaryOperation: ({ operator, left, right }) => `(${unparse(left)} ${operator} ${unparse(right)})`,

    MemberAccess: ({ expression, memberName }) => `(${unparse(expression)}.${memberName})`,

    IndexAccess: ({ base, index }) => `(${unparse(base)}[${unparse(index)}])`,

    ElementaryTypeNameExpression: ({ typeName }) => `(${unparse(typeName)})`,

    VariableDeclaration: ({ typeName, name, visibility, isDeclaredConst, isIndexed, expression, storageLocation }) =>
        `${unparse(typeName)} ` +
        (isIndexed ? 'indexed ' : '') +
        (storageLocation ? storageLocation + ' ' : '') +
        (visibility && visibility != 'default' ? visibility + ' ' : '') +
        (isDeclaredConst ? 'constant ' : '') +
        `${name}` +
        (expression ? ` = ${unparse(expression)}` : ''),

    NewExpression: ({ typeName }) => `(new ${unparse(typeName)})`,

    TupleExpression: ({ isArray, components }) =>
        isArray ? `[${_.map(components, unparse).join(', ')}]` : `(${_.map(components, unparse).join(', ')})`,

    // Assembly

    AssemblyBlock: ({ operations }) => block(_.map(operations, unparse).join('\n')),

    AssemblyAssignment: ({ names, expression }) => `${_.map(names, unparse).join(', ')} := ${unparse(expression)}`,

    AssemblyLocalDefinition: ({ names, expression }) =>
        `let ${_.map(names, unparse).join(', ')} := ${unparse(expression)}`,

    AssemblyCall: ({ functionName, arguments: args }) =>
        args.length == 0 ? functionName : `${functionName}(${_.map(args, unparse).join(', ')})`,

    AssemblyIf: ({ condition, body }) => `if ${unparse(condition)} ${unparse(body)}`,

    AssemblyFor: ({ pre, condition, post, body }) => `for ${_.map([pre, condition, post, body], unparse).join(' ')}`,

    AssemblySwitch: ({ expression, cases }) => `switch ${unparse(expression)}\n${_.map(cases, unparse).join('\n')}`,

    AssemblyCase: ({ value, block }) => `case ${unparse(value)} ${unparse(block)}`,

    DecimalNumber: ({ value }) => value,

    HexNumber: ({ value }) => value,

    ASTNode: node => {
        console.log(node);
        console.trace();
        return `<${node.type}>`;
    },
};

export const unparse = (ast: S.ASTNode) => visit(ast, visitor);
