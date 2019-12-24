import { Compiler } from '@0x/sol-compiler';
import * as fs from 'fs';
import * as path from 'path';

import {
    ArrayTypeNameNode,
    AstNode,
    ContractKind,
    EnumValueNode,
    FunctionKind,
    isArrayTypeNameNode,
    isContractDefinitionNode,
    isEnumDefinitionNode,
    isEventDefinitionNode,
    isFunctionDefinitionNode,
    isMappingTypeNameNode,
    isSourceUnitNode,
    isStructDefinitionNode,
    isUserDefinedTypeNameNode,
    isVariableDeclarationNode,
    MappingTypeNameNode,
    ParameterListNode,
    SourceUnitNode,
    splitAstNodeSrc,
    StateMutability,
    StorageLocation,
    TypeNameNode,
    VariableDeclarationNode,
    Visibility,
} from './sol_ast';

export { ContractKind, FunctionKind, StateMutability, StorageLocation, Visibility } from './sol_ast';

export interface DocumentedItem {
    doc: string;
    line: number;
    file: string;
}

export interface EnumValueDocs extends DocumentedItem {
    value: number;
}

export interface ParamDocs extends DocumentedItem {
    type: string;
    indexed: boolean;
    storageLocation: StorageLocation;
    order: number;
}

export interface ParamDocsMap {
    [name: string]: ParamDocs;
}

export interface EnumValueDocsMap {
    [name: string]: EnumValueDocs;
}

export interface ContractMethodDocs extends DocumentedItem {
    name: string;
    contract: string;
    stateMutability: string;
    visibility: Visibility;
    isAccessor: boolean;
    kind: FunctionKind;
    parameters: ParamDocsMap;
    returns: ParamDocsMap;
}

export interface EnumDocs extends DocumentedItem {
    contract: string;
    values: EnumValueDocsMap;
}

export interface StructDocs extends DocumentedItem {
    contract: string;
    fields: ParamDocsMap;
}

export interface EventDocs extends DocumentedItem {
    contract: string;
    name: string;
    parameters: ParamDocsMap;
}

export interface ContractDocs extends DocumentedItem {
    kind: ContractKind;
    inherits: string[];
    methods: ContractMethodDocs[];
    events: EventDocs[];
    enums: {
        [typeName: string]: EnumDocs;
    };
    structs: {
        [typeName: string]: StructDocs;
    };
}

export interface SolidityDocs {
    contracts: {
        [typeName: string]: ContractDocs;
    };
}

interface SolcOutput {
    sources: { [file: string]: { id: number; ast: SourceUnitNode } };
    contracts: {
        [file: string]: {
            [contract: string]: {
                metadata: string;
            };
        };
    };
}

interface ContractMetadata {
    sources: { [file: string]: { content: string } };
    settings: { remappings: string[] };
}

interface SourceData {
    path: string;
    content: string;
}

interface Natspec {
    comment: string;
    dev: string;
    params: { [name: string]: string };
    returns: { [name: string]: string };
}

/**
 * Extract documentation, as JSON, from contract files.
 */
export async function extractDocsAsync(contractPaths: string[], roots: string[] = []): Promise<SolidityDocs> {
    const outputs = await compileAsync(contractPaths);
    const sourceContents = (await Promise.all(outputs.map(getSourceContentsFromCompilerOutputAsync))).map(sources =>
        rewriteSourcePaths(sources, roots),
    );
    const docs = createEmptyDocs();
    outputs.forEach((output, outputIdx) => {
        for (const file of Object.keys(output.contracts)) {
            const fileDocs = extractDocsFromFile(
                output.sources[file].ast,
                sourceContents[outputIdx][output.sources[file].id],
            );
            mergeDocs(docs, fileDocs);
        }
    });
    return docs;
}

async function compileAsync(files: string[]): Promise<SolcOutput[]> {
    const compiler = new Compiler({
        contracts: files,
        compilerSettings: {
            outputSelection: {
                '*': {
                    '*': ['metadata'],
                    '': ['ast'],
                },
            },
        },
    });
    return (compiler.getCompilerOutputsAsync() as any) as Promise<SolcOutput[]>;
}

