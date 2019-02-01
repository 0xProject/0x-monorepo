import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { constants } from '../src/constants';
import { eip712Utils } from '../src/eip712_utils';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

describe('EIP712 Utils', () => {
    describe('createTypedData', () => {
        it('adds in the EIP712DomainSeparator', () => {
            const primaryType = 'Test';
            const typedData = eip712Utils.createTypedData(
                primaryType,
                { Test: [{ name: 'testValue', type: 'uint256' }] },
                { testValue: '1' },
                constants.NULL_ADDRESS,
            );
            expect(typedData.domain).to.not.be.undefined();
            expect(typedData.types.EIP712Domain).to.not.be.undefined();
            const domainObject = typedData.domain;
            expect(domainObject.name).to.eq(constants.EIP712_DOMAIN_NAME);
            expect(typedData.primaryType).to.eq(primaryType);
        });
    });
    describe('createTypedData', () => {
        it('adds in the EIP712DomainSeparator', () => {
            const typedData = eip712Utils.createZeroExTransactionTypedData(
                {
                    salt: new BigNumber('0'),
                    data: constants.NULL_BYTES,
                    signerAddress: constants.NULL_ADDRESS,
                },
                constants.NULL_ADDRESS,
            );
            expect(typedData.primaryType).to.eq(constants.EIP712_ZEROEX_TRANSACTION_SCHEMA.name);
            expect(typedData.types.EIP712Domain).to.not.be.undefined();
        });
    });
});
