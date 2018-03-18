import * as _ from 'lodash';
import * as Parser from 'solidity-parser-antlr';

import { BranchMap, FnMap, LocationByOffset, SingleFileSourceRange, StatementMap } from './types';

export interface CoverageEntriesDescription {
    fnMap: FnMap;
    branchMap: BranchMap;
    statementMap: StatementMap;
    modifiersStatementIds: number[];
}

enum BranchType {
    If = 'if',
    ConditionalExpression = 'cond-expr',
    BinaryExpression = 'binary-expr',
}

export class ASTVisitor {
    private _entryId = 0;
    private _fnMap: FnMap = {};
    private _branchMap: BranchMap = {};
    private _modifiersStatementIds: number[] = [];
    private _statementMap: StatementMap = {};
    private _locationByOffset: LocationByOffset;
    constructor(locationByOffset: LocationByOffset) {
        this._locationByOffset = locationByOffset;
    }
    public getCollectedCoverageEntries(): CoverageEntriesDescription {
        const coverageEntriesDescription = {
            fnMap: this._fnMap,
            branchMap: this._branchMap,
            statementMap: this._statementMap,
            modifiersStatementIds: this._modifiersStatementIds,
        };
        return coverageEntriesDescription;
    }
    public IfStatement(ast: Parser.IfStatement): void {
        this._visitStatement(ast);
        this._visitBinaryBranch(ast, ast.trueBody, ast.falseBody || ast, BranchType.If);
    }
    public FunctionDefinition(ast: Parser.FunctionDefinition): void {
        this._visitFunctionLikeDefinition(ast);
    }
    public ModifierDefinition(ast: Parser.ModifierDefinition): void {
        this._visitFunctionLikeDefinition(ast);
    }
    public ForStatement(ast: Parser.ForStatement): void {
        this._visitStatement(ast);
    }
    public ReturnStatement(ast: Parser.ReturnStatement): void {
        this._visitStatement(ast);
    }
    public BreakStatement(ast: Parser.BreakStatement): void {
        this._visitStatement(ast);
    }
    public ContinueStatement(ast: Parser.ContinueStatement): void {
        this._visitStatement(ast);
    }
    public VariableDeclarationStatement(ast: Parser.VariableDeclarationStatement): void {
        this._visitStatement(ast);
    }
    public Statement(ast: Parser.Statement): void {
        this._visitStatement(ast);
    }
    public WhileStatement(ast: Parser.WhileStatement): void {
        this._visitStatement(ast);
    }
    public SimpleStatement(ast: Parser.SimpleStatement): void {
        this._visitStatement(ast);
    }
    public ThrowStatement(ast: Parser.ThrowStatement): void {
        this._visitStatement(ast);
    }
    public DoWhileStatement(ast: Parser.DoWhileStatement): void {
        this._visitStatement(ast);
    }
    public ExpressionStatement(ast: Parser.ExpressionStatement): void {
        this._visitStatement(ast.expression);
    }
    public InlineAssemblyStatement(ast: Parser.InlineAssemblyStatement): void {
        this._visitStatement(ast);
    }
    public BinaryOperation(ast: Parser.BinaryOperation): void {
        const BRANCHING_BIN_OPS = ['&&', '||'];
        if (_.includes(BRANCHING_BIN_OPS, ast.operator)) {
            this._visitBinaryBranch(ast, ast.left, ast.right, BranchType.BinaryExpression);
        }
    }
    public Conditional(ast: Parser.Conditional): void {
        this._visitBinaryBranch(ast, ast.trueExpression, ast.falseExpression, BranchType.ConditionalExpression);
    }
    public ModifierInvocation(ast: Parser.ModifierInvocation): void {
        const BUILTIN_MODIFIERS = ['public', 'view', 'payable', 'external', 'internal', 'pure', 'constant'];
        if (!_.includes(BUILTIN_MODIFIERS, ast.name)) {
            this._modifiersStatementIds.push(this._entryId);
            this._visitStatement(ast);
        }
    }
    private _visitBinaryBranch(
        ast: Parser.ASTNode,
        left: Parser.ASTNode,
        right: Parser.ASTNode,
        type: BranchType,
    ): void {
        this._branchMap[this._entryId++] = {
            line: this._getExpressionRange(ast).start.line,
            type,
            locations: [this._getExpressionRange(left), this._getExpressionRange(right)],
        };
    }
    private _visitStatement(ast: Parser.ASTNode): void {
        this._statementMap[this._entryId++] = this._getExpressionRange(ast);
    }
    private _getExpressionRange(ast: Parser.ASTNode): SingleFileSourceRange {
        const start = this._locationByOffset[ast.range[0]];
        const end = this._locationByOffset[ast.range[1] + 1];
        const range = {
            start,
            end,
        };
        return range;
    }
    private _visitFunctionLikeDefinition(ast: Parser.ModifierDefinition | Parser.FunctionDefinition): void {
        const loc = this._getExpressionRange(ast);
        this._fnMap[this._entryId++] = {
            name: ast.name,
            line: loc.start.line,
            loc,
        };
        this._visitStatement(ast);
    }
}