async function getSourceContentsFromCompilerOutputAsync(output: SolcOutput): Promise<SourceData[]> {
    const sources: SourceData[] = [];
    for (const [importFile, fileOutput] of Object.entries(output.contracts)) {
        if (importFile in sources) {
            continue;
        }
        for (const contractOutput of Object.values(fileOutput)) {
            const metadata = JSON.parse(contractOutput.metadata || '{}') as ContractMetadata;
            let filePath = importFile;
            if (!path.isAbsolute(filePath)) {
                const { remappings } = metadata.settings;
                let longestPrefix = '';
                let longestPrefixReplacement = '';
                for (const remapping of remappings) {
                    const [from, to] = remapping.substr(1).split('=');
                    if (longestPrefix.length < from.length) {
                        if (filePath.startsWith(from)) {
                            longestPrefix = from;
                            longestPrefixReplacement = to;
                        }
                    }
                }
                filePath = filePath.slice(longestPrefix.length);
                filePath = path.join(longestPrefixReplacement, filePath);
            }
            const content = (await fs.promises.readFile(filePath, { encoding: 'utf-8' })) as string;
            sources[output.sources[importFile].id] = {
                path: path.relative('.', filePath),
                content,
            };
        }
    }
    return sources;
}

function rewriteSourcePaths(sources: SourceData[], roots: string[]): SourceData[] {
    const _roots = roots.map(root => root.split('='));
    return sources.map(s => {
        let longestPrefix = '';
        let longestPrefixReplacement = '';
        for (const [from, to] of _roots) {
            if (from.length > longestPrefix.length) {
                if (s.path.startsWith(from)) {
                    longestPrefix = from;
                    longestPrefixReplacement = to || '';
                }
            }
        }
        return {
            ...s,
            path: `${longestPrefixReplacement}${s.path.substr(longestPrefix.length)}`,
        };
    });
}

function mergeDocs(dst: SolidityDocs, ...srcs: SolidityDocs[]): SolidityDocs {
    if (srcs.length === 0) {
        return dst;
    }
    for (const src of srcs) {
        dst.contracts = {
            ...dst.contracts,
            ...src.contracts,
        };
    }
    return dst;
}

function createEmptyDocs(): SolidityDocs {
    return { contracts: {} };
}

