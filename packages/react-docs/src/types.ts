export interface DocsInfoConfig {
    id: string;
    type: SupportedDocJson;
    displayName: string;
    packageUrl: string;
    menu: DocsMenu;
    sections: SectionsMap;
    sectionNameToMarkdown: { [sectionName: string]: string };
    visibleConstructors: string[];
    sectionNameToModulePath?: { [sectionName: string]: string[] };
    menuSubsectionToVersionWhenIntroduced?: { [sectionName: string]: string };
    contractsByVersionByNetworkId?: ContractsByVersionByNetworkId;
    typeConfigs?: DocsInfoTypeConfigs;
}

export interface DocsInfoTypeConfigs {
    typeNameToExternalLink?: { [typeName: string]: string };
    publicTypes?: string[];
    typeNameToPrefix?: { [typeName: string]: string };
    typeNameToDocSection?: { [typeName: string]: string };
}

export interface DocsMenu {
    [sectionName: string]: string[];
}

export interface SectionsMap {
    [sectionName: string]: string;
}

export interface TypeDocType {
    type: TypeDocTypes;
    value: string;
    name: string;
    types: TypeDocType[];
    typeArguments?: TypeDocType[];
    declaration: TypeDocNode;
    elementType?: TypeDocType;
}

export interface TypeDocFlags {
    isStatic?: boolean;
    isOptional?: boolean;
    isPublic?: boolean;
    isExported?: boolean;
}

export interface TypeDocGroup {
    title: string;
    children: number[];
}

export interface TypeDocNode {
    id?: number;
    name?: string;
    kind?: string;
    defaultValue?: string;
    kindString?: string;
    type?: TypeDocType;
    fileName?: string;
    line?: number;
    comment?: TypeDocNode;
    text?: string;
    shortText?: string;
    returns?: string;
    declaration: TypeDocNode;
    flags?: TypeDocFlags;
    indexSignature?: TypeDocNode | TypeDocNode[]; // TypeDocNode in TypeDoc <V0.9.0, TypeDocNode[] in >V0.9.0
    signatures?: TypeDocNode[];
    parameters?: TypeDocNode[];
    typeParameter?: TypeDocNode[];
    sources?: TypeDocNode[];
    children?: TypeDocNode[];
    groups?: TypeDocGroup[];
}

export enum TypeDocTypes {
    Intrinsic = 'intrinsic',
    Reference = 'reference',
    Array = 'array',
    StringLiteral = 'stringLiteral',
    Reflection = 'reflection',
    Union = 'union',
    TypeParameter = 'typeParameter',
    Intersection = 'intersection',
    Unknown = 'unknown',
}

// Exception: We don't make the values uppercase because these KindString's need to
// match up those returned by TypeDoc
export enum KindString {
    Constructor = 'Constructor',
    Property = 'Property',
    Method = 'Method',
    Interface = 'Interface',
    TypeAlias = 'Type alias',
    Variable = 'Variable',
    Function = 'Function',
    Enumeration = 'Enumeration',
    Class = 'Class',
}

export interface DocAgnosticFormat {
    [sectionName: string]: DocSection;
}

export interface DocSection {
    comment: string;
    constructors: Array<TypescriptMethod | SolidityMethod>;
    methods: Array<TypescriptMethod | SolidityMethod>;
    properties: Property[];
    types: CustomType[];
    functions?: TypescriptFunction[];
    events?: Event[];
}

export interface TypescriptMethod extends BaseMethod {
    source?: Source;
    isStatic?: boolean;
    typeParameter?: TypeParameter;
}

export interface TypescriptFunction extends BaseFunction {
    source?: Source;
    typeParameter?: TypeParameter;
}

export interface SolidityMethod extends BaseMethod {
    isConstant?: boolean;
    isPayable?: boolean;
}

export interface Source {
    fileName: string;
    line: number;
}

export interface Parameter {
    name: string;
    comment: string;
    isOptional: boolean;
    type: Type;
    defaultValue?: string;
}

export interface TypeParameter {
    name: string;
    type: Type;
}

export interface Type {
    name: string;
    typeDocType: TypeDocTypes;
    value?: string;
    typeArguments?: Type[];
    elementType?: ElementType;
    types?: Type[];
    method?: TypescriptMethod;
}

export interface ElementType {
    name: string;
    typeDocType: TypeDocTypes;
}

export interface IndexSignature {
    keyName: string;
    keyType: Type;
    valueName: string;
}

export interface CustomType {
    name: string;
    kindString: string;
    type?: Type;
    method?: TypescriptMethod;
    indexSignature?: IndexSignature;
    defaultValue?: string;
    comment?: string;
    children?: CustomTypeChild[];
}

export interface CustomTypeChild {
    name: string;
    type?: Type;
    defaultValue?: string;
}

export interface Event {
    name: string;
    eventArgs: EventArg[];
}

export interface EventArg {
    isIndexed: boolean;
    name: string;
    type: Type;
}

export interface Property {
    name: string;
    type: Type;
    source?: Source;
    comment?: string;
}

export interface BaseMethod {
    isConstructor: boolean;
    name: string;
    returnComment?: string | undefined;
    callPath: string;
    parameters: Parameter[];
    returnType: Type;
    comment?: string;
}

export interface BaseFunction {
    name: string;
    returnComment?: string | undefined;
    parameters: Parameter[];
    returnType: Type;
    comment?: string;
}

export interface TypeDefinitionByName {
    [typeName: string]: CustomType;
}

export enum SupportedDocJson {
    Doxity = 'DOXITY',
    TypeDoc = 'TYPEDOC',
}

export interface ContractsByVersionByNetworkId {
    [version: string]: {
        [networkName: string]: {
            [contractName: string]: string;
        };
    };
}

export interface DoxityDocObj {
    [contractName: string]: DoxityContractObj;
}

export interface DoxityContractObj {
    title: string;
    fileName: string;
    name: string;
    abiDocs: DoxityAbiDoc[];
}

export interface DoxityAbiDoc {
    constant: boolean;
    inputs: DoxityInput[];
    name: string;
    outputs: DoxityOutput[];
    payable: boolean;
    type: string;
    details?: string;
    return?: string;
}

export interface DoxityOutput {
    name: string;
    type: string;
}

export interface DoxityInput {
    name: string;
    type: string;
    description: string;
    indexed?: boolean;
}

export interface AddressByContractName {
    [contractName: string]: string;
}

export interface EnumValue {
    name: string;
    defaultValue?: string;
}

export enum AbiTypes {
    Constructor = 'constructor',
    Function = 'function',
    Event = 'event',
}
