import fs = require('fs');
import { parse } from './parser';
import { unparse } from './unparser';
import { expose } from './exposer';
import { mock } from './mocker';

import * as util from 'util'; // DEBUG

export interface CompilerOptions {
    contractsDir: string;
    contracts: string;
}

export class Compiler {

    private readonly opts: CompilerOptions;

    constructor(opts?: CompilerOptions) {
        this.opts = opts || {
            contractsDir: '',
            contracts: '',
        } ;
    }

    public async compileAsync() {
        const filePath = this.opts.contracts[0];
        const source = fs.readFileSync(filePath, 'utf8');
        try {
            const ast = parse(source);
            //console.log(util.inspect(ast, {depth: 40}));
            //console.log(unparse(ast));
            const astp = mock(ast);
            console.log(util.inspect(astp, {depth: 4}));
            console.log(unparse(astp));
        } catch (e) {
            console.log(e);
        }
    }
}
