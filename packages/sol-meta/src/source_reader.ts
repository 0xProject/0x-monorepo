import * as pathUtils from 'path';
import * as S from 'solidity-parser-antlr';

import { Deferred, existsAsync, objectPromise, readFileAsync } from './utils';

export interface SourceReaderOptions {
    remapping: { [prefix: string]: string };
    includes: string[];
    sources: string[];
}

export interface SourceInfo {
    source: string;
    parsed: S.SourceUnit;
    contracts: {
        [name: string]: S.ContractDefinition;
    };
}

export interface SourceCollection {
    [path: string]: SourceInfo;
}

// Helper class to read contract files. You can use the function `readContracts` instead.
export class ContractReader {
    public static readonly defaultOptions: SourceReaderOptions = {
        remapping: {},
        includes: [],
        sources: [],
    };

    private readonly _opts: SourceReaderOptions;

    private _result: {
        [path: string]: Promise<SourceInfo>;
    };

    constructor(opts: Partial<SourceReaderOptions>) {
        this._opts = { ...ContractReader.defaultOptions, ...opts };
        this._result = {};

        // Utility to create absolute paths
        const cwd = process.cwd();
        const makeAbsolute = (path: string) => (pathUtils.isAbsolute(path) ? path : pathUtils.join(cwd, path));

        // Make remappings absolute
        for (const prefix in this._opts.remapping) {
            if (this._opts.remapping.hasOwnProperty(prefix)) {
                this._opts.remapping[prefix] = makeAbsolute(this._opts.remapping[prefix]);
            }
        }

        // Make include dirs absolute
        this._opts.includes = this._opts.includes.map(makeAbsolute);

        // Make sources absolute
        this._opts.sources = this._opts.sources.map(makeAbsolute);
    }

    public async processSourcesAsync(): Promise<SourceCollection> {
        // Read all contract sources and imports
        await Promise.all(this._opts.sources.map(path => this._readSourceAsync(path)));

        // Resolve the result
        return objectPromise(this._result);
    }

    // Takes an import path and returns the absolute file path
    private async _resolveAsync(sourcePath: string, importPath: string): Promise<string> {
        // Try relative path
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
            const abs = pathUtils.join(pathUtils.dirname(sourcePath), importPath);
            if (await existsAsync(abs)) {
                return Promise.resolve(abs);
            } else {
                throw new Error(`Import ${importPath} from ${sourcePath} could not be found.`);
            }
        }

        // Try remappings
        for (const prefix in this._opts.remapping) {
            if (this._opts.remapping.hasOwnProperty(prefix)) {
                if (importPath.startsWith(prefix)) {
                    const replacement = this._opts.remapping[prefix];
                    const abs = pathUtils.normalize(importPath.replace(prefix, replacement));
                    if (await existsAsync(abs)) {
                        return Promise.resolve(abs);
                    } else {
                        throw new Error(`Import ${importPath} from ${sourcePath} could not be found.`);
                    }
                }
            }
        }

        // Try global include directories
        for (const include of this._opts.includes) {
            const abs = pathUtils.join(include, importPath);
            if (await existsAsync(abs)) {
                return Promise.resolve(abs);
            }
        }
        throw new Error(`Import ${importPath} from ${sourcePath} could not be found.`);
    }

    private async _readSourceAsync(absolutePath: string): Promise<SourceInfo> {
        // Try existing promises
        if (absolutePath in this._result) {
            return this._result[absolutePath];
        }

        // Create promise here so it will act as a mutex.
        // When we recursively re-enter this function below, the deferred
        // promise will already be there and we will not repeat the work.
        const deffered = new Deferred<SourceInfo>();
        this._result[absolutePath] = deffered.promise;

        // Read and save in cache
        const source = await readFileAsync(absolutePath);
        const parsed = S.parse(source, {});

        // Resolve import statments paths
        const imports = parsed.children.filter(
            ({ type }) => type === S.NodeType.ImportDirective,
        ) as S.ImportDirective[];
        const importPaths = await Promise.all(imports.map(({ path }) => this._resolveAsync(absolutePath, path)));

        // Recursively parse imported sources
        // Note: This will deadlock on cyclical imports. (We will end up awaiting our own promise.)
        // TODO: Throw an error instead.
        const importInfo = await Promise.all(importPaths.map(path => this._readSourceAsync(path)));

        // Compute global scope include imports
        // TODO: Support `SomeContract as SomeAlias` in import directives.
        let contracts: { [name: string]: S.ContractDefinition } = {};
        importInfo.forEach(({ contracts: importedContracts }) => {
            contracts = { ...contracts, ...importedContracts };
        });

        // Add local contracts
        const localContracts = parsed.children.filter(
            ({ type }) => type === S.NodeType.ContractDefinition,
        ) as S.ContractDefinition[];
        localContracts.forEach(contract => {
            contracts[contract.name] = contract;
        });

        // Resolve deferred promise and return resolved promise
        deffered.resolve({
            source,
            parsed,
            contracts,
        });
        return deffered.promise;
    }
}

export const readSources = async (
    sources: string[],
    options?: Partial<SourceReaderOptions>,
): Promise<SourceCollection> => new ContractReader({ sources, ...(options || {}) }).processSourcesAsync();
