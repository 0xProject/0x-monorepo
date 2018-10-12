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
    Statement = 'Statement',
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
    VariableDeclarationStatement = 'VariableDeclarationStatement',
    IdentifierList = 'IdentifierList',
    ElementaryTypeName = 'ElementaryTypeName',
    Expression = 'Expression',
    PrimaryExpression = 'PrimaryExpression',
    ExpressionList = 'ExpressionList',
    NameValueList = 'NameValueList',
    NameValue = 'NameValue',
    FunctionCallArguments = 'FunctionCallArguments',
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
    children: ASTNode[];
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
    baseContracts: [string];
    subNodes: [string];
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
    members: [ASTNode];
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
export interface Statement extends BaseASTNode {
    type: NodeType.Statement;
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
export interface FunctionCallArguments extends BaseASTNode {
    type: NodeType.FunctionCallArguments;
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
    | VariableDeclarationStatement
    | IdentifierList
    | ElementaryTypeName
    | Expression
    | PrimaryExpression
    | ExpressionList
    | NameValueList
    | NameValue
    | FunctionCallArguments
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
    | NumberLiteral
    | Identifier
    | BinaryOperation
    | Conditional;
export interface Visitor {
    SourceUnit?: (node: SourceUnit) => void;
    PragmaDirective?: (node: PragmaDirective) => void;
    PragmaName?: (node: PragmaName) => void;
    PragmaValue?: (node: PragmaValue) => void;
    Version?: (node: Version) => void;
    VersionOperator?: (node: VersionOperator) => void;
    VersionConstraint?: (node: VersionConstraint) => void;
    ImportDeclaration?: (node: ImportDeclaration) => void;
    ImportDirective?: (node: ImportDirective) => void;
    ContractDefinition?: (node: ContractDefinition) => void;
    InheritanceSpecifier?: (node: InheritanceSpecifier) => void;
    ContractPart?: (node: ContractPart) => void;
    StateVariableDeclaration?: (node: StateVariableDeclaration) => void;
    UsingForDeclaration?: (node: UsingForDeclaration) => void;
    StructDefinition?: (node: StructDefinition) => void;
    ModifierDefinition?: (node: ModifierDefinition) => void;
    ModifierInvocation?: (node: ModifierInvocation) => void;
    FunctionDefinition?: (node: FunctionDefinition) => void;
    ReturnParameters?: (node: ReturnParameters) => void;
    ModifierList?: (node: ModifierList) => void;
    EventDefinition?: (node: EventDefinition) => void;
    EnumValue?: (node: EnumValue) => void;
    EnumDefinition?: (node: EnumDefinition) => void;
    ParameterList?: (node: ParameterList) => void;
    Parameter?: (node: Parameter) => void;
    EventParameterList?: (node: EventParameterList) => void;
    EventParameter?: (node: EventParameter) => void;
    FunctionTypeParameterList?: (node: FunctionTypeParameterList) => void;
    FunctionTypeParameter?: (node: FunctionTypeParameter) => void;
    VariableDeclaration?: (node: VariableDeclaration) => void;
    TypeName?: (node: TypeName) => void;
    UserDefinedTypeName?: (node: UserDefinedTypeName) => void;
    Mapping?: (node: Mapping) => void;
    FunctionTypeName?: (node: FunctionTypeName) => void;
    StorageLocation?: (node: StorageLocation) => void;
    StateMutability?: (node: StateMutability) => void;
    Block?: (node: Block) => void;
    Statement?: (node: Statement) => void;
    ExpressionStatement?: (node: ExpressionStatement) => void;
    IfStatement?: (node: IfStatement) => void;
    WhileStatement?: (node: WhileStatement) => void;
    SimpleStatement?: (node: SimpleStatement) => void;
    ForStatement?: (node: ForStatement) => void;
    InlineAssemblyStatement?: (node: InlineAssemblyStatement) => void;
    DoWhileStatement?: (node: DoWhileStatement) => void;
    ContinueStatement?: (node: ContinueStatement) => void;
    BreakStatement?: (node: BreakStatement) => void;
    ReturnStatement?: (node: ReturnStatement) => void;
    ThrowStatement?: (node: ThrowStatement) => void;
    VariableDeclarationStatement?: (node: VariableDeclarationStatement) => void;
    IdentifierList?: (node: IdentifierList) => void;
    ElementaryTypeName?: (node: ElementaryTypeName) => void;
    Expression?: (node: Expression) => void;
    PrimaryExpression?: (node: PrimaryExpression) => void;
    ExpressionList?: (node: ExpressionList) => void;
    NameValueList?: (node: NameValueList) => void;
    NameValue?: (node: NameValue) => void;
    FunctionCallArguments?: (node: FunctionCallArguments) => void;
    AssemblyBlock?: (node: AssemblyBlock) => void;
    AssemblyItem?: (node: AssemblyItem) => void;
    AssemblyExpression?: (node: AssemblyExpression) => void;
    AssemblyCall?: (node: AssemblyCall) => void;
    AssemblyLocalDefinition?: (node: AssemblyLocalDefinition) => void;
    AssemblyAssignment?: (node: AssemblyAssignment) => void;
    AssemblyIdentifierOrList?: (node: AssemblyIdentifierOrList) => void;
    AssemblyIdentifierList?: (node: AssemblyIdentifierList) => void;
    AssemblyStackAssignment?: (node: AssemblyStackAssignment) => void;
    LabelDefinition?: (node: LabelDefinition) => void;
    AssemblySwitch?: (node: AssemblySwitch) => void;
    AssemblyCase?: (node: AssemblyCase) => void;
    AssemblyFunctionDefinition?: (node: AssemblyFunctionDefinition) => void;
    AssemblyFunctionReturns?: (node: AssemblyFunctionReturns) => void;
    AssemblyFor?: (node: AssemblyFor) => void;
    AssemblyIf?: (node: AssemblyIf) => void;
    AssemblyLiteral?: (node: AssemblyLiteral) => void;
    SubAssembly?: (node: SubAssembly) => void;
    TupleExpression?: (node: TupleExpression) => void;
    ElementaryTypeNameExpression?: (node: ElementaryTypeNameExpression) => void;
    NumberLiteral?: (node: NumberLiteral) => void;
    Identifier?: (node: Identifier) => void;
    BinaryOperation?: (node: BinaryOperation) => void;
    Conditional?: (node: Conditional) => void;
}
export interface ParserOpts {
    tolerant?: boolean;
    range?: boolean;
    loc?: boolean;
}
export function parse(sourceCode: string, parserOpts: ParserOpts): ASTNode;
export function visit(ast: ASTNode, visitor: Visitor): void;
