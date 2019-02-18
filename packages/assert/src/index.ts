import { Schema, SchemaValidator } from '@0x/json-schemas';
import { addressUtils, BigNumber } from '@0x/utils';
import * as _ from 'lodash';
import * as validUrl from 'valid-url';

const HEX_REGEX = /^0x[0-9A-F]*$/i;

export const assert = {
    isBigNumber(variableName: string, value: BigNumber): void {
        const isBigNumber = BigNumber.isBigNumber(value);
        assert.assert(isBigNumber, assert.typeAssertionMessage(variableName, 'BigNumber', value));
    },
    isValidBaseUnitAmount(variableName: string, value: BigNumber): void {
        assert.isBigNumber(variableName, value);
        const isNegative = value.isLessThan(0);
        assert.assert(!isNegative, `${variableName} cannot be a negative number, found value: ${value.toNumber()}`);
        const hasDecimals = value.decimalPlaces() !== 0;
        assert.assert(
            !hasDecimals,
            `${variableName} should be in baseUnits (no decimals), found value: ${value.toNumber()}`,
        );
    },
    isString(variableName: string, value: string): void {
        assert.assert(_.isString(value), assert.typeAssertionMessage(variableName, 'string', value));
    },
    isFunction(variableName: string, value: any): void {
        assert.assert(_.isFunction(value), assert.typeAssertionMessage(variableName, 'function', value));
    },
    isHexString(variableName: string, value: string): void {
        assert.assert(
            _.isString(value) && HEX_REGEX.test(value),
            assert.typeAssertionMessage(variableName, 'HexString', value),
        );
    },
    isETHAddressHex(variableName: string, value: string): void {
        assert.assert(_.isString(value), assert.typeAssertionMessage(variableName, 'string', value));
        assert.assert(addressUtils.isAddress(value), assert.typeAssertionMessage(variableName, 'ETHAddressHex', value));
    },
    doesBelongToStringEnum(
        variableName: string,
        value: string,
        stringEnum: any /* There is no base type for every string enum */,
    ): void {
        const enumValues = _.values(stringEnum);
        const doesBelongToStringEnum = _.includes(enumValues, value);
        const enumValuesAsStrings = _.map(enumValues, enumValue => `'${enumValue}'`);
        const enumValuesAsString = enumValuesAsStrings.join(', ');
        assert.assert(
            doesBelongToStringEnum,
            `Expected ${variableName} to be one of: ${enumValuesAsString}, encountered: ${value}`,
        );
    },
    hasAtMostOneUniqueValue(value: any[], errMsg: string): void {
        assert.assert(_.uniq(value).length <= 1, errMsg);
    },
    isNumber(variableName: string, value: number): void {
        assert.assert(_.isFinite(value), assert.typeAssertionMessage(variableName, 'number', value));
    },
    isBoolean(variableName: string, value: boolean): void {
        assert.assert(_.isBoolean(value), assert.typeAssertionMessage(variableName, 'boolean', value));
    },
    doesConformToSchema(variableName: string, value: any, schema: Schema, subSchemas?: Schema[]): void {
        if (_.isUndefined(value)) {
            throw new Error(`${variableName} can't be undefined`);
        }
        const schemaValidator = new SchemaValidator();
        if (!_.isUndefined(subSchemas)) {
            _.map(subSchemas, schemaValidator.addSchema.bind(schemaValidator));
        }
        const validationResult = schemaValidator.validate(value, schema);
        const hasValidationErrors = validationResult.errors.length > 0;
        const msg = `Expected ${variableName} to conform to schema ${schema.id}
Encountered: ${JSON.stringify(value, null, '\t')}
Validation errors: ${validationResult.errors.join(', ')}`;
        assert.assert(!hasValidationErrors, msg);
    },
    isWebUri(variableName: string, value: any): void {
        const isValidUrl = !_.isUndefined(validUrl.isWebUri(value));
        assert.assert(isValidUrl, assert.typeAssertionMessage(variableName, 'web uri', value));
    },
    isUri(variableName: string, value: any): void {
        const isValidUri = !_.isUndefined(validUrl.isUri(value));
        assert.assert(isValidUri, assert.typeAssertionMessage(variableName, 'uri', value));
    },
    assert(condition: boolean, message: string): void {
        if (!condition) {
            throw new Error(message);
        }
    },
    typeAssertionMessage(variableName: string, type: string, value: any): string {
        return `Expected ${variableName} to be of type ${type}, encountered: ${value}`;
    },
};
