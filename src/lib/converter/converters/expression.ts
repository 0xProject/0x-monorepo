import * as ts from "typescript";


/**
 * Return the default value of the given node.
 *
 * @param node  The TypeScript node whose default value should be extracted.
 * @returns The default value as a string.
 */

export function convertDefaultValue(node:ts.VariableDeclaration|ts.ParameterDeclaration|ts.EnumMember):string {
    if (!node.initializer) return;
    return convertExpression(node.initializer);
}


export function convertExpression(expression:ts.Expression):string
{
    switch (expression.kind) {
        case ts.SyntaxKind.StringLiteral:
            return '"' + (<ts.LiteralExpression>expression).text + '"';
            break;
        case ts.SyntaxKind.NumericLiteral:
            return (<ts.LiteralExpression>expression).text;
            break;
        case ts.SyntaxKind.TrueKeyword:
            return 'true';
            break;
        case ts.SyntaxKind.FalseKeyword:
            return 'false';
            break;
        default:
            var source = ts.getSourceFileOfNode(<ts.Node>expression);
            return source.text.substring(expression.pos, expression.end);
            break;
    }
}
