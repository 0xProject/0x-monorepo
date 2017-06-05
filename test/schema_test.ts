import 'mocha';
import * as chai from 'chai';
import * as BigNumber from 'bignumber.js';
import {numberSchema} from '../src/schemas/order_schemas';
import {SchemaValidator} from '../src/utils/schema_validator';
import promisify = require('es6-promisify');

chai.config.includeStack = true;
const expect = chai.expect;

describe('Schema', () => {
    const validator = new SchemaValidator();
    describe('#numberSchema', () => {
        describe('number regex', () => {
            it('should validate valid numbers', () => {
                expect(validator.validate('42' as any, numberSchema).errors).to.be.lengthOf(0);
                expect(validator.validate('0' as any, numberSchema).errors).to.be.lengthOf(0);
                expect(validator.validate('1.3' as any, numberSchema).errors).to.be.lengthOf(0);
                expect(validator.validate('0.2' as any, numberSchema).errors).to.be.lengthOf(0);
                expect(validator.validate('00.00' as any, numberSchema).errors).to.be.lengthOf(0);
            });
            it('should fail for invalid numbers', () => {
                expect(validator.validate('.3' as any, numberSchema).errors).to.be.lengthOf(1);
                expect(validator.validate('1.' as any, numberSchema).errors).to.be.lengthOf(1);
                expect(validator.validate('abacaba' as any, numberSchema).errors).to.be.lengthOf(1);
                expect(validator.validate('и' as any, numberSchema).errors).to.be.lengthOf(1);
                expect(validator.validate('1..0' as any, numberSchema).errors).to.be.lengthOf(1);
            });
        });
    });
    describe('BigNumber serialization', () => {
        it.only('should correctly serialize BigNumbers', async () => {
            expect(SchemaValidator.convertToJSONSchemaCompatibleObject(new BigNumber('42'))).to.be.equal('42');
            expect(SchemaValidator.convertToJSONSchemaCompatibleObject(new BigNumber('0'))).to.be.equal('0');
            expect(SchemaValidator.convertToJSONSchemaCompatibleObject(new BigNumber('1.3'))).to.be.equal('1.3');
            expect(SchemaValidator.convertToJSONSchemaCompatibleObject(new BigNumber('0.2'))).to.be.equal('0.2');
            expect(SchemaValidator.convertToJSONSchemaCompatibleObject(new BigNumber('00.00'))).to.be.equal('0');
            expect(SchemaValidator.convertToJSONSchemaCompatibleObject(new BigNumber('.3'))).to.be.equal('0.3');
        });
    });
});
