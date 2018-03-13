// tslint:disable:completed-docs
declare module 'solc' {
    import * as Web3 from 'web3';
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
    export interface SolcInstance {
        compile(
            sources: InputSources,
            optimizerEnabled: number,
            findImports: (importPath: string) => ImportContents,
        ): CompilationResult;
    }
    export function loadRemoteVersion(versionName: string, cb: (err: Error | null, res?: SolcInstance) => void): void;
    export function setupMethods(solcBin: any): SolcInstance;
}

declare module 'web3-eth-abi' {
    export function encodeParameters(typesArray: string[], parameters: any[]): string;
}
