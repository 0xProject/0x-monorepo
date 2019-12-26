export enum AstNodeType {
    SourceUnit = 'SourceUnit',
    ContractDefinition = 'ContractDefinition',
    FunctionDefinition = 'FunctionDefinition',
    ParameterList = 'ParameterList',
    VariableDeclaration = 'VariableDeclaration',
    UserDefinedTypeName = 'UserDefinedTypeName',
    ElementaryTypeName = 'ElementaryTypeName',
    ArrayTypeName = 'ArrayTypeName',
    Mapping = 'Mapping',
    StructDefinition = 'StructDefinition',
    EnumDefinition = 'EnumDefinition',
    EnumValue = 'EnumValue',
    InheritanceSpecifier = 'InheritanceSpecifier',
    EventDefinition = 'EventDefinition',
}

export enum Visibility {
    Internal = 'internal',
    External = 'external',
    Public = 'public',
    Private = 'private',
}

export enum StateMutability {
    Nonpayable = 'nonpayable',
    Payable = 'payable',
    View = 'view',
    Pure = 'pure',
}

export enum FunctionKind {
    Constructor = 'constructor',
    Function = 'function',
    Fallback = 'fallback',
}

export enum ContractKind {
    Contract = 'contract',
    Interface = 'interface',
    Library = 'library',
}

export enum StorageLocation {
    Default = 'default',
    Storage = 'storage',
    Memory = 'memory',
    CallData = 'calldata',
}

export interface AstNode {
    id: number;
    nodeType: AstNodeType;
    src: string;
}

export interface SourceUnitNode extends AstNode {
    path: string;
    nodes: AstNode[];
    exportedSymbols: {
        [symbol: string]: number[];
    };
}

export interface ContractDefinitionNode extends AstNode {
    name: string;
    contractKind: ContractKind;
    fullyImplemented: boolean;
    linearizedBaseContracts: number[];
    contractDependencies: number[];
    baseContracts: InheritanceSpecifierNode[];
    nodes: AstNode[];
}

export interface InheritanceSpecifierNode extends AstNode {
    baseName: UserDefinedTypeNameNode;
}

export interface FunctionDefinitionNode extends AstNode {
    name: string;
    implemented: boolean;
    scope: number;
    kind: FunctionKind;
    parameters: ParameterListNode;
    returnParameters: ParameterListNode;
    visibility: Visibility;
    stateMutability: StateMutability;
}

export interface ParameterListNode extends AstNode {
    parameters: VariableDeclarationNode[];
}

export interface VariableDeclarationNode extends AstNode {
    name: string;
    value: AstNode | null;
    constant: boolean;
    scope: number;
    visibility: Visibility;
    stateVariable: boolean;
    storageLocation: StorageLocation;
    indexed: boolean;
    typeName: TypeNameNode;
}

export interface TypeNameNode extends AstNode {
    name: string;
    typeDescriptions: {
        typeIdentifier: string;
        typeString: string;
    };
}

export interface UserDefinedTypeNameNode extends TypeNameNode {
    referencedDeclaration: number;
}

export interface MappingTypeNameNode extends TypeNameNode {
    keyType: ElementaryTypeNameNode;
    valueType: TypeNameNode;
}

export interface ElementaryTypeNameNode extends TypeNameNode {}

export interface ArrayTypeNameNode extends TypeNameNode {
    length: number | null;
    baseType: TypeNameNode;
}

export interface StructDefinitionNode extends AstNode {
    scope: number;
    name: string;
    canonicalName: string;
    members: VariableDeclarationNode[];
}

export interface EnumDefinitionNode extends AstNode {
    name: string;
    canonicalName: string;
    members: EnumValueNode[];
}

export interface EnumValueNode extends AstNode {
    name: string;
}

export interface EventDefinitionNode extends AstNode {
    name: string;
    parameters: ParameterListNode;
}

/**
 * Check if a node is a SourceUnit node.
 */
export function isSourceUnitNode(node: AstNode): node is SourceUnitNode {
    return node.nodeType === AstNodeType.SourceUnit;
}

/**
 * Check if a node is a ContractDefinition ode.
 */
export function isContractDefinitionNode(node: AstNode): node is ContractDefinitionNode {
    return node.nodeType === AstNodeType.ContractDefinition;
}

/**
 * Check if a node is a VariableDeclaration ode.
 */
export function isVariableDeclarationNode(node: AstNode): node is VariableDeclarationNode {
    return node.nodeType === AstNodeType.VariableDeclaration;
}

/**
 * Check if a node is a FunctionDefinition node.
 */
export function isFunctionDefinitionNode(node: AstNode): node is FunctionDefinitionNode {
    return node.nodeType === AstNodeType.FunctionDefinition;
}

/**
 * Check if a node is a StructDefinition ode.
 */
export function isStructDefinitionNode(node: AstNode): node is StructDefinitionNode {
    return node.nodeType === AstNodeType.StructDefinition;
}

/**
 * Check if a node is a EnumDefinition ode.
 */
export function isEnumDefinitionNode(node: AstNode): node is EnumDefinitionNode {
    return node.nodeType === AstNodeType.EnumDefinition;
}

/**
 * Check if a node is a Mapping node.
 */
export function isMappingTypeNameNode(node: AstNode): node is MappingTypeNameNode {
    return node.nodeType === AstNodeType.Mapping;
}

/**
 * Check if a node is a ArrayTypeName node.
 */
export function isArrayTypeNameNode(node: AstNode): node is ArrayTypeNameNode {
    return node.nodeType === AstNodeType.ArrayTypeName;
}

/**
 * Check if a node is a UserDefinedTypeName node.
 */
export function isUserDefinedTypeNameNode(node: AstNode): node is UserDefinedTypeNameNode {
    return node.nodeType === AstNodeType.UserDefinedTypeName;
}

/**
 * Check if a node is a EventDefinition node.
 */
export function isEventDefinitionNode(node: AstNode): node is EventDefinitionNode {
    return node.nodeType === AstNodeType.EventDefinition;
}

/**
 * Split an AST source mapping string into its parts.
 */
export function splitAstNodeSrc(src: string): { offset: number; length: number; sourceId: number } {
    // tslint:disable-next-line: custom-no-magic-numbers
    const [offset, length, sourceId] = src.split(':').map(s => parseInt(s, 10));
    return { offset, length, sourceId };
}

// tslint:disable-next-line: max-file-line-count
