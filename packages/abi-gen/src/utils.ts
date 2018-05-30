import { AbiType, ConstructorAbi, DataItem } from 'ethereum-types';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';

import { ContractsBackend, ParamKind } from './types';

export const utils = {
    solTypeToTsType(paramKind: ParamKind, backend: ContractsBackend, solType: string, components?: DataItem[]): string {
        const trailingArrayRegex = /\[\d*\]$/;
        if (solType.match(trailingArrayRegex)) {
            const arrayItemSolType = solType.replace(trailingArrayRegex, '');
            const arrayItemTsType = utils.solTypeToTsType(paramKind, backend, arrayItemSolType, components);
            const arrayTsType =
                utils.isUnionType(arrayItemTsType) || utils.isObjectType(arrayItemTsType)
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
                // web3 and ethers allow to pass those as numbers instead of bignumbers
                solTypeRegexToTsType.unshift({
                    regex: '^u?int(8|16|32)?$',
                    tsType: 'number|BigNumber',
                });
            }
            if (backend === ContractsBackend.Ethers && paramKind === ParamKind.Output) {
                // ethers-contracts automatically converts small BigNumbers to numbers
                solTypeRegexToTsType.unshift({
                    regex: '^u?int(8|16|32|48)?$',
                    tsType: 'number',
                });
            }
            for (const regexAndTxType of solTypeRegexToTsType) {
                const { regex, tsType } = regexAndTxType;
                if (solType.match(regex)) {
                    return tsType;
                }
            }
            const TUPLE_TYPE_REGEX = '^tuple$';
            if (solType.match(TUPLE_TYPE_REGEX)) {
                const componentsType = _.map(components, component => {
                    const componentValueType = utils.solTypeToTsType(
                        paramKind,
                        backend,
                        component.type,
                        component.components,
                    );
                    const componentType = `${component.name}: ${componentValueType}`;
                    return componentType;
                });
                const tsType = `{${componentsType}}`;
                return tsType;
            }
            throw new Error(`Unknown Solidity type found: ${solType}`);
        }
    },
    isUnionType(tsType: string): boolean {
        return tsType === 'number|BigNumber';
    },
    isObjectType(tsType: string): boolean {
        return /^{.*}$/.test(tsType);
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
    getEmptyConstructor(): ConstructorAbi {
        return {
            type: AbiType.Constructor,
            stateMutability: 'nonpayable',
            payable: false,
            inputs: [],
        };
    },
};
