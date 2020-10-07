import * as _ from 'lodash';
import * as Parser from 'solidity-parser-antlr';

import { BranchMap, FnMap, OffsetToLocation, SingleFileSourceRange, StatementMap } from './types';

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
    private readonly _fnMap: FnMap = {};
    private readonly _branchMap: BranchMap = {};
    private readonly _modifiersStatementIds: number[] = [];
    private readonly _statementMap: StatementMap = {};
    private readonly _offsetToLocation: OffsetToLocation;
    private readonly _ignoreRangesBeginningAt: number[];
    // keep track of contract/function ranges that are to be ignored
    // so we can also ignore any children nodes within the contract/function
    private readonly _ignoreRangesWithin: Array<[number, number]> = [];
    constructor(offsetToLocation: OffsetToLocation, ignoreRangesBeginningAt: number[] = []) {
        this._offsetToLocation = offsetToLocation;
        this._ignoreRangesBeginningAt = ignoreRangesBeginningAt;
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
    public ContractDefinition(ast: Parser.ContractDefinition): void {
        if (this._shouldIgnoreExpression(ast)) {
            this._ignoreRangesWithin.push(ast.range as [number, number]);
        }
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
    public EmitStatement(ast: any /* TODO: Parser.EmitStatement */): void {
        this._visitStatement(ast);
    }
    public VariableDeclarationStatement(ast: Parser.VariableDeclarationStatement): void {
        this._visitStatement(ast);
    }
    public WhileStatement(ast: Parser.WhileStatement): void {
        this._visitStatement(ast);
    }
    public ThrowStatement(ast: Parser.ThrowStatement): void {
        this._visitStatement(ast);
    }
    public DoWhileStatement(ast: Parser.DoWhileStatement): void {
        this._visitStatement(ast);
    }
    public ExpressionStatement(ast: Parser.ExpressionStatement): void {
        if (ast.expression !== null) {
            this._visitStatement(ast.expression);
        }
    }
    public InlineAssemblyStatement(ast: Parser.InlineAssemblyStatement): void {
        this._visitStatement(ast);
    }
    public AssemblyLocalDefinition(ast: Parser.AssemblyLocalDefinition): void {
        this._visitStatement(ast);
    }
    public AssemblyCall(ast: Parser.AssemblyCall): void {
        this._visitStatement(ast);
    }
    public AssemblyIf(ast: Parser.AssemblyIf): void {
        this._visitStatement(ast);
    }
    public AssemblyBlock(ast: Parser.AssemblyBlock): void {
        this._visitStatement(ast);
    }
    public AssemblyAssignment(ast: Parser.AssemblyAssignment): void {
        this._visitStatement(ast);
    }
    public LabelDefinition(ast: Parser.LabelDefinition): void {
        this._visitStatement(ast);
    }
    public AssemblySwitch(ast: Parser.AssemblySwitch): void {
        this._visitStatement(ast);
    }
    public AssemblyFunctionDefinition(ast: Parser.AssemblyFunctionDefinition): void {
        this._visitStatement(ast);
    }
    public AssemblyFor(ast: Parser.AssemblyFor): void {
        this._visitStatement(ast);
    }
    public SubAssembly(ast: Parser.SubAssembly): void {
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
            if (this._shouldIgnoreExpression(ast)) {
                return;
            }
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
        if (this._shouldIgnoreExpression(ast)) {
            return;
        }
        this._branchMap[this._entryId++] = {
            line: this._getExpressionRange(ast).start.line,
            type,
            locations: [this._getExpressionRange(left), this._getExpressionRange(right)],
        };
    }
    private _visitStatement(ast: Parser.ASTNode): void {
        if (this._shouldIgnoreExpression(ast)) {
            return;
        }
        this._statementMap[this._entryId++] = this._getExpressionRange(ast);
    }
    private _getExpressionRange(ast: Parser.ASTNode): SingleFileSourceRange {
        const astRange = ast.range as [number, number];
        const start = this._offsetToLocation[astRange[0]];
        const end = this._offsetToLocation[astRange[1] + 1];
        const range = {
            start,
            end,
        };
        return range;
    }
    private _shouldIgnoreExpression(ast: Parser.ASTNode): boolean {
        const [astStart, astEnd] = ast.range as [number, number];
        const isRangeIgnored = _.some(
            this._ignoreRangesWithin,
            ([rangeStart, rangeEnd]: [number, number]) => astStart >= rangeStart && astEnd <= rangeEnd,
        );
        return this._ignoreRangesBeginningAt.includes(astStart) || isRangeIgnored;
    }
    private _visitFunctionLikeDefinition(ast: Parser.ModifierDefinition | Parser.FunctionDefinition): void {
        if (this._shouldIgnoreExpression(ast)) {
            this._ignoreRangesWithin.push(ast.range as [number, number]);
            return;
        }
        const loc = this._getExpressionRange(ast);
        this._fnMap[this._entryId++] = {
            name: ast.name,
            line: loc.start.line,
            loc,
        };
        this._visitStatement(ast);
    }
}
