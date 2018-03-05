import * as _ from 'lodash';
import * as SolidityParser from 'solidity-parser-sc';

import { BranchMap, FnMap, LocationByOffset, SingleFileSourceRange, StatementMap } from './types';

export interface CoverageEntriesDescription {
    fnMap: FnMap;
    branchMap: BranchMap;
    statementMap: StatementMap;
}

export class ASTVisitor {
    private _entryId = 0;
    private _fnMap: FnMap = {};
    private _branchMap: BranchMap = {};
    private _statementMap: StatementMap = {};
    private _locationByOffset: LocationByOffset;
    private static _doesLookLikeAnASTNode(ast: any): boolean {
        const isAST = _.isObject(ast) && _.isString(ast.type) && _.isNumber(ast.start) && _.isNumber(ast.end);
        return isAST;
    }
    constructor(locationByOffset: LocationByOffset) {
        this._locationByOffset = locationByOffset;
    }
    public walkAST(astNode: SolidityParser.AST): void {
        if (_.isArray(astNode) || _.isObject(astNode)) {
            if (ASTVisitor._doesLookLikeAnASTNode(astNode)) {
                const nodeType = astNode.type;
                const visitorFunctionName = `_visit${nodeType}`;
                // tslint:disable-next-line:no-this-assignment
                const self: { [visitorFunctionName: string]: (ast: SolidityParser.AST) => void } = this as any;
                if (_.isFunction(self[visitorFunctionName])) {
                    self[visitorFunctionName](astNode);
                }
            }
            _.forEach(astNode, subtree => {
                this.walkAST(subtree);
            });
        }
    }
    public getCollectedCoverageEntries(): CoverageEntriesDescription {
        const coverageEntriesDescription = {
            fnMap: this._fnMap,
            branchMap: this._branchMap,
            statementMap: this._statementMap,
        };
        return coverageEntriesDescription;
    }
    private _visitConditionalExpression(ast: SolidityParser.AST): void {
        this._visitBinaryBranch(ast, ast.consequent, ast.alternate, 'cond-expr');
    }
    private _visitFunctionDeclaration(ast: SolidityParser.AST): void {
        const loc = this._getExpressionRange(ast);
        this._fnMap[this._entryId++] = {
            name: ast.name,
            line: loc.start.line,
            loc,
        };
    }
    private _visitBinaryExpression(ast: SolidityParser.AST): void {
        this._visitBinaryBranch(ast, ast.left, ast.right, 'binary-expr');
    }
    private _visitIfStatement(ast: SolidityParser.AST): void {
        this._visitStatement(ast);
        this._visitBinaryBranch(ast, ast.consequent, ast.alternate || ast, 'if');
    }
    private _visitBreakStatement(ast: SolidityParser.AST): void {
        this._visitStatement(ast);
    }
    private _visitContractStatement(ast: SolidityParser.AST): void {
        this._visitStatement(ast);
    }
    private _visitExpressionStatement(ast: SolidityParser.AST): void {
        this._visitStatement(ast);
    }
    private _visitForStatement(ast: SolidityParser.AST): void {
        this._visitStatement(ast);
    }
    private _visitPlaceholderStatement(ast: SolidityParser.AST): void {
        this._visitStatement(ast);
    }
    private _visitReturnStatement(ast: SolidityParser.AST): void {
        this._visitStatement(ast);
    }
    private _visitModifierArgument(ast: SolidityParser.AST): void {
        const BUILTIN_MODIFIERS = ['public', 'view', 'payable', 'external', 'internal', 'pure'];
        if (!_.includes(BUILTIN_MODIFIERS, ast.name)) {
            this._visitStatement(ast);
        }
    }
    private _visitBinaryBranch(
        ast: SolidityParser.AST,
        left: SolidityParser.AST,
        right: SolidityParser.AST,
        type: 'if' | 'cond-expr' | 'binary-expr',
    ): void {
        this._branchMap[this._entryId++] = {
            line: this._getExpressionRange(ast).start.line,
            type,
            locations: [this._getExpressionRange(left), this._getExpressionRange(right)],
        };
    }
    private _visitStatement(ast: SolidityParser.AST): void {
        this._statementMap[this._entryId++] = this._getExpressionRange(ast);
    }
    private _getExpressionRange(ast: SolidityParser.AST): SingleFileSourceRange {
        const start = this._locationByOffset[ast.start - 1];
        const end = this._locationByOffset[ast.end - 1];
        const range = {
            start,
            end,
        };
        return range;
    }
}
