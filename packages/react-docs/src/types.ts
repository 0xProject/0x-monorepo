export interface SectionNameToMarkdownByVersion {
    [version: string]: { [sectionName: string]: string };
}

export interface DocsInfoConfig {
    id: string;
    packageName: string;
    type: SupportedDocJson;
    displayName: string;
    packageUrl: string;
    markdownMenu: DocsMenu;
    markdownSections: SectionsMap;
    sectionNameToMarkdownByVersion: SectionNameToMarkdownByVersion;
    contractsByVersionByNetworkId?: ContractsByVersionByNetworkId;
}

export interface DocsMenu {
    [sectionName: string]: string[];
}

export interface SectionsMap {
    [sectionName: string]: string;
}

// Exception: We don't make the values uppercase because these KindString's need to
// match up those returned by TypeDoc
export enum KindString {
    Constructor = 'Constructor',
    Property = 'Property',
    Method = 'Method',
    Interface = 'Interface',
    TypeAlias = 'Type alias',
    ObjectLiteral = 'Object literal',
    Variable = 'Variable',
    Function = 'Function',
    Enumeration = 'Enumeration',
    Class = 'Class',
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
