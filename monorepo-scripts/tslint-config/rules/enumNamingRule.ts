import * as Lint from 'tslint';
import * as ts from 'typescript';

export class Rule extends Lint.Rules.AbstractRule {
    public static FAILURE_STRING = `Enum member names should be PascalCase`;

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithFunction(sourceFile, walk);
    }
}

function walk(ctx: Lint.WalkContext<void>): void {
    // Recursively walk the AST starting with root node, `ctx.sourceFile`.
    // Call the function `cb` (defined below) for each child.
    return ts.forEachChild(ctx.sourceFile, cb);

    function cb(node: ts.Node): void {
        if (node.kind === ts.SyntaxKind.EnumMember) {
            const keyNode = node.getFirstToken(ctx.sourceFile);
            if (keyNode !== undefined) {
                const keyText = keyNode.getText(ctx.sourceFile);
                if (!isPascalCase(keyText)) {
                    return ctx.addFailureAtNode(node, Rule.FAILURE_STRING, getFix(keyText, node));
                }
            }
        }
        // Continue recursion into the AST by calling function `cb` for every child of the current node.
        return ts.forEachChild(node, cb);
    }

    function getFix(text: string, node: ts.Node): Lint.Replacement {
        let fix = toPascalCase(text);
        // check for `member = value`
        if (node.getChildCount(ctx.sourceFile) === 3) {
            const value = node.getLastToken(ctx.sourceFile);
            if (value !== undefined) {
                fix += ` = ${value.getText(ctx.sourceFile)}`;
            }
        }
        return new Lint.Replacement(node.getStart(ctx.sourceFile), node.getWidth(ctx.sourceFile), fix);
    }
}

// Modified from: https://github.com/jonschlinkert/pascalcase/
function toPascalCase(str: string): string {
    let result = str.replace(/([a-z0-9\W])([A-Z])/g, '$1 $2');
    if (result.length === 1) {
        return result.toUpperCase();
    }
    result = result.replace(/^[\W_\.]+|[\W_\.]+$/g, '').toLowerCase();
    result = result.charAt(0).toUpperCase() + result.slice(1);
    return result.replace(/[\W_\.]+(\w|$)/g, (_, ch) => {
        return ch.toUpperCase();
    });
}
function isPascalCase(s: string): boolean {
    const regex = /^([A-Z0-9]+[a-z0-9]+)+$/g;
    const key = s.split('=')[0].trim();
    return regex.test(key);
}
