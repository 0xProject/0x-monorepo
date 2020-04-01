declare module 'solc' {
    export { ErrorType, ErrorSeverity, SolcError, StandardContractOutput, StandardOutput } from 'ethereum-types';
    import { SolcError } from 'ethereum-types';
    export interface ContractCompilationResult {
        srcmap: string;
        srcmapRuntime: string;
        bytecode: string;
        runtimeBytecode: string;
        interface: string;
    }
    export interface CompilationResult {
        errors: string[];
        contracts: {
            [contractIdentifier: string]: ContractCompilationResult;
        };
        sources: {
            [sourceName: string]: {
                AST: any;
            };
        };
        sourceList: string[];
    }
    export interface ImportContents {
        contents: string;
    }
    export interface InputSources {
        sources: {
            [fileName: string]: string;
        };
    }
    export interface BaseSource {
        keccak256?: string;
    }
    export interface InMemorySource extends BaseSource {
        content: string;
    }
    export interface UrlSource extends BaseSource {
        urls: string[];
    }
    export type Source = UrlSource | InMemorySource;
    export type OutputField =
        | '*'
        | 'ast'
        | 'legacyAST'
        | 'abi'
        | 'devdoc'
        | 'userdoc'
        | 'metadata'
        | 'ir'
        | 'evm.assembly'
        | 'evm.legacyAssembly'
        | 'evm.bytecode.object'
        | 'evm.bytecode.opcodes'
        | 'evm.bytecode.sourceMap'
        | 'evm.bytecode.linkReferences'
        | 'evm.deployedBytecode.object'
        | 'evm.deployedBytecode.opcodes'
        | 'evm.deployedBytecode.sourceMap'
        | 'evm.deployedBytecode.linkReferences'
        | 'evm.methodIdentifiers'
        | 'evm.gasEstimates'
        | 'ewasm.wast'
        | 'ewasm.wasm';
    export interface CompilerSettings {
        remappings?: string[];
        optimizer?: {
            enabled: boolean;
            runs?: number;
            details?: {
                peephole?: boolean;
                jumpdestRemover?: boolean;
                orderLiterals?: boolean;
                deduplicate?: boolean;
                cse?: boolean;
                constantOptimizer?: boolean;
                yul?: boolean;
            };
        };
        evmVersion?: 'homestead' | 'tangerineWhistle' | 'spuriousDragon' | 'byzantium' | 'constantinople';
        metadata?: {
            useLiteralContent: true;
        };
        libraries?: {
            [fileName: string]: {
                [libName: string]: string;
            };
        };
        outputSelection: {
            [fileName: string]: {
                [contractName: string]: OutputField[];
            };
        };
    }
    export interface StandardInput {
        language: 'Solidity' | 'serpent' | 'lll' | 'assembly';
        sources: {
            [fileName: string]: Source;
        };
        settings: CompilerSettings;
    }
    export interface SolcInstance {
        compile(
            sources: InputSources,
            optimizerEnabled: number,
            findImports: (importPath: string) => ImportContents,
        ): CompilationResult;
        compileStandardWrapper(input: string, findImports?: (importPath: string) => ImportContents): string;
        version(): string;
    }
    export function loadRemoteVersion(
        versionName: string,
        cb: (err: SolcError | null, res?: SolcInstance) => void,
    ): void;
    export function setupMethods(solcBin: any): SolcInstance;
}
