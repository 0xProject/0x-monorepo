declare module 'solidity-parser-antlr' {
    export interface BaseASTNode {
        range: [number, number];
    }
    export interface SourceUnit extends BaseASTNode {}
    export interface PragmaDirective extends BaseASTNode {}
    export interface PragmaName extends BaseASTNode {}
    export interface PragmaValue extends BaseASTNode {}
    export interface Version extends BaseASTNode {}
    export interface VersionOperator extends BaseASTNode {}
    export interface VersionConstraint extends BaseASTNode {}
    export interface ImportDeclaration extends BaseASTNode {}
    export interface ImportDirective extends BaseASTNode {}
    export interface ContractDefinition extends BaseASTNode {}
    export interface InheritanceSpecifier extends BaseASTNode {}
    export interface ContractPart extends BaseASTNode {}
    export interface StateVariableDeclaration extends BaseASTNode {
        variables: VariableDeclaration[];
    }
    export interface UsingForDeclaration extends BaseASTNode {}
    export interface StructDefinition extends BaseASTNode {}
    export interface ModifierDefinition extends BaseASTNode {
        name: string;
    }
    export interface ModifierInvocation extends BaseASTNode {
        name: string;
    }
    export interface FunctionDefinition extends BaseASTNode {
        name: string;
    }
    export interface ReturnParameters extends BaseASTNode {}
    export interface ModifierList extends BaseASTNode {}
    export interface EventDefinition extends BaseASTNode {}
    export interface EnumValue extends BaseASTNode {}
    export interface EnumDefinition extends BaseASTNode {}
    export interface ParameterList extends BaseASTNode {}
    export interface Parameter extends BaseASTNode {}
    export interface EventParameterList extends BaseASTNode {}
    export interface EventParameter extends BaseASTNode {}
    export interface FunctionTypeParameterList extends BaseASTNode {}
    export interface FunctionTypeParameter extends BaseASTNode {}
    export interface VariableDeclaration extends BaseASTNode {
        visibility: 'public' | 'private';
        isStateVar: boolean;
    }
    export interface TypeName extends BaseASTNode {}
    export interface UserDefinedTypeName extends BaseASTNode {}
    export interface Mapping extends BaseASTNode {}
    export interface FunctionTypeName extends BaseASTNode {}
    export interface StorageLocation extends BaseASTNode {}
    export interface StateMutability extends BaseASTNode {}
    export interface Block extends BaseASTNode {}
    export interface Statement extends BaseASTNode {}
    export interface ExpressionStatement extends BaseASTNode {
        expression: ASTNode;
    }
    export interface IfStatement extends BaseASTNode {
        trueBody: ASTNode;
        falseBody: ASTNode;
    }
    export interface WhileStatement extends BaseASTNode {}
    export interface SimpleStatement extends BaseASTNode {}
    export interface ForStatement extends BaseASTNode {}
    export interface InlineAssemblyStatement extends BaseASTNode {}
    export interface DoWhileStatement extends BaseASTNode {}
    export interface ContinueStatement extends BaseASTNode {}
    export interface BreakStatement extends BaseASTNode {}
    export interface ReturnStatement extends BaseASTNode {}
    export interface ThrowStatement extends BaseASTNode {}
    export interface VariableDeclarationStatement extends BaseASTNode {}
    export interface IdentifierList extends BaseASTNode {}
    export interface ElementaryTypeName extends BaseASTNode {}
    export interface Expression extends BaseASTNode {}
    export interface PrimaryExpression extends BaseASTNode {}
    export interface ExpressionList extends BaseASTNode {}
    export interface NameValueList extends BaseASTNode {}
    export interface NameValue extends BaseASTNode {}
    export interface FunctionCallArguments extends BaseASTNode {}
    export interface AssemblyBlock extends BaseASTNode {}
    export interface AssemblyItem extends BaseASTNode {}
    export interface AssemblyExpression extends BaseASTNode {}
    export interface AssemblyCall extends BaseASTNode {}
    export interface AssemblyLocalDefinition extends BaseASTNode {}
    export interface AssemblyAssignment extends BaseASTNode {}
    export interface AssemblyIdentifierOrList extends BaseASTNode {}
    export interface AssemblyIdentifierList extends BaseASTNode {}
    export interface AssemblyStackAssignment extends BaseASTNode {}
    export interface LabelDefinition extends BaseASTNode {}
    export interface AssemblySwitch extends BaseASTNode {}
    export interface AssemblyCase extends BaseASTNode {}
    export interface AssemblyFunctionDefinition extends BaseASTNode {}
    export interface AssemblyFunctionReturns extends BaseASTNode {}
    export interface AssemblyFor extends BaseASTNode {}
    export interface AssemblyIf extends BaseASTNode {}
    export interface AssemblyLiteral extends BaseASTNode {}
    export interface SubAssembly extends BaseASTNode {}
    export interface TupleExpression extends BaseASTNode {}
    export interface ElementaryTypeNameExpression extends BaseASTNode {}
    export interface NumberLiteral extends BaseASTNode {}
    export interface Identifier extends BaseASTNode {}
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
        left: ASTNode;
        right: ASTNode;
        operator: BinOp;
    }
    export interface Conditional extends BaseASTNode {
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
        range?: boolean;
    }
    export function parse(sourceCode: string, parserOpts: ParserOpts): ASTNode;
    export function visit(ast: ASTNode, visitor: Visitor): void;
}
