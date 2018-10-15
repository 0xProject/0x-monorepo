// TODO: instead use https://github.com/prettier-solidity/prettier-plugin-solidity/blob/master/src/printer.js

import * as S from 'solidity-parser-antlr';

const stresc = (s: string) => `\"${s}\"`;
const indent = (s: string) => `\t${s.replace(/\n/g, '\n\t')}`;
const block = (s: string) => `{\n${indent(s)}\n}`;
const unparen = (s: string) => s.replace(/^\((.*)\)$/, '$1');

const visitor: S.Visitor<string> = {
    
    // Source level
    
    SourceUnit: ({children}) =>
        children.map(unparse).join('\n'),

    PragmaDirective: ({ name, value }) =>
        `pragma ${name} ${value};`,
        
    ImportDirective: ({ path, symbolAliases }) =>
        `import `+
        (symbolAliases ? `{${symbolAliases.map(([from, to]) =>
            from + (to ? ` as ${to}` : '')
        ).join(', ')}} from `: '') +
        `${stresc(path)};`,

    ContractDefinition: ({name, kind, baseContracts, subNodes}) =>
        `${kind} ${name} ${(baseContracts.length > 0 ? 'is ' : '')}` +
        baseContracts.map(unparse).join(', ') +
        block('\n' + subNodes.map(unparse).join('\n\n')),

    InheritanceSpecifier: ({baseName: {namePath}}) =>
        namePath,
    
    // Contract level
    
    UsingForDeclaration: ({typeName, libraryName}) =>
        `using ${libraryName} for ${unparse(typeName)};`,

    StateVariableDeclaration: ({variables}) =>
        variables.map(unparse).join(', ') + ';',
    
    StructDefinition: ({name, members}) =>
        `struct ${name} ${block(members.map(unparse).join(';\n') + ';')}`,
    
    EnumDefinition: ({name, members}) =>
        `enum ${name} ${block(members.map(unparse).join(',\n'))}`,
    
    EnumValue: ({name}) =>
        name,

    EventDefinition: ({ name, parameters }) =>
        `event ${name}${unparse(parameters)};`,

    ModifierDefinition: ({name, parameters, body}) =>
        `modifier ${name}${Array.isArray(parameters) ? '' : unparse(parameters)} ${unparse(body)}`,
        // Note: when there is no parameter block, instead of an ASTNode there is a []

    FunctionDefinition: ({visibility, name, parameters, body, modifiers, isConstructor, stateMutability, returnParameters}) =>
        (isConstructor ? 'constructor' : `function ${name}`) +
        unparse(parameters) + '\n' +
        indent(
            (visibility && visibility != 'default' ? visibility + ' ' : '') + (stateMutability || '') +
            modifiers.map(unparse).join('\n') +
            (returnParameters ? `\nreturns ${unparse(returnParameters)}` : '')
        ) + '\n' +
        (body ? unparse(body) : ';'),

    ParameterList: ({parameters}) =>
        `(${parameters.map(unparse).join(', ')})`,

    Parameter: ({typeName, name, storageLocation}) =>
        `${unparse(typeName)} ${storageLocation || ''} ${name || ''}`,

    ModifierInvocation: ({name, arguments: args}) =>
        `${name}(${args.map(unparse).join(', ')})`,

    // Statements
    
    Block: ({statements}) =>
        block(statements.map(unparse).join('\n')),

    VariableDeclarationStatement: ({variables, initialValue}) =>
        variables.map(unparse) + 
        (initialValue ? ` = ${unparse(initialValue)};` : ';'),
    
    ExpressionStatement: ({expression}) =>
        `${unparen(unparse(expression))};`,

    EmitStatement: ({eventCall}) =>
        `emit ${unparen(unparse(eventCall))};`,

    ReturnStatement: ({expression}) =>
        `return ${expression ? unparse(expression) : ''};`,
        
    BreakStatement: ({}) =>
        `break;`,
        
    ContinueStatement: ({}) =>
        `continue;`,
    
    ThrowStatement: ({}) =>
        `throw;`,

    IfStatement: ({condition, trueBody, falseBody}) =>
        `if (${unparse(condition)})\n${unparse(trueBody)}` +
        (falseBody ? `else\n${unparse(falseBody)}` : ''),
    
    ForStatement: ({initExpression: i, conditionExpression: c, loopExpression: l, body}) =>
        `for (${unparse(i).replace(';','')}; ${unparse(c)}; ${unparse(l).replace(';','')}) ${unparse(body)}`,
    
    InlineAssemblyStatement: ({language, body}) => // TODO language
        `assembly ${unparse(body)}`,

    // Types

    ElementaryTypeName: ({name}) =>
        name,

    UserDefinedTypeName: ({namePath}) =>
        namePath,
        
    ArrayTypeName: ({baseTypeName, length}) =>
        `${unparse(baseTypeName)}[${length ? unparse(length) : ''}]`,

    Mapping: ({keyType, valueType}) =>
        `mapping (${unparse(keyType)} => ${unparse(valueType)})`,

    // Expressions

    Identifier: ({ name }) =>
        name,
        
    BooleanLiteral: ({ value }) =>
        value ? 'true' : 'false',

    NumberLiteral: ({number, subdenomination}) => // TODO subdenomination
        number,
        
    StringLiteral: ({value}) =>
        stresc(value),

    FunctionCall: ({expression, arguments: args, names}) => // TODO: names
        `(${unparse(expression)}(${args.map(unparse).join(', ')}))`,

    Conditional: ({condition, trueExpression, falseExpression}) =>
        `(${unparse(condition)} ? ${unparse(trueExpression)} : ${unparse(falseExpression)})`,
        
    UnaryOperation: ({operator, subExpression, isPrefix}) =>
        `(${isPrefix ? operator : ''}${unparse(subExpression)}${isPrefix ? '' : operator})`,

    BinaryOperation: ({operator, left, right}) =>
        `(${unparse(left)} ${operator} ${unparse(right)})`,

    MemberAccess: ({expression, memberName}) =>
        `(${unparse(expression)}.${memberName})`,

    IndexAccess: ({base, index}) =>
        `(${unparse(base)}[${unparse(index)}])`,

    ElementaryTypeNameExpression: ({typeName}) =>
        `(${unparse(typeName)})`,

    VariableDeclaration: ({typeName, name, visibility, isDeclaredConst, isIndexed, expression}) =>
        `${unparse(typeName)} ` +
        (isIndexed ? 'indexed ' : '') +
        (visibility && visibility != 'default' ? visibility + ' ' : '') +
        (isDeclaredConst ? 'constant ' : '') +
        `${name}` +
        (expression ? ` = ${unparse(expression)}` : ''),
    
    NewExpression: ({typeName}) =>
        `(new ${unparse(typeName)})`,
    
    TupleExpression: ({components}) =>
        `[${components.map(unparse).join(', ')}]`,
    
    // Assembly
    
    AssemblyBlock: ({operations}) =>
        block(operations.map(unparse).join('\n')),
    
    AssemblyAssignment: ({names, expression}) =>
        `${names.map(unparse).join(', ')} := ${unparse(expression)}`,
    
    AssemblyLocalDefinition: ({names, expression}) =>
        `let ${names.map(unparse).join(', ')} := ${unparse(expression)}`,
    
    AssemblyCall: ({functionName, arguments: args}) =>
        args.length == 0 ?
            functionName :
            `${functionName}(${args.map(unparse).join(', ')})`,
    
    AssemblyIf: ({condition, body}) =>
        `if ${unparse(condition)} ${unparse(body)}`,
    
    AssemblyFor: ({pre, condition, post, body}) =>
        `for ${[pre, condition, post, body].map(unparse).join(' ')}`,
    
    AssemblySwitch: ({expression, cases}) =>
        `switch ${unparse(expression)}\n${cases.map(unparse).join('\n')}`,
    
    AssemblyCase: ({value, block}) =>
        `case ${unparse(value)} ${unparse(block)}`,
    
    DecimalNumber: ({ value }) =>
        value,
    
    HexNumber: ({ value }) =>
        value,
}

export function unparse(ast: S.ASTNode): string {
    return (visitor[ast.type] || (a => {
        console.log(a);
        console.trace();
        return `<${a.type}>`;
    }))(ast);
}