function extractDocsFromFile(ast: SourceUnitNode, source: SourceData): SolidityDocs {
    const HIDDEN_VISIBILITIES = [Visibility.Private, Visibility.Internal];
    const docs = createEmptyDocs();
    const visit = (node: AstNode, currentContractName?: string) => {
        const { offset } = splitAstNodeSrc(node.src);
        if (isSourceUnitNode(node)) {
            for (const child of node.nodes) {
                visit(child);
            }
        } else if (isContractDefinitionNode(node)) {
            const natspec = getNatspecBefore(source.content, offset);
            docs.contracts[node.name] = {
                file: source.path,
                line: getAstNodeLineNumber(node, source.content),
                doc: natspec.dev || natspec.comment,
                kind: node.contractKind,
                inherits: node.baseContracts.map(c => normalizeType(c.baseName.typeDescriptions.typeString)),
                methods: [],
                events: [],
                enums: {},
                structs: {},
            };
            for (const child of node.nodes) {
                visit(child, node.name);
            }
        } else if (!currentContractName) {
            return;
        } else if (isVariableDeclarationNode(node)) {
            if (HIDDEN_VISIBILITIES.includes(node.visibility)) {
                return;
            }
            if (!node.stateVariable) {
                return;
            }
            const natspec = getNatspecBefore(source.content, offset);
            docs.contracts[currentContractName].methods.push({
                file: source.path,
                line: getAstNodeLineNumber(node, source.content),
                doc: getDocStringAround(source.content, offset),
                name: node.name,
                contract: currentContractName,
                kind: FunctionKind.Function,
                visibility: Visibility.External,
                parameters: extractAcessorParameterDocs(node.typeName, natspec, source),
                returns: extractAccesorReturnDocs(node.typeName, natspec, source),
                stateMutability: StateMutability.View,
                isAccessor: true,
            });
        } else if (isFunctionDefinitionNode(node)) {
            const natspec = getNatspecBefore(source.content, offset);
            docs.contracts[currentContractName].methods.push({
                file: source.path,
                line: getAstNodeLineNumber(node, source.content),
                doc: natspec.dev || natspec.comment,
                name: node.name,
                contract: currentContractName,
                kind: node.kind,
                visibility: node.visibility,
                parameters: extractFunctionParameterDocs(node.parameters, natspec, source),
                returns: extractFunctionReturnDocs(node.returnParameters, natspec, source),
                stateMutability: node.stateMutability,
                isAccessor: false,
            });
        } else if (isStructDefinitionNode(node)) {
            const natspec = getNatspecBefore(source.content, offset);
            docs.contracts[currentContractName].structs[node.canonicalName] = {
                contract: currentContractName,
                file: source.path,
                line: getAstNodeLineNumber(node, source.content),
                doc: natspec.dev || natspec.comment || getCommentsBefore(source.content, offset),
                fields: extractStructFieldDocs(node.members, natspec, source),
            };
        } else if (isEnumDefinitionNode(node)) {
            const natspec = getNatspecBefore(source.content, offset);
            docs.contracts[currentContractName].enums[node.canonicalName] = {
                contract: currentContractName,
                file: source.path,
                line: getAstNodeLineNumber(node, source.content),
                doc: natspec.dev || natspec.comment || getCommentsBefore(source.content, offset),
                values: extractEnumValueDocs(node.members, natspec, source),
            };
        } else if (isEventDefinitionNode(node)) {
            const natspec = getNatspecBefore(source.content, offset);
            docs.contracts[currentContractName].events.push({
                contract: currentContractName,
                file: source.path,
                line: getAstNodeLineNumber(node, source.content),
                doc: natspec.dev || natspec.comment,
                name: node.name,
                parameters: extractFunctionParameterDocs(node.parameters, natspec, source),
            });
        }
    };
    visit(ast);
    return docs;
}

function extractAcessorParameterDocs(typeNameNode: TypeNameNode, natspec: Natspec, source: SourceData): ParamDocsMap {
    const params: ParamDocsMap = {};
    const lineNumber = getAstNodeLineNumber(typeNameNode, source.content);
    if (isMappingTypeNameNode(typeNameNode)) {
        // Handle mappings.
        let node = typeNameNode;
        let order = 0;
        do {
            const paramName = `${Object.keys(params).length}`;
            params[paramName] = {
                file: source.path,
                line: lineNumber,
                doc: natspec.params[paramName] || '',
                type: normalizeType(node.keyType.typeDescriptions.typeString),
                indexed: false,
                storageLocation: StorageLocation.Default,
                order: order++,
            };
            node = node.valueType as MappingTypeNameNode;
        } while (isMappingTypeNameNode(node));
    } else if (isArrayTypeNameNode(typeNameNode)) {
        // Handle arrays.
        let node = typeNameNode;
        let order = 0;
        do {
            const paramName = `${Object.keys(params).length}`;
            params[paramName] = {
                file: source.path,
                line: lineNumber,
                doc: natspec.params[paramName] || '',
                type: 'uint256',
                indexed: false,
                storageLocation: StorageLocation.Default,
                order: order++,
            };
            node = node.baseType as ArrayTypeNameNode;
        } while (isArrayTypeNameNode(node));
    }
    return params;
}

