import 'mocha';
import * as _ from 'lodash';
import * as chai from 'chai';
import * as BigNumber from 'bignumber.js';
import promisify = require('es6-promisify');
import {numberSchema} from '../src/schemas/basic_type_schemas';
import {SchemaValidator} from '../src/utils/schema_validator';

chai.config.includeStack = true;
const expect = chai.expect;

describe('Schema', () => {
    const validator = new SchemaValidator();
    describe('#numberSchema', () => {
        describe('number regex', () => {
            it('should validate valid numbers', () => {
                const testCases = ['42', '0', '1.3', '0.2', '00.00'];
                _.forEach(testCases, (testCase: string) => {
                    expect(validator.validate(testCase as any, numberSchema).errors).to.be.lengthOf(0);
                });
            });
            it('should fail for invalid numbers', () => {
                const testCases = ['.3', '1.', 'abacaba', 'и', '1..0'];
                _.forEach(testCases, (testCase: string) => {
                    expect(validator.validate(testCase as any, numberSchema).errors).to.be.lengthOf(1);
                });
            });
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
