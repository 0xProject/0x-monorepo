import fs = require('fs');
import { parse } from './parser';
import { unparse } from './unparser';

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
        console.log(this.opts.contracts[0]);
        const source = fs.readFileSync(this.opts.contracts[0], 'utf8');
        try {
            const ast = parse(source);
            console.log(unparse(ast));
        } catch (e) {
            console.log(e);
        }
        console.log('Compiling');
    }
}
