// Type definitions for solidity-parser-antlr 0.3.2
// Project: https://github.com/federicobond/solidity-parser-antlr
// Definitions by: Leonid Logvinov <https://github.com/LogvinovLeon>
//                 Alex Browne <https://github.com/albrow>
//                 Remco Bloemen <https://github.com/recmo>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.1

// See: https://solidity.readthedocs.io/en/develop/miscellaneous.html#language-grammar

// TODO: Parameter and VariableDeclaration are the same node

declare module 'solidity-parser-antlr' {
    export interface LineColumn {
        line: number;
        column: number;
    }
    export interface Location {
        start: LineColumn;
        end: LineColumn;
    }
    export const enum NodeType {
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
        ArrayTypeName = 'ArrayTypeName',
        FunctionTypeName = 'FunctionTypeName',
        StorageLocation = 'StorageLocation',
        StateMutability = 'StateMutability',
        Block = 'Block',
        ExpressionStatement = 'ExpressionStatement',
        IfStatement = 'IfStatement',
        WhileStatement = 'WhileStatement',
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
        StringLiteral = 'StringLiteral',
        Identifier = 'Identifier',
        UnaryOperation = 'UnaryOperation',
        BinaryOperation = 'BinaryOperation',
        Conditional = 'Conditional',
        IndexAccess = 'IndexAccess',
        MemberAccess = 'MemberAccess',
        NewExpression = 'NewExpression',
        DecimalNumber = 'DecimalNumber',
        HexNumber = 'HexNumber',
    }
    export const enum ContractKind {
        Contract = 'contract',
        Interface = 'interface',
        Library = 'library',
    }
    export const enum Visibility {
        Default = 'default',
        Public = 'public',
        Internal = 'internal',
        Private = 'private',
    }
    export const enum StateMutability {
        Default = null,
        View = 'view',
        Pure = 'pure',
    }
    export const enum StorageLocation {
        Default = null,
        Memory = 'memory',
        Storage = 'storage',
        Calldata = 'calldata',
    }
    export type UnOp = '++' | '--' | '-' | '+' | '!';
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
    /*
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
    */
    export interface ImportDirective extends BaseASTNode {
        type: NodeType.ImportDirective;
        path: string;
        symbolAliases: [string, string][] | null;
    }
    export interface ContractDefinition extends BaseASTNode {
        type: NodeType.ContractDefinition;
        name: string;
        kind: ContractKind;
        baseContracts: InheritanceSpecifier[];
        subNodes: ContractMember[];
    }
    export interface InheritanceSpecifier extends BaseASTNode {
        type: NodeType.InheritanceSpecifier;
        baseName: UserDefinedTypeName;
    }
    /*
    export interface ContractPart extends BaseASTNode {
        type: NodeType.ContractPart;
    }
    */
    export interface UsingForDeclaration extends BaseASTNode {
        type: NodeType.UsingForDeclaration;
        typeName: Type;
        libraryName: string;
    }
    export interface StateVariableDeclaration extends BaseASTNode {
        type: NodeType.StateVariableDeclaration;
        variables: VariableDeclaration[];
        initialValue: Expression | null; // TODO check if exists
    }
    export interface StructDefinition extends BaseASTNode {
        type: NodeType.StructDefinition;
        name: string;
        members: VariableDeclaration[];
    }
    export interface EnumDefinition extends BaseASTNode {
        type: NodeType.EnumDefinition;
        name: string;
        members: EnumValue[];
    }
    export interface EnumValue extends BaseASTNode {
        type: NodeType.EnumValue;
        name: string;
    }
    export interface EventDefinition extends BaseASTNode {
        type: NodeType.EventDefinition;
        name: string;
        parameters: ParameterList;
        isAnonymous: boolean;
    }
    export interface ModifierDefinition extends BaseASTNode {
        type: NodeType.ModifierDefinition;
        name: string;
        parameters: ParameterList;
        body: Block;
    }
    export interface FunctionDefinition extends BaseASTNode {
        type: NodeType.FunctionDefinition;
        name: string;
        parameters: ParameterList;
        returnParameters: ParameterList | null;
        body: Block | null;
        visibility: Visibility;
        modifiers: ModifierInvocation[];
        isConstructor: boolean;
        stateMutability: StateMutability;
    }
    export interface ModifierInvocation extends BaseASTNode {
        type: NodeType.ModifierInvocation;
        name: string;
        arguments: Expression[];
    }
    export interface ParameterList extends BaseASTNode {
        type: NodeType.ParameterList;
        parameters: Parameter[];
    }
    export interface Parameter extends BaseASTNode {
        type: NodeType.Parameter;
        name: string | null;
        typeName: Type;
        visibility?: Visibility;
        storageLocation?: StorageLocation | null;
        expression?: Expression;
        isStateVar?: boolean;
        isDeclaredConst?: boolean;
        isIndexed?: boolean;
    }
    /*
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
    */
    export interface Block extends BaseASTNode {
        type: NodeType.Block;
        statements: Statement[];
    }
    export interface VariableDeclaration extends BaseASTNode {
        type: NodeType.VariableDeclaration;
        name: string;
        visibility?: Visibility;
        storageLocation?: StorageLocation;
        typeName: Type;
        expression?: Expression;
        isStateVar: boolean;
        isDeclaredConst?: boolean;
        isIndexed: boolean;
    }
    /*
    export interface TypeName extends BaseASTNode {
        type: NodeType.TypeName;
    }
    export interface StorageLocation extends BaseASTNode {
        type: NodeType.StorageLocation;
    }
    export interface StateMutability extends BaseASTNode {
        type: NodeType.StateMutability;
    }
    */
    export interface ExpressionStatement extends BaseASTNode {
        type: NodeType.ExpressionStatement;
        expression: Expression;
    }
    export interface IfStatement extends BaseASTNode {
        type: NodeType.IfStatement;
        condition: Expression;
        trueBody: Statement;
        falseBody: Statement;
    }
    export interface WhileStatement extends BaseASTNode {
        type: NodeType.WhileStatement;
        // TODO
    }
    export interface ForStatement extends BaseASTNode {
        type: NodeType.ForStatement;
        initExpression: Expression;
        conditionExpression: Expression;
        loopExpression: Expression;
        body: Statement;
    }
    export interface InlineAssemblyStatement extends BaseASTNode {
        type: NodeType.InlineAssemblyStatement;
        language: string;
        body: AssemblyBlock;
    }
    export interface DoWhileStatement extends BaseASTNode {
        type: NodeType.DoWhileStatement;
        // TODO
    }
    export interface ContinueStatement extends BaseASTNode {
        type: NodeType.ContinueStatement;
    }
    export interface BreakStatement extends BaseASTNode {
        type: NodeType.BreakStatement;
    }
    export interface ReturnStatement extends BaseASTNode {
        type: NodeType.ReturnStatement;
        expression: Expression | null;
    }
    export interface ThrowStatement extends BaseASTNode {
        type: NodeType.ThrowStatement;
    }
    export interface EmitStatement extends BaseASTNode {
        type: NodeType.EmitStatement;
        eventCall: FunctionCall;
    }
    export interface VariableDeclarationStatement extends BaseASTNode {
        type: NodeType.VariableDeclarationStatement;
        variables: VariableDeclaration[];
        initialValue: Expression;
    }
    export interface NewExpression extends BaseASTNode {
        type: NodeType.NewExpression;
        typeName: Type;
    }

