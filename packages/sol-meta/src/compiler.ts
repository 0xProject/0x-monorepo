import * as fs from 'fs';
import * as pathUtils from 'path';
import * as process from 'process';
import * as S from 'solidity-parser-antlr';

import { flatMap } from './utils';
import { flattenContract } from './flattener';
import { unparse } from './unparser';
import { mockContract } from './mocker';
import { Children } from 'react';

export interface CompilerOptions {
    remapping: { [prefix: string]: string };
    includes: string[];
    sources: string[];
    output: string;
}

const existsAsync = (path: string): Promise<boolean> =>
    new Promise((resolve, reject) =>
        fs.access(path, fs.constants.R_OK, error => (error ? resolve(false) : resolve(true))),
    );

const readFileAsync = (path: string): Promise<string> =>
    new Promise((resolve, reject) =>
        fs.readFile(path, 'utf-8', (error, contents) => (error ? reject(error) : resolve(contents))),
    );

const writeFileAsync = (path: string, contents: string): Promise<void> =>
    new Promise((resolve, reject) =>
        fs.writeFile(path, contents, 'utf-8', error => (error ? reject(error) : resolve())),
    );

export class Compiler {
    public static readonly defaultOptions: CompilerOptions = {
        remapping: {},
        includes: [],
        sources: [],
        output: './out.sol',
    };

    private readonly _opts: CompilerOptions;

    // ASTs for all source files
    private _sources: { [path: string]: S.SourceUnit };

    // For a given source file, contracts by name (including imports)
    private _contracts: { [path: string]: { [name: string]: S.ContractDefinition } };

    constructor(opts: CompilerOptions) {
        this._opts = opts;
        this._sources = {};
        this._contracts = {};

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

    // Takes an import path and returns the absolute file path
    public async resolveAsync(sourcePath: string, importPath: string): Promise<string> {
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

    public async readSourceAsync(absolutePath: string): Promise<S.SourceUnit> {
        // Try cache
        if (absolutePath in this._sources) {
            return Promise.resolve(this._sources[absolutePath]);
        }

        // Set a placeholder to act as an improvised mutex.
        this._sources[absolutePath] = { type: S.NodeType.SourceUnit, children: [] };

        // Read and save in cache
        const contents = await readFileAsync(absolutePath);
        const source = S.parse(contents, {});
        this._sources[absolutePath] = source;

        // List contracts
        const contracts = source.children.filter(
            ({ type }) => type === S.NodeType.ContractDefinition,
        ) as S.ContractDefinition[];
        contracts.forEach(({ name }) => console.log(`Read ${name}`));

        // Resolve import statments
        const imports = source.children.filter(
            ({ type }) => type === S.NodeType.ImportDirective,
        ) as S.ImportDirective[];
        const importPaths = await Promise.all(imports.map(({ path }) => this.resolveAsync(absolutePath, path)));

        // Recursively parse imported sources
        await Promise.all(importPaths.map(path => this.readSourceAsync(path)));

        // Compute global scope include imports
        // TODO: `SomeContract as SomeAlias` in import directives.
        let definitions: { [name: string]: S.ContractDefinition } = {};
        importPaths.forEach(path => {
            definitions = { ...definitions, ...this._contracts[path] };
        });
        contracts.forEach(contract => {
            definitions[contract.name] = contract;
        });
        this._contracts[absolutePath] = definitions;

        // Return parsed source code
        return Promise.resolve(source);
    }

    public async compileAsync(): Promise<void> {
        if (this._opts.sources.length === 0) {
            console.log('No sources to process.');
        }

        // Read all contract sources and imports
        await Promise.all(this._opts.sources.map(path => this.readSourceAsync(path)));

        const contracts = (source: S.SourceUnit) =>
            source.children.filter(({ type }) => type === S.NodeType.ContractDefinition) as S.ContractDefinition[];

        // Target sources
        for (const path of this._opts.sources) {
            const source = this._sources[path];
            const contractsByName = this._contracts[path];

            for (const contract of contracts(source)) {
                console.log('Analyzing ', contract.name);
                console.log(Object.keys(contractsByName));

                // Flatten contract
                const flat = flattenContract(contract, name => contractsByName[name]);

                // Mock contract
                const mocked = mockContract(flat);

                // Construct output source unit
                const output = {
                    type: S.NodeType.SourceUnit,
                    children: [
                        ...source.children.filter(({ type }) => type === S.NodeType.PragmaDirective),
                        {
                            type: S.NodeType.ImportDirective,
                            path,
                        },
                        mocked,
                    ],
                };

                if (await existsAsync(this._opts.output)) {
                    throw new Error(`Ouput file ${this._opts.output} already exists`);
                }

                await writeFileAsync(this._opts.output, unparse(output));
            }
        }
    }
}