function extractAccesorReturnDocs(typeNameNode: TypeNameNode, natspec: Natspec, source: SourceData): ParamDocsMap {
    let type = typeNameNode.typeDescriptions.typeString;
    let storageLocation = StorageLocation.Default;
    if (isMappingTypeNameNode(typeNameNode)) {
        // Handle mappings.
        let node = typeNameNode;
        while (isMappingTypeNameNode(node.valueType)) {
            node = node.valueType;
        }
        type = node.valueType.typeDescriptions.typeString;
        storageLocation = StorageLocation.Storage;
    } else if (isArrayTypeNameNode(typeNameNode)) {
        // Handle arrays.
        type = typeNameNode.baseType.typeDescriptions.typeString;
        storageLocation = StorageLocation.Memory;
    } else if (isUserDefinedTypeNameNode(typeNameNode)) {
        storageLocation = typeNameNode.typeDescriptions.typeString.startsWith('struct')
            ? StorageLocation.Memory
            : StorageLocation.Default;
    }
    return {
        '0': {
            type,
            storageLocation,
            file: source.path,
            line: getAstNodeLineNumber(typeNameNode, source.content),
            doc: natspec.returns['0'] || '',
            indexed: false,
            order: 0,
        },
    };
}

function extractFunctionParameterDocs(
    paramListNodes: ParameterListNode,
    natspec: Natspec,
    source: SourceData,
): ParamDocsMap {
    const params: ParamDocsMap = {};
    for (const param of paramListNodes.parameters) {
        params[param.name] = {
            file: source.path,
            line: getAstNodeLineNumber(param, source.content),
            doc: natspec.params[param.name] || '',
            type: normalizeType(param.typeName.typeDescriptions.typeString),
            indexed: param.indexed,
            storageLocation: param.storageLocation,
            order: 0,
        };
    }
    return params;
}

function extractFunctionReturnDocs(
    paramListNodes: ParameterListNode,
    natspec: Natspec,
    source: SourceData,
): ParamDocsMap {
    const returns: ParamDocsMap = {};
    let order = 0;
    for (const [idx, param] of Object.entries(paramListNodes.parameters)) {
        returns[param.name || idx] = {
            file: source.path,
            line: getAstNodeLineNumber(param, source.content),
            doc: natspec.returns[param.name] || '',
            type: normalizeType(param.typeName.typeDescriptions.typeString),
            indexed: false,
            storageLocation: param.storageLocation,
            order: order++,
        };
    }
    return returns;
}

function extractStructFieldDocs(
    fieldNodes: VariableDeclarationNode[],
    natspec: Natspec,
    source: SourceData,
): ParamDocsMap {
    const fields: ParamDocsMap = {};
    let order = 0;
    for (const field of fieldNodes) {
        const { offset } = splitAstNodeSrc(field.src);
        fields[field.name] = {
            file: source.path,
            line: getAstNodeLineNumber(field, source.content),
            doc: natspec.params[field.name] || getDocStringAround(source.content, offset),
            type: normalizeType(field.typeName.typeDescriptions.typeString),
            indexed: false,
            storageLocation: field.storageLocation,
            order: order++,
        };
    }
    return fields;
}

function extractEnumValueDocs(valuesNodes: EnumValueNode[], natspec: Natspec, source: SourceData): EnumValueDocsMap {
    const values: EnumValueDocsMap = {};
    for (const value of valuesNodes) {
        const { offset } = splitAstNodeSrc(value.src);
        values[value.name] = {
            file: source.path,
            line: getAstNodeLineNumber(value, source.content),
            doc: natspec.params[value.name] || getDocStringAround(source.content, offset),
            value: Object.keys(values).length,
        };
    }
    return values;
}

function offsetToLineIndex(code: string, offset: number): number {
    let currentOffset = 0;
    let lineIdx = 0;
    while (currentOffset < offset) {
        const lineEnd = code.indexOf('\n', currentOffset);
        if (lineEnd === -1) {
            return lineIdx;
        }
        currentOffset = lineEnd + 1;
        ++lineIdx;
    }
    return lineIdx - 1;
}

function offsetToLine(code: string, offset: number): string {
    let lineEnd = code.substr(offset).search(/\r?\n/);
    lineEnd = lineEnd === -1 ? code.length - offset : lineEnd;
    let lineStart = code.lastIndexOf('\n', offset);
    lineStart = lineStart === -1 ? 0 : lineStart;
    return code.substr(lineStart, offset - lineStart + lineEnd).trim();
}

