import * as _ from 'lodash';

import { MethodAbi } from 'ethereum-types';

import { Compiler, CompilerOptions } from '@0xproject/sol-compiler';
import { DocAgnosticFormat } from '@0xproject/types';
import { logUtils } from '@0xproject/utils';

/**
 * Compiles solidity files to both their ABI and devdoc outputs, and transforms
 * those outputs into the types that feed into documentation generation tools.
 */
export class SolidityDocGenerator {
    private readonly _compilerOptions: CompilerOptions;
    /**
     * Instantiate the generator.
     * @param contractsDir the directory in which to find the contracts to be compiled
     */
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
    /**
     * Invoke the compiler and transform its outputs.
     * @param contractsToCompile list of contracts for which to generate doc objects
     * @return doc objects for use with documentation generation tools.
     */
    public async generateAsync(contractsToCompile: string[]): Promise<DocAgnosticFormat> {
        const shouldOverrideCatchAllContractsConfig = !_.isUndefined(contractsToCompile);
        if (shouldOverrideCatchAllContractsConfig) {
            this._compilerOptions.contracts = contractsToCompile;
        }

        const doc: DocAgnosticFormat = {};

        const compiler = new Compiler(this._compilerOptions);
        const compilerOutputs = await compiler.getCompilerOutputsAsync();
        for (const compilerOutput of compilerOutputs) {
            const contractFileNames = _.keys(compilerOutput.contracts);
            for (const contractFileName of contractFileNames) {
                const contractNameToOutput = compilerOutput.contracts[contractFileName];

                const contractNames = _.keys(contractNameToOutput);
                for (const contractName of contractNames) {
                    const compiledContract = contractNameToOutput[contractName];
                    if (_.isUndefined(compiledContract.abi)) {
                        throw new Error('compiled contract did not contain ABI output.');
                    }
                    if (_.isUndefined(compiledContract.devdoc)) {
                        throw new Error('compiled contract did not contain devdoc output.');
                    }

                    logUtils.log(
                        `TODO: extract data from ${contractName}'s abi (eg name, which is "${
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
