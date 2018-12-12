import * as _ from 'lodash';
import * as Lint from 'tslint';
import * as ts from 'typescript';

export class AsyncSuffixWalker extends Lint.RuleWalker {
    public static FAILURE_STRING = 'async functions/methods must have an Async suffix';
    public visitFunctionDeclaration(node: ts.FunctionDeclaration): void {
        this._visitFunctionOrMethodDeclaration(node);
        super.visitFunctionDeclaration(node);
    }
    public visitMethodDeclaration(node: ts.MethodDeclaration): void {
        this._visitFunctionOrMethodDeclaration(node);
        super.visitMethodDeclaration(node);
    }
    private _visitFunctionOrMethodDeclaration(node: ts.MethodDeclaration | ts.FunctionDeclaration): void {
        const nameNode = node.name;
        if (!_.isUndefined(nameNode)) {
            const name = nameNode.getText();
            if (!_.isUndefined(node.type)) {
                if (node.type.kind === ts.SyntaxKind.TypeReference) {
                    // tslint:disable-next-line:no-unnecessary-type-assertion
                    const returnTypeName = (node.type as ts.TypeReferenceNode).typeName.getText();
                    if (returnTypeName === 'Promise' && !name.endsWith('Async')) {
                        const failure = this.createFailure(
                            nameNode.getStart(),
                            nameNode.getWidth(),
                            AsyncSuffixWalker.FAILURE_STRING,
                        );
                        this.addFailure(failure);
                    }
                }
            }
        }
    }
}