function getPrevLine(code: string, offset: number): [string | undefined, number] {
    const lineStart = code.lastIndexOf('\n', offset);
    if (lineStart <= 0) {
        return [undefined, 0];
    }
    const prevLineStart = code.lastIndexOf('\n', lineStart - 1);
    if (prevLineStart === -1) {
        return [code.substr(0, lineStart).trim(), 0];
    }
    return [code.substring(prevLineStart + 1, lineStart).trim(), prevLineStart + 1];
}

function getAstNodeLineNumber(node: AstNode, code: string): number {
    return offsetToLineIndex(code, splitAstNodeSrc(node.src).offset) + 1;
}

function getNatspecBefore(code: string, offset: number): Natspec {
    const natspec = { comment: '', dev: '', params: {}, returns: {} };
    // Walk backwards through the lines until there is no longer a natspec
    // comment.
    let currentDirectivePayloads = [];
    let currentLine: string | undefined;
    let currentOffset = offset;
    while (true) {
        [currentLine, currentOffset] = getPrevLine(code, currentOffset);
        if (currentLine === undefined) {
            break;
        }
        const m = /^\/\/\/\s*(?:@(\w+\b)\s*)?(.*?)$/.exec(currentLine);
        if (!m) {
            break;
        }
        const directive = m[1];
        let directiveParam: string | undefined;
        let rest = m[2] || '';
        // Parse directives that take a parameter.
        if (directive === 'param' || directive === 'return') {
            const m2 = /^(\w+\b)(.*)$/.exec(rest);
            if (m2) {
                directiveParam = m2[1];
                rest = m2[2] || '';
            }
        }
        currentDirectivePayloads.push(rest);
        if (directive !== undefined) {
            const fullPayload = currentDirectivePayloads
                .reverse()
                .map(s => s.trim())
                .join(' ');
            switch (directive) {
                case 'dev':
                    natspec.dev = fullPayload;
                    break;
                case 'param':
                    if (directiveParam) {
                        natspec.params = {
                            ...natspec.params,
                            [directiveParam]: fullPayload,
                        };
                    }
                    break;
                case 'return':
                    if (directiveParam) {
                        natspec.returns = {
                            ...natspec.returns,
                            [directiveParam]: fullPayload,
                        };
                    }
                    break;
                default:
                    break;
            }
            currentDirectivePayloads = [];
        }
    }
    if (currentDirectivePayloads.length > 0) {
        natspec.comment = currentDirectivePayloads
            .reverse()
            .map(s => s.trim())
            .join(' ');
    }
    return natspec;
}

function getTrailingCommentAt(code: string, offset: number): string {
    const m = /\/\/\s*(.+)\s*$/.exec(offsetToLine(code, offset));
    return m ? m[1] : '';
}

function getCommentsBefore(code: string, offset: number): string {
    let currentOffset = offset;
    const comments = [];
    do {
        let prevLine;
        [prevLine, currentOffset] = getPrevLine(code, currentOffset);
        if (prevLine === undefined) {
            break;
        }
        const m = /^\s*\/\/\s*(.+)\s*$/.exec(prevLine);
        if (m && !m[1].startsWith('solhint')) {
            comments.push(m[1].trim());
        } else {
            break;
        }
    } while (currentOffset > 0);
    return comments.reverse().join(' ');
}

function getDocStringBefore(code: string, offset: number): string {
    const natspec = getNatspecBefore(code, offset);
    return natspec.dev || natspec.comment || getCommentsBefore(code, offset);
}

function getDocStringAround(code: string, offset: number): string {
    const natspec = getNatspecBefore(code, offset);
    return natspec.dev || natspec.comment || getDocStringBefore(code, offset) || getTrailingCommentAt(code, offset);
}

function normalizeType(type: string): string {
    const m = /^(?:\w+ )?(.*)$/.exec(type);
    if (!m) {
        return '';
    }
    return m[1];
}

// tslint:disable-next-line: max-file-line-count
