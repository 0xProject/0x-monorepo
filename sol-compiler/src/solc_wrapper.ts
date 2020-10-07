import { StandardOutput } from 'ethereum-types';
import { StandardInput } from 'solc';

export interface ContractContentsByPath {
    [path: string]: string;
}

export interface ImportPrefixRemappings {
    [prefix: string]: string;
}

export interface CompilationResult {
    input: StandardInput;
    output: StandardOutput;
}

export abstract class SolcWrapper {
    /**
     * Get the solc version.
     */
    public abstract get version(): string;

    /**
     * Check if the configured compiler settings is different from another.
     */
    public abstract areCompilerSettingsDifferent(settings: any): boolean;

    /**
     * Compile contracts, returning standard input and output.
     */
    public abstract compileAsync(
        contractsByPath: ContractContentsByPath,
        dependencies: ImportPrefixRemappings,
    ): Promise<CompilationResult>;
}
