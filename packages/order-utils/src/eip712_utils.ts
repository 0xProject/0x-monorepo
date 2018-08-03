import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { crypto } from './crypto';
import { EIP712Schema, EIP712Types } from './types';

const EIP191_PREFIX = '\x19\x01';
const EIP712_DOMAIN_NAME = '0x Protocol';
const EIP712_DOMAIN_VERSION = '2';
const EIP712_VALUE_LENGTH = 32;

const EIP712_DOMAIN_SCHEMA: EIP712Schema = {
    name: 'EIP712Domain',
    parameters: [
        { name: 'name', type: EIP712Types.String },
        { name: 'version', type: EIP712Types.String },
        { name: 'verifyingContract', type: EIP712Types.Address },
    ],
};

export const EIP712Utils = {
    /**
     * Compiles the EIP712Schema and returns the hash of the schema.
     * @param   schema The EIP712 schema.
     * @return  The hash of the compiled schema
     */
    compileSchema(schema: EIP712Schema): Buffer {
        const eip712Schema = EIP712Utils._encodeType(schema);
        const eip712SchemaHashBuffer = crypto.solSHA3([eip712Schema]);
        return eip712SchemaHashBuffer;
    },
    /**
     * Merges the EIP712 hash of a struct with the DomainSeparator for 0x v2.
     * @param   hashStruct the EIP712 hash of a struct
     * @param   contractAddress the exchange contract address
     * @return  The hash of an EIP712 message with domain separator prefixed
     */
    createEIP712Message(hashStruct: Buffer, contractAddress: string): Buffer {
        const domainSeparatorHashBuffer = EIP712Utils._getDomainSeparatorHashBuffer(contractAddress);
        const messageBuff = crypto.solSHA3([EIP191_PREFIX, domainSeparatorHashBuffer, hashStruct]);
        return messageBuff;
    },
    /**
     * Pad an address to 32 bytes
     * @param address Address to pad
     * @return padded address
     */
    pad32Address(address: string): Buffer {
        const addressBuffer = ethUtil.toBuffer(address);
        const addressPadded = EIP712Utils.pad32Buffer(addressBuffer);
        return addressPadded;
    },
    /**
     * Pad an buffer to 32 bytes
     * @param buffer Address to pad
     * @return padded buffer
     */
    pad32Buffer(buffer: Buffer): Buffer {
        const bufferPadded = ethUtil.setLengthLeft(buffer, EIP712_VALUE_LENGTH);
        return bufferPadded;
    },
    /**
     * Hash together a EIP712 schema with the corresponding data
     * @param schema EIP712-compliant schema
     * @param data Data the complies to the schema
     * @return A buffer containing the SHA256 hash of the schema and encoded data
     */
    structHash(schema: EIP712Schema, data: { [key: string]: any }): Buffer {
        const encodedData = EIP712Utils._encodeData(schema, data);
        const schemaHash = EIP712Utils.compileSchema(schema);
        const hashBuffer = crypto.solSHA3([schemaHash, ...encodedData]);
        return hashBuffer;
    },
    _getDomainSeparatorSchemaBuffer(): Buffer {
        return EIP712Utils.compileSchema(EIP712_DOMAIN_SCHEMA);
    },
    _getDomainSeparatorHashBuffer(exchangeAddress: string): Buffer {
        const domainSeparatorSchemaBuffer = EIP712Utils._getDomainSeparatorSchemaBuffer();
        const encodedData = EIP712Utils._encodeData(EIP712_DOMAIN_SCHEMA, {
            name: EIP712_DOMAIN_NAME,
            version: EIP712_DOMAIN_VERSION,
            verifyingContract: exchangeAddress,
        });
        const domainSeparatorHashBuff2 = crypto.solSHA3([domainSeparatorSchemaBuffer, ...encodedData]);
        return domainSeparatorHashBuff2;
    },
    _encodeType(schema: EIP712Schema): string {
        const namedTypes = _.map(schema.parameters, ({ name, type }) => `${type} ${name}`);
        const namedTypesJoined = namedTypes.join(',');
        const encodedType = `${schema.name}(${namedTypesJoined})`;
        return encodedType;
    },
    _encodeData(schema: EIP712Schema, data: { [key: string]: any }): any {
        const encodedValues = [];
        for (const parameter of schema.parameters) {
            const value = data[parameter.name];
            if (parameter.type === EIP712Types.String || parameter.type === EIP712Types.Bytes) {
                encodedValues.push(crypto.solSHA3([ethUtil.toBuffer(value)]));
            } else if (parameter.type === EIP712Types.Uint256) {
                encodedValues.push(value);
            } else if (parameter.type === EIP712Types.Address) {
                encodedValues.push(EIP712Utils.pad32Address(value));
            } else {
                throw new Error(`Unable to encode ${parameter.type}`);
            }
        }
        return encodedValues;
    },
};
