import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';
import * as Parser from 'solidity-parser-antlr';

import { SingleFileSourceRange, SourceRange, SourceSnippet } from './types';
import { utils } from './utils';

interface ASTInfo {
    type: string;
    node: Parser.ASTNode;
    name: string | null;
    range?: SingleFileSourceRange;
}

// Parsing source code for each transaction/code is slow and therefore we cache it
const parsedSourceByHash: { [sourceHash: string]: Parser.ASTNode } = {};

export function getSourceRangeSnippet(sourceRange: SourceRange, sourceCode: string): SourceSnippet | null {
    const sourceHash = ethUtil.sha3(sourceCode).toString('hex');
    if (_.isUndefined(parsedSourceByHash[sourceHash])) {
        parsedSourceByHash[sourceHash] = Parser.parse(sourceCode, { loc: true });
    }
    const astNode = parsedSourceByHash[sourceHash];
    const visitor = new ASTInfoVisitor();
    Parser.visit(astNode, visitor);
    const astInfo = visitor.getASTInfoForRange(sourceRange);
    if (astInfo === null) {
        return null;
    }
    const sourceCodeInRange = utils.getRange(sourceCode, sourceRange.location);
    return {
        ...astInfo,
        range: astInfo.range as SingleFileSourceRange,
        source: sourceCodeInRange,
        fileName: sourceRange.fileName,
    };
}

// A visitor which collects ASTInfo for most nodes in the AST.
class ASTInfoVisitor {
    private readonly _astInfos: ASTInfo[] = [];
    public getASTInfoForRange(sourceRange: SourceRange): ASTInfo | null {
        // HACK(albrow): Sometimes the source range doesn't exactly match that
        // of astInfo. To work around that we try with a +/-1 offset on
        // end.column. If nothing matches even with the offset, we return null.
        const offset = {
            start: {
                line: 0,
                column: 0,
            },
            end: {
                line: 0,
                column: 0,
            },
        };
        let astInfo = this._getASTInfoForRange(sourceRange, offset);
        if (astInfo !== null) {
            return astInfo;
        }
        offset.end.column += 1;
        astInfo = this._getASTInfoForRange(sourceRange, offset);
        if (astInfo !== null) {
            return astInfo;
        }
        offset.end.column -= 2;
        astInfo = this._getASTInfoForRange(sourceRange, offset);
        if (astInfo !== null) {
            return astInfo;
        }
        return null;
    }
    public ContractDefinition(ast: Parser.ContractDefinition): void {
        this._visitContractDefinition(ast);
    }
    public IfStatement(ast: Parser.IfStatement): void {
        this._visitStatement(ast);
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
    public EmitStatement(ast: any /* TODO: Parser.EmitStatement */): void {
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
    public ModifierInvocation(ast: Parser.ModifierInvocation): void {
        const BUILTIN_MODIFIERS = ['public', 'view', 'payable', 'external', 'internal', 'pure', 'constant'];
        if (!_.includes(BUILTIN_MODIFIERS, ast.name)) {
            this._visitStatement(ast);
        }
    }
    private _visitStatement(ast: Parser.ASTNode): void {
        this._astInfos.push({
            type: ast.type,
            node: ast,
            name: null,
            range: ast.loc,
        });
    }
    private _visitFunctionLikeDefinition(ast: Parser.ModifierDefinition | Parser.FunctionDefinition): void {
        this._astInfos.push({
            type: ast.type,
            node: ast,
            name: ast.name,
            range: ast.loc,
        });
    }
    private _visitContractDefinition(ast: Parser.ContractDefinition): void {
        this._astInfos.push({
            type: ast.type,
            node: ast,
            name: ast.name,
            range: ast.loc,
        });
    }
    private _getASTInfoForRange(sourceRange: SourceRange, offset: SingleFileSourceRange): ASTInfo | null {
        const offsetSourceRange = {
            ...sourceRange,
            location: {
                start: {
                    line: sourceRange.location.start.line + offset.start.line,
                    column: sourceRange.location.start.column + offset.start.column,
                },
                end: {
                    line: sourceRange.location.end.line + offset.end.line,
                    column: sourceRange.location.end.column + offset.end.column,
                },
            },
        };
        for (const astInfo of this._astInfos) {
            const astInfoRange = astInfo.range as SingleFileSourceRange;
            if (
                astInfoRange.start.column === offsetSourceRange.location.start.column &&
                astInfoRange.start.line === offsetSourceRange.location.start.line &&
                astInfoRange.end.column === offsetSourceRange.location.end.column &&
                astInfoRange.end.line === offsetSourceRange.location.end.line
            ) {
                return astInfo;
            }
        }
        return null;
    }
}
