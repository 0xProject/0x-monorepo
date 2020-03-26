import { CompilerOptions } from 'ethereum-types';

import { SolcWrapperV05 } from './solc_wrapper_v05';

export class SolcWrapperV04 extends SolcWrapperV05 {
    constructor(solcVersion: string, opts: CompilerOptions) {
        super(solcVersion, opts);
    }
}
