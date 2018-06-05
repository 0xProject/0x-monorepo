import { BigNumber } from '@0xproject/utils';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { crypto } from './crypto';
import { EIP712Schema } from './types';

const EIP191_PREFIX = '\x19\x01';
const EIP712_DOMAIN_NAME = '0x Protocol';
const EIP712_DOMAIN_VERSION = '2';
const EIP712_VALUE_LENGTH = 32;

const EIP712_DOMAIN_SCHEMA: EIP712Schema = {
    name: 'DomainSeparator',
    parameters: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'contract', type: 'address' },
    ],
};

export const EIP712Utils = {
    /**
     * Compiles the EIP712Schema and returns the hash of the schema.
     * @param   schema The EIP712 schema.
     * @return  The hash of the compiled schema
     */
    compileSchema(schema: EIP712Schema): Buffer {
        const namedTypes = _.map(schema.parameters, parameter => `${parameter.type} ${parameter.name}`);
        const namedTypesJoined = namedTypes.join(',');
        const eip712Schema = `${schema.name}(${namedTypesJoined})`;
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
    pad32Address(address: string): Buffer {
        const addressBuffer = ethUtil.toBuffer(address);
        const addressPadded = EIP712Utils.pad32Buffer(addressBuffer);
        return addressPadded;
    },
    pad32Buffer(buffer: Buffer): Buffer {
        const bufferPadded = ethUtil.setLengthLeft(buffer, EIP712_VALUE_LENGTH);
        return bufferPadded;
    },
    _getDomainSeparatorSchemaBuffer(): Buffer {
        return EIP712Utils.compileSchema(EIP712_DOMAIN_SCHEMA);
    },
    _getDomainSeparatorHashBuffer(exchangeAddress: string): Buffer {
        const domainSeparatorSchemaBuffer = EIP712Utils._getDomainSeparatorSchemaBuffer();
        const nameHash = crypto.solSHA3([EIP712_DOMAIN_NAME]);
        const versionHash = crypto.solSHA3([EIP712_DOMAIN_VERSION]);
        const domainSeparatorHashBuff = crypto.solSHA3([
            domainSeparatorSchemaBuffer,
            nameHash,
            versionHash,
            EIP712Utils.pad32Address(exchangeAddress),
        ]);
        return domainSeparatorHashBuff;
    },
};
