import { CompilerOptions, StandardOutput } from 'ethereum-types';
import solc = require('solc');

import { compileSolcJSAsync, getSolcJSAsync } from './utils/compiler';

import { SolcWrapperV05 } from './solc_wrapper_v05';

// 0.6.x has a `compile()` function in lieu of `compileStandardWrapper`.
type SolcV06 = solc.SolcInstance & { compile(input: string): string };

export class SolcWrapperV06 extends SolcWrapperV05 {
    constructor(solcVersion: string, opts: CompilerOptions) {
        super(solcVersion, opts);
    }

    protected async _compileInputAsync(input: solc.StandardInput): Promise<StandardOutput> {
        if (this._opts.useDockerisedSolc) {
            return super._compileInputAsync(input);
        }
        // Shim the old `compileStandardWrapper` function.
        const solcInstance = (await getSolcJSAsync(this.solidityVersion, !!this._opts.isOfflineMode)) as SolcV06;
        solcInstance.compileStandardWrapper = solcInstance.compile;
        return compileSolcJSAsync(solcInstance, input);
    }
}
