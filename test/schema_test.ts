import 'mocha';
import * as _ from 'lodash';
import * as chai from 'chai';
import * as BigNumber from 'bignumber.js';
import promisify = require('es6-promisify');
import {constants} from './utils/constants';
import {SchemaValidator} from '../src/utils/schema_validator';
import {addressSchema, numberSchema} from '../src/schemas/basic_type_schemas';
import {ecSignatureParameterSchema, ecSignatureSchema} from '../src/schemas/ec_signature_schema';

chai.config.includeStack = true;
const expect = chai.expect;

describe('Schema', () => {
    const validator = new SchemaValidator();
    const batchTestSchema = (testCases: any[], schema: any, shouldFail = false) => {
        _.forEach(testCases, (testCase: any) => {
            expect(validator.validate(testCase, schema).errors).to.be.lengthOf(shouldFail ? 1 : 0);
        });
    };
    describe('#numberSchema', () => {
        it('should validate valid numbers', () => {
            const testCases = ['42', '0', '1.3', '0.2', '00.00'];
            batchTestSchema(testCases, numberSchema);
        });
        it('should fail for invalid numbers', () => {
            const testCases = ['.3', '1.', 'abacaba', 'и', '1..0'];
            batchTestSchema(testCases, numberSchema, true);
        });
    });
    describe('#addressSchema', () => {
        it('should validate valid addresses', () => {
            const testCases = ['0x8b0292B11a196601eD2ce54B665CaFEca0347D42', constants.NULL_ADDRESS];
            batchTestSchema(testCases, addressSchema);
        });
        it('should fail for invalid addresses', () => {
            const testCases = ['0x', '0', '0x00', '0xzzzzzzB11a196601eD2ce54B665CaFEca0347D42'];
            batchTestSchema(testCases, addressSchema, true);
        });
    });
    describe('#ecSignatureParameter', () => {
        it('should validate valid parameters', () => {
            const testCases = [
                '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33',
                '0X40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254',
            ];
            batchTestSchema(testCases, ecSignatureParameterSchema);
        });
        it('should fail for invalid parameters', () => {
            const testCases = [
                '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc3',  // shorter
                '0xzzzz9190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254', // invalid characters
                '40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254',   // no 0x
            ];
            batchTestSchema(testCases, ecSignatureParameterSchema, true);
        });
    });
    describe('#ecSignature', () => {
        it('should validate valid signature', () => {
            const signature = {
                v: 27,
                r: '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33',
                s: '0x40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254',
            };
            const testCases = [
                signature,
                {
                    ...signature,
                    v: 28,
                },
            ];
            batchTestSchema(testCases, ecSignatureSchema);
        });
        it('should fail for invalid signature', () => {
            const v = 27;
            const r = '0x61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc33';
            const s = '0x40349190569279751135161d22529dc25add4f6069af05be04cacbda2ace2254';
            const testCases = [
                {},
                {v},
                {r, s, v: 31},
            ];
            batchTestSchema(testCases, ecSignatureSchema, true);
        });
    });
    describe('BigNumber serialization', () => {
        it('should correctly serialize BigNumbers', () => {
            const testCases = {
                '42': '42',
                '0': '0',
                '1.3': '1.3',
                '0.2': '0.2',
                '00.00': '0',
                '.3': '0.3',
            };
            _.forEach(testCases, (serialized: string, input: string) => {
                expect(SchemaValidator.convertToJSONSchemaCompatibleObject(new BigNumber(input)))
                    .to.be.equal(serialized);
            });
        });
    });
});
