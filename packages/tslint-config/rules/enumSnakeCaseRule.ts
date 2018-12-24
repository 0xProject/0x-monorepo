import toSnakeCase = require('to-snake-case');
import * as Lint from 'tslint';
import * as ts from 'typescript';

export class Rule extends Lint.Rules.AbstractRule {
    public static FAILURE_STRING = `Enum member names should be SCREAMING_SNAKE_CASE`;

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithFunction(sourceFile, walk);
    }
}

function walk(ctx: Lint.WalkContext<void>): void {
    // Recursively walk the AST starting with root node, `ctx.sourceFile`.
    // Call the function `cb` (defined below) for each child.
    return ts.forEachChild(ctx.sourceFile, cb);

    function cb(node: ts.Node): void {
        if (node.kind === ts.SyntaxKind.EnumMember && !isSnakeCase(node.getText(ctx.sourceFile))) {
            return ctx.addFailureAtNode(node, Rule.FAILURE_STRING, getFix(node));
        }
        // Continue recursion into the AST by calling function `cb` for every child of the current node.
        return ts.forEachChild(node, cb);
    }

    function getFix(node: ts.Node): Lint.Replacement {
        const [key, value] = node
            .getText(ctx.sourceFile)
            .split('=')
            .map(w => w.trim());
        let fix = toSnakeCase(key).toUpperCase();
        if (value !== undefined) {
            fix += ` = ${value}`;
        }
        return new Lint.Replacement(node.getStart(ctx.sourceFile), node.getWidth(ctx.sourceFile), fix);
    }
}

function isSnakeCase(s: string): boolean {
    const regex = /^[A-Z\d]+(_{1}[A-Z\d]+)*$/g;
    const key = s.split('=')[0].trim();
    return regex.test(key);
}