    // Types
    export interface ElementaryTypeName extends BaseASTNode {
        type: NodeType.ElementaryTypeName;
        name: string;
    }
    export interface UserDefinedTypeName extends BaseASTNode {
        type: NodeType.UserDefinedTypeName;
        namePath: string;
    }
    export interface Mapping extends BaseASTNode {
        type: NodeType.Mapping;
        keyType: Type;
        valueType: Type;
    }
    export interface ArrayTypeName extends BaseASTNode {
        type: NodeType.Mapping;
        baseTypeName: Type;
        length: Expression | null;
    }
    export interface FunctionTypeName extends BaseASTNode {
        type: NodeType.FunctionTypeName;
        // TODO
    }
    /*
    export interface PrimaryExpression extends BaseASTNode {
        type: NodeType.PrimaryExpression;
    }
    export interface ExpressionList extends BaseASTNode {
        type: NodeType.ExpressionList;
    }
    */
    export interface NameValueList extends BaseASTNode {
        type: NodeType.NameValueList;
        // TODO
    }
    export interface NameValue extends BaseASTNode {
        type: NodeType.NameValue;
        // TODO
    }

    // Expressions
    export interface Identifier extends BaseASTNode {
        type: NodeType.Identifier;
        name: string;
    }
    export interface BooleanLiteral extends BaseASTNode {
        type: NodeType.BooleanLiteral;
        value: boolean;
    }
    export interface NumberLiteral extends BaseASTNode {
        type: NodeType.NumberLiteral;
        number: string;
        subdenomination: any; // TODO
    }
    export interface StringLiteral extends BaseASTNode {
        type: NodeType.StringLiteral;
        value: string;
    }
    export interface FunctionCall extends BaseASTNode {
        type: NodeType.FunctionCall;
        expression: Expression;
        arguments: Expression[];
        names: [];
    }
    export interface TupleExpression extends BaseASTNode {
        type: NodeType.TupleExpression;
        components: Expression[];
        isArray: boolean;
    }
    export interface ElementaryTypeNameExpression extends BaseASTNode {
        type: NodeType.ElementaryTypeNameExpression;
        typeName: Type;
    }
    export interface UnaryOperation extends BaseASTNode {
        type: NodeType.UnaryOperation;
        operator: UnOp;
        isPrefix: boolean;
        subExpression: Expression;
    }
    export interface BinaryOperation extends BaseASTNode {
        type: NodeType.BinaryOperation;
        operator: BinOp;
        left: Expression;
        right: Expression;
    }
    export interface Conditional extends BaseASTNode {
        type: NodeType.Conditional;
        condition: Expression;
        trueExpression: Expression;
        falseExpression: Expression;
    }
    export interface IndexAccess extends BaseASTNode {
        type: NodeType.IndexAccess;
        base: Expression;
        index: Expression;
    }
    export interface MemberAccess extends BaseASTNode {
        type: NodeType.MemberAccess;
        expression: Expression;
        memberName: string;
    }

