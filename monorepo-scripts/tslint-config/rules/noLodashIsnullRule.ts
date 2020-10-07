import * as Lint from 'tslint';
import * as ts from 'typescript';

export class Rule extends Lint.Rules.AbstractRule {
    public static FAILURE_STRING = `Use built-in equivalent`;

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithFunction(sourceFile, walk);
    }
}

function walk(ctx: Lint.WalkContext<void>): void {
    // Recursively walk the AST starting with root node, `ctx.sourceFile`.
    // Call the function `cb` (defined below) for each child.
    return ts.forEachChild(ctx.sourceFile, cb);

    function cb(node: ts.Node): void {
        if (node.kind === ts.SyntaxKind.CallExpression) {
            const firstChild = node.getChildAt(0, ctx.sourceFile);
            if (
                firstChild.kind === ts.SyntaxKind.PropertyAccessExpression &&
                firstChild.getText(ctx.sourceFile) === '_.isNull'
            ) {
                return ctx.addFailureAtNode(node, Rule.FAILURE_STRING, getFix(node));
            }
        }
        // Continue recursion into the AST by calling function `cb` for every child of the current node.
        return ts.forEachChild(node, cb);
    }

    function getFix(node: ts.Node): Lint.Replacement {
        const isNegated =
            node.parent.kind === ts.SyntaxKind.PrefixUnaryExpression && node.parent.getText(ctx.sourceFile)[0] === '!';
        const args = node.getChildAt(2, ctx.sourceFile).getText(ctx.sourceFile);
        if (isNegated) {
            return new Lint.Replacement(
                node.parent.getStart(ctx.sourceFile),
                node.parent.getWidth(ctx.sourceFile),
                `${args} !== null`,
            );
        } else {
            return new Lint.Replacement(
                node.getStart(ctx.sourceFile),
                node.getWidth(ctx.sourceFile),
                `${args} === null`,
            );
        }
    }
}
