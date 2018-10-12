// Type definitions for solidity-parser-antlr 0.3.2
// Project: https://github.com/federicobond/solidity-parser-antlr
// Definitions by: Leonid Logvinov <https://github.com/LogvinovLeon>
//                 Alex Browne <https://github.com/albrow>
//                 Remco Bloemen <https://github.com/recmo>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.1

export interface LineColumn {
    line: number;
    column: number;
}
export interface Location {
    start: LineColumn;
    end: LineColumn;
}
export enum NodeType {
    SourceUnit = 'SourceUnit',
    PragmaDirective = 'PragmaDirective',
    PragmaName = 'PragmaName',
    PragmaValue = 'PragmaValue',
    Version = 'Version',
    VersionOperator = 'VersionOperator',
    VersionConstraint = 'VersionConstraint',
    ImportDeclaration = 'ImportDeclaration',
    ImportDirective = 'ImportDirective',
    ContractDefinition = 'ContractDefinition',
    InheritanceSpecifier = 'InheritanceSpecifier',
    ContractPart = 'ContractPart',
    StateVariableDeclaration = 'StateVariableDeclaration',
    UsingForDeclaration = 'UsingForDeclaration',
    StructDefinition = 'StructDefinition',
    ModifierDefinition = 'ModifierDefinition',
    ModifierInvocation = 'ModifierInvocation',
    FunctionDefinition = 'FunctionDefinition',
    ReturnParameters = 'ReturnParameters',
    ModifierList = 'ModifierList',
    EventDefinition = 'EventDefinition',
    EnumValue = 'EnumValue',
    EnumDefinition = 'EnumDefinition',
    ParameterList = 'ParameterList',
    Parameter = 'Parameter',
    EventParameterList = 'EventParameterList',
    EventParameter = 'EventParameter',
    FunctionTypeParameterList = 'FunctionTypeParameterList',
    FunctionTypeParameter = 'FunctionTypeParameter',
    VariableDeclaration = 'VariableDeclaration',
    TypeName = 'TypeName',
    UserDefinedTypeName = 'UserDefinedTypeName',
    Mapping = 'Mapping',
    FunctionTypeName = 'FunctionTypeName',
    StorageLocation = 'StorageLocation',
    StateMutability = 'StateMutability',
    Block = 'Block',
    ExpressionStatement = 'ExpressionStatement',
    IfStatement = 'IfStatement',
    WhileStatement = 'WhileStatement',
    SimpleStatement = 'SimpleStatement',
    ForStatement = 'ForStatement',
    InlineAssemblyStatement = 'InlineAssemblyStatement',
    DoWhileStatement = 'DoWhileStatement',
    ContinueStatement = 'ContinueStatement',
    BreakStatement = 'BreakStatement',
    ReturnStatement = 'ReturnStatement',
    ThrowStatement = 'ThrowStatement',
    EmitStatement = 'EmitStatement',
    VariableDeclarationStatement = 'VariableDeclarationStatement',
    IdentifierList = 'IdentifierList',
    ElementaryTypeName = 'ElementaryTypeName',
    PrimaryExpression = 'PrimaryExpression',
    ExpressionList = 'ExpressionList',
    NameValueList = 'NameValueList',
    NameValue = 'NameValue',
    FunctionCall = 'FunctionCall',
    AssemblyBlock = 'AssemblyBlock',
    AssemblyItem = 'AssemblyItem',
    AssemblyExpression = 'AssemblyExpression',
    AssemblyCall = 'AssemblyCall',
    AssemblyLocalDefinition = 'AssemblyLocalDefinition',
    AssemblyAssignment = 'AssemblyAssignment',
    AssemblyIdentifierOrList = 'AssemblyIdentifierOrList',
    AssemblyIdentifierList = 'AssemblyIdentifierList',
    AssemblyStackAssignment = 'AssemblyStackAssignment',
    LabelDefinition = 'LabelDefinition',
    AssemblySwitch = 'AssemblySwitch',
    AssemblyCase = 'AssemblyCase',
    AssemblyFunctionDefinition = 'AssemblyFunctionDefinition',
    AssemblyFunctionReturns = 'AssemblyFunctionReturns',
    AssemblyFor = 'AssemblyFor',
    AssemblyIf = 'AssemblyIf',
    AssemblyLiteral = 'AssemblyLiteral',
    SubAssembly = 'SubAssembly',
    TupleExpression = 'TupleExpression',
    ElementaryTypeNameExpression = 'ElementaryTypeNameExpression',
    BooleanLiteral = 'BooleanLiteral',
    NumberLiteral = 'NumberLiteral',
    Identifier = 'Identifier',
    BinaryOperation = 'BinaryOperation',
    Conditional = 'Conditional',
}

