import * as ethUtil from 'ethereumjs-util';
import * as ethers from 'ethers';

import { EIP712TypedData, EIP712Types } from '@0xproject/types';

export const signTypedDataUtils = {
    /**
     * Computes the Sign Typed Data hash
     * @param   typedData An object that conforms to the EIP712TypedData interface
     * @return  A Buffer containing the hash of the sign typed data.
     */
    signTypedDataHash(typedData: EIP712TypedData): Buffer {
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
    _encodeData(primaryType: string, data: any, types: EIP712Types): string {
        const encodedTypes = ['bytes32'];
        const encodedValues = [signTypedDataUtils._typeHash(primaryType, types)];
        for (const field of types[primaryType]) {
            let value = data[field.name];
            if (field.type === 'string' || field.type === 'bytes') {
                value = ethUtil.sha3(value);
                encodedTypes.push('bytes32');
                encodedValues.push(value);
            } else if (types[field.type] !== undefined) {
                encodedTypes.push('bytes32');
                value = ethUtil.sha3(signTypedDataUtils._encodeData(field.type, value, types));
                encodedValues.push(value);
            } else if (field.type.lastIndexOf(']') === field.type.length - 1) {
                throw new Error('Arrays currently unimplemented in encodeData');
            } else {
                encodedTypes.push(field.type);
                encodedValues.push(value);
            }
        }
        return ethers.utils.defaultAbiCoder.encode(encodedTypes, encodedValues);
    },
    _typeHash(primaryType: string, types: EIP712Types): Buffer {
        return ethUtil.sha3(signTypedDataUtils._encodeType(primaryType, types));
    },
    _structHash(primaryType: string, data: any, types: EIP712Types): Buffer {
        return ethUtil.sha3(signTypedDataUtils._encodeData(primaryType, data, types));
    },
};
