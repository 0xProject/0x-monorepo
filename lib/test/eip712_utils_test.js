"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("@0x/utils");
var chai = require("chai");
require("mocha");
var constants_1 = require("../src/constants");
var eip712_utils_1 = require("../src/eip712_utils");
var chai_setup_1 = require("./utils/chai_setup");
chai_setup_1.chaiSetup.configure();
var expect = chai.expect;
describe('EIP712 Utils', function () {
    var CHAIN_ID = 1337;
    describe('createTypedData', function () {
        it('adds in the EIP712DomainSeparator with default values', function () {
            var primaryType = 'Test';
            var typedData = eip712_utils_1.eip712Utils.createTypedData(primaryType, { Test: [{ name: 'testValue', type: 'uint256' }] }, { testValue: '1' }, { chainId: CHAIN_ID, verifyingContract: constants_1.constants.NULL_ADDRESS });
            expect(typedData.domain).to.not.be.undefined();
            expect(typedData.types.EIP712Domain).to.not.be.undefined();
            var domainObject = typedData.domain;
            expect(domainObject.name).to.eq(constants_1.constants.EXCHANGE_DOMAIN_NAME);
            expect(domainObject.version).to.eq(constants_1.constants.EXCHANGE_DOMAIN_VERSION);
            expect(domainObject.verifyingContract).to.eq(constants_1.constants.NULL_ADDRESS);
            expect(typedData.primaryType).to.eq(primaryType);
        });
        it('adds in the EIP712DomainSeparator without default values', function () {
            var primaryType = 'Test';
            var domainName = 'testDomain';
            var domainVersion = 'testVersion';
            var typedData = eip712_utils_1.eip712Utils.createTypedData(primaryType, { Test: [{ name: 'testValue', type: 'uint256' }] }, { testValue: '1' }, {
                name: domainName,
                version: domainVersion,
                chainId: CHAIN_ID,
                verifyingContract: constants_1.constants.NULL_ADDRESS,
            });
            expect(typedData.domain).to.not.be.undefined();
            expect(typedData.types.EIP712Domain).to.not.be.undefined();
            var domainObject = typedData.domain;
            expect(domainObject.name).to.eq(domainName);
            expect(domainObject.version).to.eq(domainVersion);
            expect(domainObject.verifyingContract).to.eq(constants_1.constants.NULL_ADDRESS);
            expect(typedData.primaryType).to.eq(primaryType);
        });
    });
    describe('createZeroExTransactionTypedData', function () {
        it('adds in the EIP712DomainSeparator', function () {
            var typedData = eip712_utils_1.eip712Utils.createZeroExTransactionTypedData({
                salt: new utils_1.BigNumber(0),
                expirationTimeSeconds: new utils_1.BigNumber(0),
                gasPrice: new utils_1.BigNumber(0),
                data: constants_1.constants.NULL_BYTES,
                signerAddress: constants_1.constants.NULL_ADDRESS,
                domain: {
                    verifyingContract: constants_1.constants.NULL_ADDRESS,
                    chainId: CHAIN_ID,
                },
            });
            expect(typedData.primaryType).to.eq(constants_1.constants.EXCHANGE_ZEROEX_TRANSACTION_SCHEMA.name);
            expect(typedData.types.EIP712Domain).to.not.be.undefined();
            var domainObject = typedData.domain;
            expect(domainObject.name).to.eq(constants_1.constants.EXCHANGE_DOMAIN_NAME);
            expect(domainObject.version).to.eq(constants_1.constants.EXCHANGE_DOMAIN_VERSION);
            expect(domainObject.verifyingContract).to.eq(constants_1.constants.NULL_ADDRESS);
        });
    });
});
//# sourceMappingURL=eip712_utils_test.js.map