    export interface AssemblyBlock extends BaseASTNode {
        type: NodeType.AssemblyBlock;
        operations: AssemblyStatement[];
    }
    /*
    export interface AssemblyItem extends BaseASTNode {
        type: NodeType.AssemblyItem;
    }
    export interface AssemblyExpression extends BaseASTNode {
        type: NodeType.AssemblyExpression;
    }
    */
    export interface AssemblyCall extends BaseASTNode {
        type: NodeType.AssemblyCall;
        functionName: string;
        arguments: AssemblyExpression[];
    }
    export interface AssemblyLocalDefinition extends BaseASTNode {
        type: NodeType.AssemblyLocalDefinition;
        names: Identifier[];
        expression: AssemblyExpression;
    }
    export interface AssemblyAssignment extends BaseASTNode {
        type: NodeType.AssemblyAssignment;
        names: Identifier[];
        expression: AssemblyExpression;
    }
    /*
    export interface AssemblyIdentifierOrList extends BaseASTNode {
        type: NodeType.AssemblyIdentifierOrList;
    }
    export interface AssemblyIdentifierList extends BaseASTNode {
        type: NodeType.AssemblyIdentifierList;
    }
    export interface AssemblyStackAssignment extends BaseASTNode {
        type: NodeType.AssemblyStackAssignment;
    }
    */
    export interface LabelDefinition extends BaseASTNode {
        type: NodeType.LabelDefinition;
        // TODO
    }
    export interface AssemblySwitch extends BaseASTNode {
        type: NodeType.AssemblySwitch;
        expression: Expression;
        cases: AssemblyCase[];
    }
    export interface AssemblyCase extends BaseASTNode {
        type: NodeType.AssemblyCase;
        value: Expression;
        block: AssemblyBlock;
    }
    export interface AssemblyFunctionDefinition extends BaseASTNode {
        type: NodeType.AssemblyFunctionDefinition;
        // TODO
    }
    export interface AssemblyFunctionReturns extends BaseASTNode {
        type: NodeType.AssemblyFunctionReturns;
        // TODO
    }
    export interface AssemblyFor extends BaseASTNode {
        type: NodeType.AssemblyFor;
        pre: AssemblyBlock | AssemblyExpression;
        condition: AssemblyExpression;
        post: AssemblyBlock | AssemblyExpression;
        body: AssemblyBlock;
    }
    export interface AssemblyIf extends BaseASTNode {
        type: NodeType.AssemblyIf;
        condition: AssemblyExpression;
        body: AssemblyBlock;
    }
    export interface DecimalNumber extends BaseASTNode {
        type: NodeType.AssemblyIf;
        value: string;
    }
    export interface HexNumber extends BaseASTNode {
        type: NodeType.AssemblyIf;
        value: string;
    }

