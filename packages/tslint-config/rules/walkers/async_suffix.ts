import * as _ from 'lodash';
import * as Lint from 'tslint';
import * as ts from 'typescript';

export class AsyncSuffixWalker extends Lint.RuleWalker {
    public static FAILURE_STRING = 'async functions must have an Async suffix';
    public visitMethodDeclaration(node: ts.MethodDeclaration): void {
        const methodNameNode = node.name;
        const methodName = methodNameNode.getText();
        if (!_.isUndefined(node.type)) {
            if (node.type.kind === ts.SyntaxKind.TypeReference) {
                // tslint:disable-next-line:no-unnecessary-type-assertion
                const returnTypeName = (node.type as ts.TypeReferenceNode).typeName.getText();
                if (returnTypeName === 'Promise' && !methodName.endsWith('Async')) {
                    const failure = this.createFailure(
                        methodNameNode.getStart(),
                        methodNameNode.getWidth(),
                        AsyncSuffixWalker.FAILURE_STRING,
                    );
                    this.addFailure(failure);
                }
            }
        }
        super.visitMethodDeclaration(node);
    }
}
