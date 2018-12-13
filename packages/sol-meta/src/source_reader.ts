import { Deferred } from '@0x/utils';
import * as glob from 'glob';
import * as _ from 'lodash';
import * as pathUtils from 'path';
import * as S from 'solidity-parser-antlr';

import * as utils from './utils';

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
    scope: {
        [name: string]: S.ContractDefinition;
    };
}

// TODO: We are missing the remapping and import statements. This information is necessary
//       to fully interpret the ImportDirectives. We could solve this by including the
//       SourceReaderOptions as part of the SourceCollection, but then we'd need to
//       put the path mapping in a separate variable.
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

    private readonly _result: {
        [path: string]: Promise<SourceInfo>;
    };

    constructor(opts: Partial<SourceReaderOptions>) {
        this._opts = { ...ContractReader.defaultOptions, ...opts };
        this._result = {};

        // Unglob the source and include paths
        const unglob = (paths: string[]) =>
            utils.flatMap(paths, pattern => (glob.hasMagic(pattern) ? glob.sync(pattern) : [pattern]));
        this._opts.sources = unglob(this._opts.sources);
        this._opts.includes = unglob(this._opts.includes);

        // Utility to create absolute paths
        const cwd = process.cwd();
        const makeAbsolute = (path: string) => (pathUtils.isAbsolute(path) ? path : pathUtils.join(cwd, path));

        // Make all paths absolute
        this._opts.sources = _.map(this._opts.sources, makeAbsolute);
        this._opts.includes = _.map(this._opts.includes, makeAbsolute);
        this._opts.remapping = utils.objectMap(this._opts.remapping, makeAbsolute);
    }

    public async processSourcesAsync(): Promise<SourceCollection> {
        // Read all contract sources and imports
        await Promise.all(_.map(this._opts.sources, async path => this._readSourceAsync(path)));

        // Resolve the result
        return utils.objectPromiseAsync(this._result);
    }

    // Takes an import path and returns the absolute file path
    private async _resolveAsync(sourcePath: string, importPath: string): Promise<string> {
        // Try relative path
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
            const abs = pathUtils.join(pathUtils.dirname(sourcePath), importPath);
            if (await utils.existsAsync(abs)) {
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
                    if (await utils.existsAsync(abs)) {
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
            if (await utils.existsAsync(abs)) {
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
        const source = await utils.readFileAsync(absolutePath);
        const parsed = S.parse(source, {});

        // Resolve import statments paths
        const imports = parsed.children.filter(
            ({ type }) => type === S.NodeType.ImportDirective,
        ) as S.ImportDirective[];
        const importPaths = await Promise.all(
            _.map(imports, async ({ path }) => this._resolveAsync(absolutePath, path)),
        );

        // Recursively parse imported sources
        // Note: This will deadlock on cyclical imports. (We will end up awaiting our own promise.)
        // TODO: Throw an error instead.
        const importInfo = await Promise.all(_.map(importPaths, async path => this._readSourceAsync(path)));

        // Compute global scope include imports
        // TODO: Support `SomeContract as SomeAlias` in import directives.
        let scope: { [name: string]: S.ContractDefinition } = {};
        importInfo.forEach(({ scope: importedContracts }) => {
            scope = { ...scope, ...importedContracts };
        });

        // Add local contracts
        const contracts: { [name: string]: S.ContractDefinition } = {};
        utils.contracts(parsed).forEach(contract => {
            contracts[contract.name] = contract;
            scope[contract.name] = contract;
        });

        // Resolve deferred promise and return resolved promise
        deffered.resolve({
            source,
            parsed,
            contracts,
            scope,
        });
        return deffered.promise;
    }
}

// TODO(remco): Deduplicate with sol-compiler
export const readSources = async (
    sources: string[],
    options?: Partial<SourceReaderOptions>,
): Promise<SourceCollection> => new ContractReader({ sources, ...(options || {}) }).processSourcesAsync();