export interface BaseASTNode {
    type: NodeType;
    range?: [number, number];
    loc?: Location;
}
export interface SourceUnit extends BaseASTNode {
    type: NodeType.SourceUnit;
    children: SourceMembers[];
}
export interface PragmaDirective extends BaseASTNode {
    type: NodeType.PragmaDirective;
    name: string;
    value: string;
}
export interface PragmaName extends BaseASTNode {
    type: NodeType.PragmaName;
}
export interface PragmaValue extends BaseASTNode {
    type: NodeType.PragmaValue;
}
export interface Version extends BaseASTNode {
    type: NodeType.Version;
}
export interface VersionOperator extends BaseASTNode {
    type: NodeType.VersionOperator;
}
export interface VersionConstraint extends BaseASTNode {
    type: NodeType.VersionConstraint;
}
export interface ImportDeclaration extends BaseASTNode {
    type: NodeType.ImportDeclaration;
}
export interface ImportDirective extends BaseASTNode {
    type: NodeType.ImportDirective;
    path: string;
}
export interface ContractDefinition extends BaseASTNode {
    type: NodeType.ContractDefinition;
    name: string;
    kind: string;
    baseContracts: InheritanceSpecifier[];
    subNodes: ContractMembers[]
}
export interface InheritanceSpecifier extends BaseASTNode {
    type: NodeType.InheritanceSpecifier;
}
export interface ContractPart extends BaseASTNode {
    type: NodeType.ContractPart;
}
export interface StateVariableDeclaration extends BaseASTNode {
    type: NodeType.StateVariableDeclaration;
    variables: VariableDeclaration[];
}
export interface UsingForDeclaration extends BaseASTNode {
    type: NodeType.UsingForDeclaration;
}
export interface StructDefinition extends BaseASTNode {
    type: NodeType.StructDefinition;
}
export interface ModifierDefinition extends BaseASTNode {
    type: NodeType.ModifierDefinition;
    name: string;
}
export interface ModifierInvocation extends BaseASTNode {
    type: NodeType.ModifierInvocation;
    name: string;
}
export interface FunctionDefinition extends BaseASTNode {
    type: NodeType.FunctionDefinition;
    name: string;
    body: Block | null;
}
export interface ReturnParameters extends BaseASTNode {
    type: NodeType.ReturnParameters;
}
export interface ModifierList extends BaseASTNode {
    type: NodeType.ModifierList;
}
export interface EventDefinition extends BaseASTNode {
    type: NodeType.EventDefinition;
}
export interface EnumValue extends BaseASTNode {
    type: NodeType.EnumValue;
    name: string;
}
export interface EnumDefinition extends BaseASTNode {
    type: NodeType.EnumDefinition;
    name: string;
    members: ASTNode[];
}
export interface ParameterList extends BaseASTNode {
    type: NodeType.ParameterList;
}
export interface Parameter extends BaseASTNode {
    type: NodeType.Parameter;
}
export interface EventParameterList extends BaseASTNode {
    type: NodeType.EventParameterList;
}
export interface EventParameter extends BaseASTNode {
    type: NodeType.EventParameter;
}
export interface FunctionTypeParameterList extends BaseASTNode {
    type: NodeType.FunctionTypeParameterList;
}
export interface FunctionTypeParameter extends BaseASTNode {
    type: NodeType.FunctionTypeParameter;
}
export interface VariableDeclaration extends BaseASTNode {
    type: NodeType.VariableDeclaration;
    visibility: 'public' | 'private' | 'default' | 'internal';
    isStateVar: boolean;
}
export interface TypeName extends BaseASTNode {
    type: NodeType.TypeName;
}
export interface UserDefinedTypeName extends BaseASTNode {
    type: NodeType.UserDefinedTypeName;
}
export interface Mapping extends BaseASTNode {
    type: NodeType.Mapping;
}
export interface FunctionTypeName extends BaseASTNode {
    type: NodeType.FunctionTypeName;
}
export interface StorageLocation extends BaseASTNode {
    type: NodeType.StorageLocation;
}
export interface StateMutability extends BaseASTNode {
    type: NodeType.StateMutability;
}
export interface Block extends BaseASTNode {
    type: NodeType.Block;
}
export interface ExpressionStatement extends BaseASTNode {
    type: NodeType.ExpressionStatement;
    expression: ASTNode;
}
export interface IfStatement extends BaseASTNode {
    type: NodeType.IfStatement;
    trueBody: ASTNode;
    falseBody: ASTNode;
}
export interface WhileStatement extends BaseASTNode {
    type: NodeType.WhileStatement;
}
export interface SimpleStatement extends BaseASTNode {
    type: NodeType.SimpleStatement;
}
export interface ForStatement extends BaseASTNode {
    type: NodeType.ForStatement;
}
export interface InlineAssemblyStatement extends BaseASTNode {
    type: NodeType.InlineAssemblyStatement;
}
export interface DoWhileStatement extends BaseASTNode {
    type: NodeType.DoWhileStatement;
}
export interface ContinueStatement extends BaseASTNode {
    type: NodeType.ContinueStatement;
}
export interface BreakStatement extends BaseASTNode {
    type: NodeType.BreakStatement;
}
export interface ReturnStatement extends BaseASTNode {
    type: NodeType.ReturnStatement;
}
export interface ThrowStatement extends BaseASTNode {
    type: NodeType.ThrowStatement;
}
export interface EmitStatement extends BaseASTNode {
    type: NodeType.EmitStatement;
}
export interface VariableDeclarationStatement extends BaseASTNode {
    type: NodeType.VariableDeclarationStatement;
}
export interface IdentifierList extends BaseASTNode {
    type: NodeType.IdentifierList;
}
export interface ElementaryTypeName extends BaseASTNode {
    type: NodeType.ElementaryTypeName;
}
export interface Expression extends BaseASTNode {
    type: NodeType.Expression;
}
export interface PrimaryExpression extends BaseASTNode {
    type: NodeType.PrimaryExpression;
}
export interface ExpressionList extends BaseASTNode {
    type: NodeType.ExpressionList;
}
export interface NameValueList extends BaseASTNode {
    type: NodeType.NameValueList;
}
export interface NameValue extends BaseASTNode {
    type: NodeType.NameValue;
}
export interface FunctionCall extends BaseASTNode {
    type: NodeType.FunctionCall;
}
export interface AssemblyBlock extends BaseASTNode {
    type: NodeType.AssemblyBlock;
}
export interface AssemblyItem extends BaseASTNode {
    type: NodeType.AssemblyItem;
}
export interface AssemblyExpression extends BaseASTNode {
    type: NodeType.AssemblyExpression;
}
export interface AssemblyCall extends BaseASTNode {
    type: NodeType.AssemblyCall;
}
export interface AssemblyLocalDefinition extends BaseASTNode {
    type: NodeType.AssemblyLocalDefinition;
}
export interface AssemblyAssignment extends BaseASTNode {
    type: NodeType.AssemblyAssignment;
}
export interface AssemblyIdentifierOrList extends BaseASTNode {
    type: NodeType.AssemblyIdentifierOrList;
}
export interface AssemblyIdentifierList extends BaseASTNode {
    type: NodeType.AssemblyIdentifierList;
}
export interface AssemblyStackAssignment extends BaseASTNode {
    type: NodeType.AssemblyStackAssignment;
}
export interface LabelDefinition extends BaseASTNode {
    type: NodeType.LabelDefinition;
}
export interface AssemblySwitch extends BaseASTNode {
    type: NodeType.AssemblySwitch;
}
export interface AssemblyCase extends BaseASTNode {
    type: NodeType.AssemblyCase;
}
export interface AssemblyFunctionDefinition extends BaseASTNode {
    type: NodeType.AssemblyFunctionDefinition;
}
export interface AssemblyFunctionReturns extends BaseASTNode {
    type: NodeType.AssemblyFunctionReturns;
}
export interface AssemblyFor extends BaseASTNode {
    type: NodeType.AssemblyFor;
}
export interface AssemblyIf extends BaseASTNode {
    type: NodeType.AssemblyIf;
}
export interface AssemblyLiteral extends BaseASTNode {
    type: NodeType.AssemblyLiteral;
}
export interface SubAssembly extends BaseASTNode {
    type: NodeType.SubAssembly;
}
export interface TupleExpression extends BaseASTNode {
    type: NodeType.TupleExpression;
}
export interface ElementaryTypeNameExpression extends BaseASTNode {
    type: NodeType.ElementaryTypeNameExpression;
}
export interface BooleanLiteral extends BaseASTNode {
    type: NodeType.BooleanLiteral;
}
export interface NumberLiteral extends BaseASTNode {
    type: NodeType.NumberLiteral;
}
export interface Identifier extends BaseASTNode {
    type: NodeType.Identifier;
}
export type BinOp =
    | '+'
    | '-'
    | '*'
    | '/'
    | '**'
    | '%'
    | '<<'
    | '>>'
    | '&&'
    | '||'
    | '&'
    | '|'
    | '^'
    | '<'
    | '>'
    | '<='
    | '>='
    | '=='
    | '!='
    | '='
    | '|='
    | '^='
    | '&='
    | '<<='
    | '>>='
    | '+='
    | '-='
    | '*='
    | '/='
    | '%=';
