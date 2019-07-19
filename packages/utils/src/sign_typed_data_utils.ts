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
        console.log('generateTypedDataHash'); // TODO: remove
        return ethUtil.sha3(
            Buffer.concat([
                Buffer.from('1901', 'hex'),
                signTypedDataUtils._structHash('EIP712Domain', typedData.domain, typedData.types),
                signTypedDataUtils._structHash(typedData.primaryType, typedData.message, typedData.types),
            ]),
        );
    },
    _findDependencies(primaryType: string, types: EIP712Types, found: string[] = []): string[] {
        console.log('_findDependencies'); // TODO: remove
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
        console.log('_encodeType'); // TODO: remove
        let deps = signTypedDataUtils._findDependencies(primaryType, types);
        deps = deps.filter(d => d !== primaryType);
        deps = [primaryType].concat(deps.sort());
        let result = '';
        for (const dep of deps) {
            result += `${dep}(${types[dep].map(({ name, type }) => `${type} ${name}`).join(',')})`;
        }
        return result;
    },
    _encodeValue(
      type: string,
      value: EIP712ObjectValue,
      types: EIP712Types,
    ): string {
        console.log('_encodeValue'); // TODO: remove
      // strings and bytes
      if (type === 'string' || type === 'bytes') {
          return ethers.utils.defaultAbiCoder.encode(
            ['bytes32'],
            [ethUtil.sha3(value as string)],
          );
      }

      // structs
      if (types[type] !== undefined) {
          return ethers.utils.defaultAbiCoder.encode(
            ['bytes32'],
            // tslint:disable-next-line:no-unnecessary-type-assertion
            [ethUtil.sha3(signTypedDataUtils._encodeData(type, value as EIP712Object, types))],
          );
      }

      // arrays
      const arrayIndex = type.lastIndexOf('[]');
      if (arrayIndex >= 0) {
          const baseType = type.slice(0, arrayIndex);
          console.log('baseType: ', baseType); // TODO: remove
          // tslint:disable-next-line:no-unnecessary-type-assertion
          const hashableValues: Array<{ t: string; v: string }> =
            (value as any[]).map((v: EIP712ObjectValue) => ({
              t: 'bytes32',
              // tslint:disable-next-line:no-unnecessary-type-assertion
              v: signTypedDataUtils._encodeValue(baseType, v as EIP712Object, types),
            }));
          console.log(hashableValues); // TODO: remove
          const retVal = ethers.utils.defaultAbiCoder.encode(
            ['bytes32'],
            [ethUtil.sha3.apply(null, hashableValues)],
          );
          console.log(hashableValues); // TODO: remove
          return retVal;
      }

      // primitive values (<= 32 bytes)
      return ethers.utils.defaultAbiCoder.encode(
        [type],
        [signTypedDataUtils._normalizeValue(type, value)],
      );
    },
    _encodeData(primaryType: string, data: EIP712Object, types: EIP712Types): string {
        console.log('_encodeData'); // TODO: remove
        const encodedTypes = ['bytes32'];
        const encodedValues: Array<Buffer | EIP712ObjectValue> = [signTypedDataUtils._typeHash(primaryType, types)];
        for (const field of types[primaryType]) {
          const value = data[field.name];
          const slot: string = signTypedDataUtils._encodeValue(field.type, value, types);
          encodedTypes.push('bytes32');
          encodedValues.push(slot);
        }
        return ethers.utils.defaultAbiCoder.encode(encodedTypes, encodedValues);
    },
    _normalizeValue(type: string, value: any): EIP712ObjectValue {
        console.log('_normalizeValue'); // TODO: remove
        const normalizedValue = type === 'uint256' && BigNumber.isBigNumber(value) ? value.toString() : value;
        return normalizedValue;
    },
    _typeHash(primaryType: string, types: EIP712Types): Buffer {
        console.log('_typeHash'); // TODO: remove
        return ethUtil.sha3(signTypedDataUtils._encodeType(primaryType, types));
    },
    _structHash(primaryType: string, data: EIP712Object, types: EIP712Types): Buffer {
        console.log('_structHash'); // TODO: remove
        return ethUtil.sha3(signTypedDataUtils._encodeData(primaryType, data, types));
    },
};
