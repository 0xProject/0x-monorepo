import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import * as Web3 from 'web3';

import { AbiType, ParamKind } from './types';

export const utils = {
    solTypeToTsType(paramKind: ParamKind, solType: string): string {
        const trailingArrayRegex = /\[\d*\]$/;
        if (solType.match(trailingArrayRegex)) {
            const arrayItemSolType = solType.replace(trailingArrayRegex, '');
            const arrayItemTsType = utils.solTypeToTsType(paramKind, arrayItemSolType);
            const arrayTsType = utils.isUnionType(arrayItemTsType)
                ? `Array<${arrayItemTsType}>`
                : `${arrayItemTsType}[]`;
            return arrayTsType;
        } else {
            const solTypeRegexToTsType = [
                { regex: '^string$', tsType: 'string' },
                { regex: '^address$', tsType: 'string' },
                { regex: '^bool$', tsType: 'boolean' },
                { regex: '^u?int\\d*$', tsType: 'BigNumber' },
                { regex: '^bytes\\d*$', tsType: 'string' },
            ];
            if (paramKind === ParamKind.Input) {
                // web3 allows to pass those an non-bignumbers and that's nice
                // but it always returns stuff as BigNumbers
                solTypeRegexToTsType.unshift({
                    regex: '^u?int(8|16|32)?$',
                    tsType: 'number|BigNumber',
                });
            }
            for (const regexAndTxType of solTypeRegexToTsType) {
                const { regex, tsType } = regexAndTxType;
                if (solType.match(regex)) {
                    return tsType;
                }
            }
            throw new Error(`Unknown Solidity type found: ${solType}`);
        }
    },
    isUnionType(tsType: string): boolean {
        return tsType === 'number|BigNumber';
    },
    log(...args: any[]): void {
        console.log(...args); // tslint:disable-line:no-console
    },
    getPartialNameFromFileName(filename: string): string {
        const name = path.parse(filename).name;
        return name;
    },
    getNamedContent(filename: string): { name: string; content: string } {
        const name = utils.getPartialNameFromFileName(filename);
        try {
            const content = fs.readFileSync(filename).toString();
            return {
                name,
                content,
            };
        } catch (err) {
            throw new Error(`Failed to read ${filename}: ${err}`);
        }
    },
    getEmptyConstructor(): Web3.ConstructorAbi {
        return {
            type: AbiType.Constructor,
            stateMutability: 'nonpayable',
            payable: false,
            inputs: [],
        };
    },
};