    /*
    export interface AssemblyLiteral extends BaseASTNode {
        type: NodeType.AssemblyLiteral;
    }
    export interface SubAssembly extends BaseASTNode {
        type: NodeType.SubAssembly;
    }
    */
    export type SourceMember = PragmaDirective | ImportDirective | ContractDefinition;
    export type ContractMember =
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
        | InlineAssemblyStatement;
    export type Expression =
        | BooleanLiteral
        | NumberLiteral
        | StringLiteral
        | Identifier
        | FunctionCall
        | Conditional
        | UnaryOperation
        | BinaryOperation
        | MemberAccess
        | IndexAccess
        | ElementaryTypeNameExpression
        | VariableDeclaration // TODO: Is this really an expression?
        | NewExpression
        | TupleExpression
        | IndexAccess
        | MemberAccess;
    export type Type = ElementaryTypeName | UserDefinedTypeName | Mapping | ArrayTypeName | FunctionTypeName;
    export type AssemblyStatement =
        | AssemblyCall
        | AssemblyAssignment
        | AssemblyLocalDefinition
        | AssemblyIf
        | AssemblyFor
        | AssemblySwitch
        | AssemblyCase;
    export type AssemblyExpression = AssemblyCall | DecimalNumber | HexNumber;
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
        ArrayTypeName?: (node: ArrayTypeName) => T;
        FunctionTypeName?: (node: FunctionTypeName) => T;
        StorageLocation?: (node: StorageLocation) => T;
        StateMutability?: (node: StateMutability) => T;
        Block?: (node: Block) => T;
        ExpressionStatement?: (node: ExpressionStatement) => T;
        IfStatement?: (node: IfStatement) => T;
        WhileStatement?: (node: WhileStatement) => T;
        ForStatement?: (node: ForStatement) => T;
        InlineAssemblyStatement?: (node: InlineAssemblyStatement) => T;
        DoWhileStatement?: (node: DoWhileStatement) => T;
        ContinueStatement?: (node: ContinueStatement) => T;
        BreakStatement?: (node: BreakStatement) => T;
        ReturnStatement?: (node: ReturnStatement) => T;
        ThrowStatement?: (node: ThrowStatement) => T;
        EmitStatement?: (node: EmitStatement) => T;
        VariableDeclarationStatement?: (node: VariableDeclarationStatement) => T;
        IdentifierList?: (node: IdentifierList) => T;
        ElementaryTypeName?: (node: ElementaryTypeName) => T;
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
        StringLiteral?: (node: StringLiteral) => T;
        Identifier?: (node: Identifier) => T;
        UnaryOperation?: (node: UnaryOperation) => T;
        BinaryOperation?: (node: BinaryOperation) => T;
        Conditional?: (node: Conditional) => T;
        MemberAccess?: (node: MemberAccess) => T;
        IndexAccess?: (node: IndexAccess) => T;
        NewExpression?: (node: NewExpression) => T;
        DecimalNumber?: (node: DecimalNumber) => T;
        HexNumber?: (node: HexNumber) => T;
    }
    export interface ParserOpts {
        tolerant?: boolean;
        range?: boolean;
        loc?: boolean;
    }
    export function parse(sourceCode: string, parserOpts: ParserOpts): ASTNode;
    export function visit(ast: ASTNode, visitor: Visitor<boolean>): void;
}