export interface BinaryOperation extends BaseASTNode {
    type: NodeType.BinaryOperation;
    left: ASTNode;
    right: ASTNode;
    operator: BinOp;
}
export interface Conditional extends BaseASTNode {
    type: NodeType.Conditional;
    trueExpression: ASTNode;
    falseExpression: ASTNode;
}
export type SourceMembers =
    | PragmaDirective
    | ImportDirective
    | ContractDefinition;
export type ContractMembers =
    | UsingForDeclaration
    | StateVariableDeclaration
    | StructDefinition
    | EnumDefinition
    | EventDefinition
    | ModifierDefinition
    | FunctionDefinition;
export type Statement =
    | Block
    | VariableDeclarationStatement
    | ExpressionStatement
    | EmitStatement
    | ReturnStatement
    | BreakStatement
    | ContinueStatement
    | ThrowStatement
    | IfStatement
    | ForStatement
    | InlineAssemblyStatement
export type ASTNode =
    | SourceUnit
    | PragmaDirective
    | PragmaName
    | PragmaValue
    | Version
    | VersionOperator
    | VersionConstraint
    | ImportDeclaration
    | ImportDirective
    | ContractDefinition
    | InheritanceSpecifier
    | ContractPart
    | StateVariableDeclaration
    | UsingForDeclaration
    | StructDefinition
    | ModifierDefinition
    | ModifierInvocation
    | FunctionDefinition
    | ReturnParameters
    | ModifierList
    | EventDefinition
    | EnumValue
    | EnumDefinition
    | ParameterList
    | Parameter
    | EventParameterList
    | EventParameter
    | FunctionTypeParameterList
    | FunctionTypeParameter
    | VariableDeclaration
    | TypeName
    | UserDefinedTypeName
    | Mapping
    | FunctionTypeName
    | StorageLocation
    | StateMutability
    | Block
    | Statement
    | ExpressionStatement
    | IfStatement
    | WhileStatement
    | SimpleStatement
    | ForStatement
    | InlineAssemblyStatement
    | DoWhileStatement
    | ContinueStatement
    | BreakStatement
    | ReturnStatement
    | ThrowStatement
    | EmitStatement
    | VariableDeclarationStatement
    | IdentifierList
    | ElementaryTypeName
    | Expression
    | PrimaryExpression
    | ExpressionList
    | NameValueList
    | NameValue
    | FunctionCall
    | AssemblyBlock
    | AssemblyItem
    | AssemblyExpression
    | AssemblyCall
    | AssemblyLocalDefinition
    | AssemblyAssignment
    | AssemblyIdentifierOrList
    | AssemblyIdentifierList
    | AssemblyStackAssignment
    | LabelDefinition
    | AssemblySwitch
    | AssemblyCase
    | AssemblyFunctionDefinition
    | AssemblyFunctionReturns
    | AssemblyFor
    | AssemblyIf
    | AssemblyLiteral
    | SubAssembly
    | TupleExpression
    | ElementaryTypeNameExpression
    | BooleanLiteral
    | NumberLiteral
    | Identifier
    | BinaryOperation
    | Conditional;
