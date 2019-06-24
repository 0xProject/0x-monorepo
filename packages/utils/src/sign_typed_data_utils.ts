import { EIP712Object, EIP712ObjectValue, EIP712TypedData, EIP712Types } from '@0x/types';
import * as ethUtil from 'ethereumjs-util';
import * as ethers from 'ethers';
import * as _ from 'lodash';

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
    /**
     * Generates the EIP712 Typed Data hash for a typed data object without using the domain field. This
     * makes hashing easier for non-EIP712 data.
     * @param   typedData An object that conforms to the EIP712TypedData interface
     * @return  A Buffer containing the hash of the typed data.
     */
    generateTypedDataHashWithoutDomain(typedData: EIP712TypedData): Buffer {
        return signTypedDataUtils._structHash(typedData.primaryType, typedData.message, typedData.types);
    },
    /**
     * Generates the hash of a EIP712 Domain with the default schema
     * @param  domain An EIP712 domain with the default schema containing a name, version, chain id,
     *                and verifying address.
     * @return A buffer that contains the hash of the domain.
     */
    generateDomainHash(domain: EIP712Object): Buffer {
        return signTypedDataUtils._structHash(
            'EIP712Domain',
            domain,
            // HACK(jalextowle): When we consolidate our testing packages into test-utils, we can use a constant
            // to eliminate code duplication. At the moment, there isn't a good way to do that because of cyclic-dependencies.
            {
                EIP712Domain: [
                    { name: 'name', type: 'string' },
                    { name: 'version', type: 'string' },
                    { name: 'chainId', type: 'uint256' },
                    { name: 'verifyingContractAddress', type: 'address' },
                ],
            },
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
       // console.log('*** ENCODE TYPE RESULT ***\n', result);
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
        return ethers.utils.defaultAbiCoder.encode(encodedTypes, encodedValues);
    },
    _normalizeValue(type: string, value: any): EIP712ObjectValue {
        const STRING_BASE = 10;
        if (type === 'uint256') {
            if (BigNumber.isBigNumber(value)) {
                return value.toString(STRING_BASE);
            }
            return new BigNumber(value).toString(STRING_BASE);
        }
        return value;
    },
    _typeHash(primaryType: string, types: EIP712Types): Buffer {
        return ethUtil.sha3(signTypedDataUtils._encodeType(primaryType, types));
    },
    _structHash(primaryType: string, data: EIP712Object, types: EIP712Types): Buffer {
        return ethUtil.sha3(signTypedDataUtils._encodeData(primaryType, data, types));
    },
};
