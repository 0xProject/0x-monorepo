import * as Lint from 'tslint';
import { isPrefixUnaryExpression } from 'tsutils';
import * as ts from 'typescript';

// tslint:disable:no-unnecessary-type-assertion
/**
 * A modified version of the no-magic-numbers rule that allows for magic numbers
 * when instantiating a BigNumber instance.
 * E.g We want to be able to write:
 *     const amount = new BigNumber(5);
 * Original source: https://github.com/palantir/tslint/blob/42b058a6baa688f8be8558b277eb056c3ff79818/src/rules/noMagicNumbersRule.ts
 */
export class Rule extends Lint.Rules.AbstractRule {
    public static ALLOWED_NODES = new Set<ts.SyntaxKind>([
        ts.SyntaxKind.ExportAssignment,
        ts.SyntaxKind.FirstAssignment,
        ts.SyntaxKind.LastAssignment,
        ts.SyntaxKind.PropertyAssignment,
        ts.SyntaxKind.ShorthandPropertyAssignment,
        ts.SyntaxKind.VariableDeclaration,
        ts.SyntaxKind.VariableDeclarationList,
        ts.SyntaxKind.EnumMember,
        ts.SyntaxKind.PropertyDeclaration,
        ts.SyntaxKind.Parameter,
    ]);

    public static DEFAULT_ALLOWED = [-1, 0, 1];

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        const allowedNumbers = this.ruleArguments.length > 0 ? this.ruleArguments : Rule.DEFAULT_ALLOWED;
        return this.applyWithWalker(
            // tslint:disable-next-line:no-inferred-empty-object-type
            new CustomNoMagicNumbersWalker(sourceFile, this.ruleName, new Set(allowedNumbers.map(String))),
        );
    }
}

// tslint:disable-next-line:max-classes-per-file
class CustomNoMagicNumbersWalker extends Lint.AbstractWalker<Set<string>> {
    public static FAILURE_STRING = "'magic numbers' are not allowed";
    private static _isNegativeNumberLiteral(
        node: ts.Node,
    ): node is ts.PrefixUnaryExpression & { operand: ts.NumericLiteral } {
        return (
            isPrefixUnaryExpression(node) &&
            node.operator === ts.SyntaxKind.MinusToken &&
            node.operand.kind === ts.SyntaxKind.NumericLiteral
        );
    }
    public walk(sourceFile: ts.SourceFile): void {
        const cb = (node: ts.Node): void => {
            if (node.kind === ts.SyntaxKind.NumericLiteral) {
                return this.checkNumericLiteral(node, (node as ts.NumericLiteral).text);
            }
            if (CustomNoMagicNumbersWalker._isNegativeNumberLiteral(node)) {
                return this.checkNumericLiteral(node, `-${(node.operand as ts.NumericLiteral).text}`);
            }
            return ts.forEachChild(node, cb);
        };
        return ts.forEachChild(sourceFile, cb);
    }

    // tslint:disable:no-non-null-assertion
    // tslint:disable-next-line:underscore-private-and-protected
    private checkNumericLiteral(node: ts.Node, num: string): void {
        if (!Rule.ALLOWED_NODES.has(node.parent!.kind) && !this.options.has(num)) {
            if (node.parent!.kind === ts.SyntaxKind.NewExpression) {
                const className = (node.parent! as any).expression.escapedText;
                const BIG_NUMBER_NEW_EXPRESSION = 'BigNumber';
                if (className === BIG_NUMBER_NEW_EXPRESSION) {
                    return; // noop
                }
            }
            this.addFailureAtNode(node, CustomNoMagicNumbersWalker.FAILURE_STRING);
        }
    }
    // tslint:enable:no-non-null-assertion
}
// tslint:enable:no-unnecessary-type-assertion
