import * as _ from 'lodash';
import * as Lint from 'tslint';
import * as ts from 'typescript';

const VALID_BOOLEAN_PREFIXES = ['is', 'does', 'should', 'was', 'has', 'can', 'did', 'would', 'are'];
// tslint:disable:no-unnecessary-type-assertion
export class Rule extends Lint.Rules.TypedRule {
    public static FAILURE_STRING = `Boolean variable names should begin with: ${VALID_BOOLEAN_PREFIXES.join(', ')}`;

    public applyWithProgram(sourceFile: ts.SourceFile, program: ts.Program): Lint.RuleFailure[] {
        return this.applyWithFunction(sourceFile, walk, undefined, program.getTypeChecker());
    }
}

function walk(ctx: Lint.WalkContext<void>, tc: ts.TypeChecker): void {
    traverse(ctx.sourceFile);

    function traverse(node: ts.Node): void {
        checkNodeForViolations(ctx, node, tc);
        return ts.forEachChild(node, traverse);
    }
}

function checkNodeForViolations(ctx: Lint.WalkContext<void>, node: ts.Node, tc: ts.TypeChecker): void {
    switch (node.kind) {
        // Handle: const { timestamp } = ...
        case ts.SyntaxKind.BindingElement: {
            const bindingElementNode = node as ts.BindingElement;
            if (bindingElementNode.name.kind === ts.SyntaxKind.Identifier) {
                handleBooleanNaming(bindingElementNode, tc, ctx);
            }
            break;
        }

        // Handle regular assignments: const block = ...
        case ts.SyntaxKind.VariableDeclaration:
            const variableDeclarationNode = node as ts.VariableDeclaration;
            if (variableDeclarationNode.name.kind === ts.SyntaxKind.Identifier) {
                handleBooleanNaming(node as ts.VariableDeclaration, tc, ctx);
            }
            break;

        default:
            _.noop();
    }
}

function handleBooleanNaming(
    node: ts.VariableDeclaration | ts.BindingElement,
    tc: ts.TypeChecker,
    ctx: Lint.WalkContext<void>,
): void {
    const nodeName = node.name;
    const variableName = nodeName.getText();
    const lowercasedName = _.toLower(variableName);
    const typeNode = tc.getTypeAtLocation(node);
    const typeName = (typeNode as any).intrinsicName;
    if (typeName === 'boolean') {
        const hasProperName =
            _.find(VALID_BOOLEAN_PREFIXES, prefix => {
                return _.startsWith(lowercasedName, prefix);
            }) !== undefined;
        if (!hasProperName) {
            ctx.addFailureAtNode(node, Rule.FAILURE_STRING);
        }
    }
}
// tslint:enable:no-unnecessary-type-assertion
