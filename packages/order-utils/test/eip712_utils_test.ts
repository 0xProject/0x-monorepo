import { BigNumber } from '@0x/utils';
import * as chai from 'chai';
import 'mocha';

import { constants } from '../src/constants';
import { eip712Utils } from '../src/eip712_utils';

import { chaiSetup } from './utils/chai_setup';

chaiSetup.configure();
const expect = chai.expect;

describe('EIP712 Utils', () => {
    const CHAIN_ID = 1337;

    describe('createTypedData', () => {
        it('adds in the EIP712DomainSeparator with default values', () => {
            const primaryType = 'Test';
            const typedData = eip712Utils.createTypedData(
                primaryType,
                { Test: [{ name: 'testValue', type: 'uint256' }] },
                { testValue: '1' },
                { chainId: CHAIN_ID, verifyingContract: constants.NULL_ADDRESS },
            );
            expect(typedData.domain).to.not.be.undefined();
            expect(typedData.types.EIP712Domain).to.not.be.undefined();
            const domainObject = typedData.domain;
            expect(domainObject.name).to.eq(constants.EXCHANGE_DOMAIN_NAME);
            expect(domainObject.version).to.eq(constants.EXCHANGE_DOMAIN_VERSION);
            expect(domainObject.verifyingContract).to.eq(constants.NULL_ADDRESS);
            expect(typedData.primaryType).to.eq(primaryType);
        });
        it('adds in the EIP712DomainSeparator without default values', () => {
            const primaryType = 'Test';
            const domainName = 'testDomain';
            const domainVersion = 'testVersion';
            const typedData = eip712Utils.createTypedData(
                primaryType,
                { Test: [{ name: 'testValue', type: 'uint256' }] },
                { testValue: '1' },
                {
                    name: domainName,
                    version: domainVersion,
                    chainId: CHAIN_ID,
                    verifyingContract: constants.NULL_ADDRESS,
                },
            );
            expect(typedData.domain).to.not.be.undefined();
            expect(typedData.types.EIP712Domain).to.not.be.undefined();
            const domainObject = typedData.domain;
            expect(domainObject.name).to.eq(domainName);
            expect(domainObject.version).to.eq(domainVersion);
            expect(domainObject.verifyingContract).to.eq(constants.NULL_ADDRESS);
            expect(typedData.primaryType).to.eq(primaryType);
        });
    });
    describe('createZeroExTransactionTypedData', () => {
        it('adds in the EIP712DomainSeparator', () => {
            const typedData = eip712Utils.createZeroExTransactionTypedData({
                salt: new BigNumber(0),
                expirationTimeSeconds: new BigNumber(0),
                gasPrice: new BigNumber(0),
                data: constants.NULL_BYTES,
                signerAddress: constants.NULL_ADDRESS,
                domain: {
                    verifyingContract: constants.NULL_ADDRESS,
                    chainId: CHAIN_ID,
                },
            });
            expect(typedData.primaryType).to.eq(constants.EXCHANGE_ZEROEX_TRANSACTION_SCHEMA.name);
            expect(typedData.types.EIP712Domain).to.not.be.undefined();
            const domainObject = typedData.domain;
            expect(domainObject.name).to.eq(constants.EXCHANGE_DOMAIN_NAME);
            expect(domainObject.version).to.eq(constants.EXCHANGE_DOMAIN_VERSION);
            expect(domainObject.verifyingContract).to.eq(constants.NULL_ADDRESS);
        });
    });
});
