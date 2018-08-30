import * as _ from 'lodash';

import { MethodAbi } from 'ethereum-types';

import { Compiler, CompilerOptions } from '@0xproject/sol-compiler';
import { logUtils } from '@0xproject/utils';

import { SolidityDocFormat } from './solidity_doc_format';

export class SolidityDocGenerator {
    private readonly _compilerOptions: CompilerOptions;
    constructor(contractsDir: string) {
        // instantiate sol-compiler, passing in options to say we want abi and devdoc
        this._compilerOptions = {
            contractsDir,
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
                    if (_.isUndefined(compiledContract.abi)) {
                        throw new Error('compiled contract did not contain ABI output.');
                    }
                    if (_.isUndefined(compiledContract.devdoc)) {
                        throw new Error('compiled contract did not contain devdoc output.');
                    }

                    logUtils.log(
                        `TODO: extract data from ${contract}'s abi (eg name, which is "${
                            (compiledContract.abi[0] as MethodAbi).name
                        }", etc) and devdoc (eg title, which is "${
                            compiledContract.devdoc.title
                        }") outputs, and insert it into \`doc\``,
                    );
                }
            }
        }

        return doc;
    }
}
