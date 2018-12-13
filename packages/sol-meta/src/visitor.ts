import * as S from 'solidity-parser-antlr';

export interface Visitor<T> extends S.Visitor<T> {
    SourceMember?: (node: S.SourceMember) => T;
    ContractMember?: (node: S.ContractMember) => T;
    Statement?: (node: S.Statement) => T;
    Expression?: (node: S.Expression) => T;
    Type?: (node: S.Type) => T;
    AssemblyStatement?: (node: S.AssemblyStatement) => T;
    AssemblyExpression?: (node: S.AssemblyExpression) => T;
    ASTNode?: (node: S.ASTNode) => T;
}

export const isSourceMember = (node: S.ASTNode): node is S.SourceMember =>
    [S.NodeType.PragmaDirective, S.NodeType.ImportDirective, S.NodeType.ContractDefinition].includes(node.type);

export const isContractMember = (node: S.ASTNode): node is S.ContractMember =>
    [
        S.NodeType.UsingForDeclaration,
        S.NodeType.StateVariableDeclaration,
        S.NodeType.StructDefinition,
        S.NodeType.EnumDefinition,
        S.NodeType.EventDefinition,
        S.NodeType.ModifierDefinition,
        S.NodeType.FunctionDefinition,
    ].includes(node.type);

export const isStatement = (node: S.ASTNode): node is S.Statement =>
    [
        S.NodeType.Block,
        S.NodeType.VariableDeclarationStatement,
        S.NodeType.ExpressionStatement,
        S.NodeType.EmitStatement,
        S.NodeType.ReturnStatement,
        S.NodeType.BreakStatement,
        S.NodeType.ContinueStatement,
        S.NodeType.ThrowStatement,
        S.NodeType.IfStatement,
        S.NodeType.ForStatement,
        S.NodeType.InlineAssemblyStatement,
    ].includes(node.type);

export const isExpression = (node: S.ASTNode): node is S.Expression =>
    [
        S.NodeType.BooleanLiteral,
        S.NodeType.NumberLiteral,
        S.NodeType.StringLiteral,
        S.NodeType.Identifier,
        S.NodeType.FunctionCall,
        S.NodeType.Conditional,
        S.NodeType.UnaryOperation,
        S.NodeType.BinaryOperation,
        S.NodeType.MemberAccess,
        S.NodeType.IndexAccess,
        S.NodeType.ElementaryTypeNameExpression,
        S.NodeType.VariableDeclaration,
        S.NodeType.NewExpression,
        S.NodeType.TupleExpression,
        S.NodeType.IndexAccess,
        S.NodeType.MemberAccess,
    ].includes(node);

export const isType = (node: S.ASTNode): node is S.Type =>
    [
        S.NodeType.ElementaryTypeName,
        S.NodeType.UserDefinedTypeName,
        S.NodeType.Mapping,
        S.NodeType.ArrayTypeName,
        S.NodeType.FunctionTypeName,
    ].includes(node);

export const isAssemblyStatement = (node: S.ASTNode): node is S.AssemblyStatement =>
    [
        S.NodeType.AssemblyCall, // Note: also an expression!
        S.NodeType.AssemblyAssignment,
        S.NodeType.AssemblyLocalDefinition,
        S.NodeType.AssemblyIf,
        S.NodeType.AssemblyFor,
        S.NodeType.AssemblySwitch,
        S.NodeType.AssemblyCase,
    ].includes(node);

export const isAssemblyExpression = (node: S.ASTNode): node is S.AssemblyExpression =>
    [
        S.NodeType.AssemblyCall, // Note: also a statement!
        S.NodeType.DecimalNumber,
        S.NodeType.HexNumber,
    ].includes(node);

/**
 * Dispatches based on node type.
 * @param node The node to dispatch on.
 * @param visitor A structure containing handlers for different node types.
 */
export function visit<T>(node: S.ASTNode, visitor: Visitor<T>): T {
    // Try to dispatch on the exact type
    const indexed = visitor as { [type: string]: (node: S.ASTNode) => T };
    if (indexed[node.type]) {
        return indexed[node.type](node);
    }

    // Try to dispatch on classes of nodes, picking the first match
    if (isSourceMember(node) && visitor.SourceMember) {
        return visitor.SourceMember(node);
    }
    if (isContractMember(node) && visitor.ContractMember) {
        return visitor.ContractMember(node);
    }
    if (isStatement(node) && visitor.Statement) {
        return visitor.Statement(node);
    }
    if (isExpression(node) && visitor.Expression) {
        return visitor.Expression(node);
    }
    if (isType(node) && visitor.Type) {
        return visitor.Type(node);
    }
    if (isAssemblyStatement(node) && visitor.AssemblyStatement) {
        return visitor.AssemblyStatement(node);
    }
    if (isAssemblyExpression(node) && visitor.AssemblyExpression) {
        return visitor.AssemblyExpression(node);
    }
    if (visitor.ASTNode) {
        return visitor.ASTNode(node);
    }
    throw new Error(`No matching visitor found for ${node.type}.`);
}
