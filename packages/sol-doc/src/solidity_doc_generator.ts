import * as _ from 'lodash';

import { MethodAbi } from 'ethereum-types';

import { Compiler, CompilerOptions } from '@0xproject/sol-compiler';
import { logUtils } from '@0xproject/utils';

import { SolidityDocFormat } from './solidity_doc_format';

export class SolidityDocGenerator {
    private readonly _compilerOptions: CompilerOptions;
    constructor(contractsDir: string, artifactsDir: string) {
        // instantiate sol-compiler, passing in options to say we want abi and devdoc
        this._compilerOptions = {
            contractsDir,
            artifactsDir,
            contracts: '*',
            compilerSettings: {
                outputSelection: {
                    ['*']: {
                        ['*']: ['abi', 'devdoc'],
                    },
                },
            },
        };
    }
    /// run `contractsToCompile` through compiler, gathering output
    public async generateAsync(contractsToCompile: string[]): Promise<SolidityDocFormat> {
        if (!_.isUndefined(contractsToCompile)) {
            this._compilerOptions.contracts = contractsToCompile;
        }

        const compiler = new Compiler(this._compilerOptions);

        const doc = new SolidityDocFormat();

        const compilerOutputs = await compiler.getCompilerOutputsAsync();
        for (const compilerOutput of compilerOutputs) {
            const solidityModules = _.keys(compilerOutput.contracts);
            for (const solidityModule of solidityModules) {
                const compiledSolidityModule = compilerOutput.contracts[solidityModule];

                const contracts = _.keys(compiledSolidityModule);
                for (const contract of contracts) {
                    const compiledContract = compiledSolidityModule[contract];

                    // TODO: modify typescript-typings/types/solc/index.d.ts... it doesn't currently support devdoc!
                    // tslint:disable-next-line:no-unnecessary-type-assertion tsc says abi[0] has no property `name` and won't compile without the `as`, but tslint says the `as` is unnecssary.
                    logUtils.log(
                        `TODO: extract data from ${contract}'s abi (eg ${
                            (compiledContract.abi[0] as MethodAbi).name
                        }, etc) and devdoc outputs, and insert it into \`doc\``,
                    );
                }
            }
        }

        return doc;
    }
}