export interface Visitor<T> {
    SourceUnit?: (node: SourceUnit) => T;
    PragmaDirective?: (node: PragmaDirective) => T;
    PragmaName?: (node: PragmaName) => T;
    PragmaValue?: (node: PragmaValue) => T;
    Version?: (node: Version) => T;
    VersionOperator?: (node: VersionOperator) => T;
    VersionConstraint?: (node: VersionConstraint) => T;
    ImportDeclaration?: (node: ImportDeclaration) => T;
    ImportDirective?: (node: ImportDirective) => T;
    ContractDefinition?: (node: ContractDefinition) => T;
    InheritanceSpecifier?: (node: InheritanceSpecifier) => T;
    ContractPart?: (node: ContractPart) => T;
    StateVariableDeclaration?: (node: StateVariableDeclaration) => T;
    UsingForDeclaration?: (node: UsingForDeclaration) => T;
    StructDefinition?: (node: StructDefinition) => T;
    ModifierDefinition?: (node: ModifierDefinition) => T;
    ModifierInvocation?: (node: ModifierInvocation) => T;
    FunctionDefinition?: (node: FunctionDefinition) => T;
    ReturnParameters?: (node: ReturnParameters) => T;
    ModifierList?: (node: ModifierList) => T;
    EventDefinition?: (node: EventDefinition) => T;
    EnumValue?: (node: EnumValue) => T;
    EnumDefinition?: (node: EnumDefinition) => T;
    ParameterList?: (node: ParameterList) => T;
    Parameter?: (node: Parameter) => T;
    EventParameterList?: (node: EventParameterList) => T;
    EventParameter?: (node: EventParameter) => T;
    FunctionTypeParameterList?: (node: FunctionTypeParameterList) => T;
    FunctionTypeParameter?: (node: FunctionTypeParameter) => T;
    VariableDeclaration?: (node: VariableDeclaration) => T;
    TypeName?: (node: TypeName) => T;
    UserDefinedTypeName?: (node: UserDefinedTypeName) => T;
    Mapping?: (node: Mapping) => T;
    FunctionTypeName?: (node: FunctionTypeName) => T;
    StorageLocation?: (node: StorageLocation) => T;
    StateMutability?: (node: StateMutability) => T;
    Block?: (node: Block) => T;
    ExpressionStatement?: (node: ExpressionStatement) => T;
    IfStatement?: (node: IfStatement) => T;
    WhileStatement?: (node: WhileStatement) => T;
    SimpleStatement?: (node: SimpleStatement) => T;
    ForStatement?: (node: ForStatement) => T;
    InlineAssemblyStatement?: (node: InlineAssemblyStatement) => T;
    DoWhileStatement?: (node: DoWhileStatement) => T;
    ContinueStatement?: (node: ContinueStatement) => T;
    BreakStatement?: (node: BreakStatement) => T;
    ReturnStatement?: (node: ReturnStatement) => T;
    ThrowStatement?: (node: ThrowStatement) => T;
    VariableDeclarationStatement?: (node: VariableDeclarationStatement) => T;
    IdentifierList?: (node: IdentifierList) => T;
    ElementaryTypeName?: (node: ElementaryTypeName) => T;
    Expression?: (node: Expression) => T;
    PrimaryExpression?: (node: PrimaryExpression) => T;
    ExpressionList?: (node: ExpressionList) => T;
    NameValueList?: (node: NameValueList) => T;
    NameValue?: (node: NameValue) => T;
    FunctionCall?: (node: FunctionCall) => T;
    AssemblyBlock?: (node: AssemblyBlock) => T;
    AssemblyItem?: (node: AssemblyItem) => T;
    AssemblyExpression?: (node: AssemblyExpression) => T;
    AssemblyCall?: (node: AssemblyCall) => T;
    AssemblyLocalDefinition?: (node: AssemblyLocalDefinition) => T;
    AssemblyAssignment?: (node: AssemblyAssignment) => T;
    AssemblyIdentifierOrList?: (node: AssemblyIdentifierOrList) => T;
    AssemblyIdentifierList?: (node: AssemblyIdentifierList) => T;
    AssemblyStackAssignment?: (node: AssemblyStackAssignment) => T;
    LabelDefinition?: (node: LabelDefinition) => T;
    AssemblySwitch?: (node: AssemblySwitch) => T;
    AssemblyCase?: (node: AssemblyCase) => T;
    AssemblyFunctionDefinition?: (node: AssemblyFunctionDefinition) => T;
    AssemblyFunctionReturns?: (node: AssemblyFunctionReturns) => T;
    AssemblyFor?: (node: AssemblyFor) => T;
    AssemblyIf?: (node: AssemblyIf) => T;
    AssemblyLiteral?: (node: AssemblyLiteral) => T;
    SubAssembly?: (node: SubAssembly) => T;
    TupleExpression?: (node: TupleExpression) => T;
    ElementaryTypeNameExpression?: (node: ElementaryTypeNameExpression) => T;
    BooleanLiteral?: (node: BooleanLiteral) => T;
    NumberLiteral?: (node: NumberLiteral) => T;
    Identifier?: (node: Identifier) => T;
    BinaryOperation?: (node: BinaryOperation) => T;
    Conditional?: (node: Conditional) => T;
}
export interface ParserOpts {
    tolerant?: boolean;
    range?: boolean;
    loc?: boolean;
}
export function parse(sourceCode: string, parserOpts: ParserOpts): ASTNode;
export function visit(ast: ASTNode, visitor: Visitor<void>): void;
