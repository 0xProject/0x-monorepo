import { EIP712Object, EIP712ObjectValue, EIP712TypedData, EIP712Types } from '@0x/types';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { AbiEncoder } from '.';
import { BigNumber } from './configured_bignumber';

export const signTypedDataUtils = {
    /**
     * Generates the EIP712 Typed Data hash for signing
     * @param   typedData An object that conforms to the EIP712TypedData interface
     * @return  A Buffer containing the hash of the typed data.
     */
    generateTypedDataHash(typedData: EIP712TypedData): Buffer {
        return ethUtil.sha3(
            Buffer.concat([
                Buffer.from('1901', 'hex'),
                signTypedDataUtils._structHash('EIP712Domain', typedData.domain, typedData.types),
                signTypedDataUtils._structHash(typedData.primaryType, typedData.message, typedData.types),
            ]),
        );
    },
    _findDependencies(primaryType: string, types: EIP712Types, found: string[] = []): string[] {
        if (found.includes(primaryType) || types[primaryType] === undefined) {
            return found;
        }
        found.push(primaryType);
        for (const field of types[primaryType]) {
            for (const dep of signTypedDataUtils._findDependencies(field.type, types, found)) {
                if (!found.includes(dep)) {
                    found.push(dep);
                }
            }
        }
        return found;
    },
    _encodeType(primaryType: string, types: EIP712Types): string {
        let deps = signTypedDataUtils._findDependencies(primaryType, types);
        deps = deps.filter(d => d !== primaryType);
        deps = [primaryType].concat(deps.sort());
        let result = '';
        for (const dep of deps) {
            result += `${dep}(${types[dep].map(({ name, type }) => `${type} ${name}`).join(',')})`;
        }
        return result;
    },
    _encodeData(primaryType: string, data: EIP712Object, types: EIP712Types): string {
        const encodedTypes = ['bytes32'];
        const encodedValues: Array<Buffer | EIP712ObjectValue> = [signTypedDataUtils._typeHash(primaryType, types)];
        for (const field of types[primaryType]) {
            const value = data[field.name];
            if (field.type === 'string' || field.type === 'bytes') {
                const hashValue = ethUtil.sha3(value as string);
                encodedTypes.push('bytes32');
                encodedValues.push(hashValue);
            } else if (types[field.type] !== undefined) {
                encodedTypes.push('bytes32');
                const hashValue = ethUtil.sha3(
                    // tslint:disable-next-line:no-unnecessary-type-assertion
                    signTypedDataUtils._encodeData(field.type, value as EIP712Object, types),
                );
                encodedValues.push(hashValue);
            } else if (field.type.lastIndexOf(']') === field.type.length - 1) {
                throw new Error('Arrays currently unimplemented in encodeData');
            } else {
                encodedTypes.push(field.type);
                const normalizedValue = signTypedDataUtils._normalizeValue(field.type, value);
                encodedValues.push(normalizedValue);
            }
        }
        // TODO(FFF): Replace with return data encoding
        const dataItem = {
            type: 'tuple',
            name: '',
            components: _.map(encodedTypes, t => ({ type: t, name: '' })),
        };
        return AbiEncoder.create(dataItem).encode(encodedValues);
    },
    _normalizeValue(type: string, value: any): EIP712ObjectValue {
        const normalizedValue = type === 'uint256' && BigNumber.isBigNumber(value) ? value.toString() : value;
        return normalizedValue;
    },
    _typeHash(primaryType: string, types: EIP712Types): Buffer {
        return ethUtil.sha3(signTypedDataUtils._encodeType(primaryType, types));
    },
    _structHash(primaryType: string, data: EIP712Object, types: EIP712Types): Buffer {
        return ethUtil.sha3(signTypedDataUtils._encodeData(primaryType, data, types));
    },
};
