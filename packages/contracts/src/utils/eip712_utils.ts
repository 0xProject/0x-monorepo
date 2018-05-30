import { BigNumber } from '@0xproject/utils';
import ethUtil = require('ethereumjs-util');
import * as _ from 'lodash';

import { crypto } from './crypto';
import { EIP712Schema } from './types';

const EIP191_PREFIX = '\x19\x01';
const EIP712_DOMAIN_NAME = '0x Protocol';
const EIP712_DOMAIN_VERSION = '1';

const EIP712_DOMAIN_SCHEMA: EIP712Schema = {
    name: 'DomainSeparator',
    parameters: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'contract', type: 'address' },
    ],
};

export const EIP712Utils = {
    compileSchema(schema: EIP712Schema): Buffer {
        const namedTypes = _.map(schema.parameters, parameter => `${parameter.type} ${parameter.name}`);
        const namedTypesJoined = namedTypes.join(',');
        const eip712Schema = `${schema.name}(${namedTypesJoined})`;
        const eip712SchemaHashBuffer = crypto.solSHA3([eip712Schema]);
        return eip712SchemaHashBuffer;
    },
    createEIP712Message(hashStruct: string, contractAddress: string): Buffer {
        const domainSeparatorHashHex = EIP712Utils.getDomainSeparatorHashHex(contractAddress);
        const messageBuff = crypto.solSHA3([
            EIP191_PREFIX,
            new BigNumber(domainSeparatorHashHex),
            new BigNumber(hashStruct),
        ]);
        return messageBuff;
    },
    getDomainSeparatorSchemaBuffer(): Buffer {
        return EIP712Utils.compileSchema(EIP712_DOMAIN_SCHEMA);
    },
    getDomainSeparatorHashHex(exchangeAddress: string): string {
        const domainSeparatorSchemaBuffer = EIP712Utils.getDomainSeparatorSchemaBuffer();
        const nameHash = crypto.solSHA3([EIP712_DOMAIN_NAME]);
        const versionHash = crypto.solSHA3([EIP712_DOMAIN_VERSION]);
        const domainSeparatorHashBuff = crypto.solSHA3([
            domainSeparatorSchemaBuffer,
            nameHash,
            versionHash,
            EIP712Utils.pad32Address(exchangeAddress),
        ]);
        const domainSeparatorHashHex = `0x${domainSeparatorHashBuff.toString('hex')}`;
        return domainSeparatorHashHex;
    },
    pad32Address(address: string): Buffer {
        const addressBuffer = ethUtil.toBuffer(address);
        const addressPadded = EIP712Utils.pad32Buffer(addressBuffer);
        return addressPadded;
    },
    pad32Buffer(buffer: Buffer): Buffer {
        const bufferPadded = ethUtil.setLengthLeft(buffer, 32);
        return bufferPadded;
    },
};
