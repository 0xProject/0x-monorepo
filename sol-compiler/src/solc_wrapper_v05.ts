import { CompilerOptions, StandardOutput } from 'ethereum-types';
import * as _ from 'lodash';
import solc = require('solc');

import {
    addHexPrefixToContractBytecode,
    compileDockerAsync,
    compileSolcJSAsync,
    getSolcJSAsync,
    getSolidityVersionFromSolcVersion,
    printCompilationErrorsAndWarnings,
} from './utils/compiler';

import { CompilationResult, ContractContentsByPath, ImportPrefixRemappings, SolcWrapper } from './solc_wrapper';

// Solc compiler settings cannot be configured from the commandline.
// If you need this configured, please create a `compiler.json` config file
// with your desired configurations.
export const DEFAULT_COMPILER_SETTINGS: solc.CompilerSettings = {
    optimizer: {
        enabled: false,
    },
    outputSelection: {
        '*': {
            '*': ['abi', 'evm.bytecode.object'],
        },
    },
};

// tslint:disable no-non-null-assertion

export class SolcWrapperV05 extends SolcWrapper {
    protected readonly _compilerSettings: solc.CompilerSettings;

    constructor(protected readonly _solcVersion: string, protected readonly _opts: CompilerOptions) {
        super();
        this._compilerSettings = {
            ...DEFAULT_COMPILER_SETTINGS,
            ..._opts.compilerSettings,
        };
    }

    public get version(): string {
        return this._solcVersion;
    }

    public get solidityVersion(): string {
        return getSolidityVersionFromSolcVersion(this._solcVersion);
    }

    public areCompilerSettingsDifferent(settings: any): boolean {
        return !_.isEqual(_.omit(settings, 'remappings'), _.omit(this._compilerSettings, 'remappings'));
    }

    public async compileAsync(
        contractsByPath: ContractContentsByPath,
        importRemappings: ImportPrefixRemappings,
    ): Promise<CompilationResult> {
        const input: solc.StandardInput = {
            language: 'Solidity',
            sources: {},
            settings: {
                remappings: [],
                ...this._compilerSettings,
            },
        };
        for (const [contractPath, contractContent] of Object.entries(contractsByPath)) {
            input.sources[contractPath] = { content: contractContent };
        }
        for (const [prefix, _path] of Object.entries(importRemappings)) {
            input.settings.remappings!.push(`${prefix}=${_path}`);
        }
        const output = await this._compileInputAsync(input);
        if (output.errors !== undefined) {
            printCompilationErrorsAndWarnings(output.errors);
        }
        return {
            input,
            output: this._normalizeOutput(output),
        };
    }

    protected async _compileInputAsync(input: solc.StandardInput): Promise<StandardOutput> {
        if (this._opts.useDockerisedSolc) {
            return compileDockerAsync(this.solidityVersion, input);
        }
        const solcInstance = await getSolcJSAsync(this.solidityVersion, !!this._opts.isOfflineMode);
        return compileSolcJSAsync(solcInstance, input);
    }

    // tslint:disable-next-line: prefer-function-over-method
    protected _normalizeOutput(output: StandardOutput): StandardOutput {
        const _output = _.cloneDeep(output);
        // tslint:disable-next-line forin
        for (const contractPath in _output.contracts) {
            for (const contract of Object.values(_output.contracts[contractPath])) {
                addHexPrefixToContractBytecode(contract);
            }
        }
        return _output;
    }
}
