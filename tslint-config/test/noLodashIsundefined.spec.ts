import * as assert from 'assert';

import { Rule } from '../rules/noLodashIsundefinedRule';

import { getFixedResult, helper } from './lintrunner';
const rule = 'no-lodash-isundefined';

describe('noLodashIsundefinedRule', () => {
    it(`should not fail built-in`, () => {
        const src = `if (someObj === undefined) { // do stuff }`;
        const result = helper(src, rule);
        assert.equal(result.errorCount, 0);
    });
    it(`should not fail custom isUndefined`, () => {
        const src = `if (isUndefined(someObj)) { // do stuff }`;
        const result = helper(src, rule);
        assert.equal(result.errorCount, 0);
    });
    it(`should fail _.isUndefined with simple identifier`, () => {
        const src = `if (_.isUndefined(obj)) { // do stuff }`;
        const result = helper(src, rule);
        assert.equal(result.errorCount, 1);
    });
    it(`should fail _.isUndefined with property access expression`, () => {
        const src = `if (_.isUndefined(this.property)) { // do stuff }`;
        const result = helper(src, rule);
        assert.equal(result.errorCount, 1);
    });
    it(`should fail _.isUndefined with element access expression`, () => {
        const src = `if (_.isUndefined(someArray[nested])) { // do stuff }`;
        const result = helper(src, rule);
        assert.equal(result.errorCount, 1);
    });
    it(`should fail _.isUndefined with property and element access expression`, () => {
        const src = `if (_.isUndefined(someObj.someArray[nested])) { // do stuff }`;
        const result = helper(src, rule);
        assert.equal(result.errorCount, 1);
    });

    it(`should fail with the right message`, () => {
        const src = `if (_.isUndefined(obj)) { // do stuff }`;
        const failure = helper(src, rule).failures[0];

        assert.equal(failure.getFailure(), Rule.FAILURE_STRING);
    });
});
describe('noLodashIsundefined fixer', () => {
    it('should fix simple identifier', () => {
        const src = `if (_.isUndefined(obj)) { // do stuff }`;
        const expected = `if (obj === undefined) { // do stuff }`;
        const actual = getFixedResult(src, rule);
        const result = helper(src, rule);
        assert.equal(result.errorCount, 1);
        assert.equal(actual, expected);
    });
    it('should fix property access expression', () => {
        const src = `if (_.isUndefined(this.property)) { // do stuff }`;
        const expected = `if (this.property === undefined) { // do stuff }`;
        const actual = getFixedResult(src, rule);
        const result = helper(src, rule);
        assert.equal(result.errorCount, 1);
        assert.equal(actual, expected);
    });
    it('should fix element access expression', () => {
        const src = `if (_.isUndefined(someArray[nested])) { // do stuff }`;
        const expected = `if (someArray[nested] === undefined) { // do stuff }`;
        const actual = getFixedResult(src, rule);
        const result = helper(src, rule);
        assert.equal(result.errorCount, 1);
        assert.equal(actual, expected);
    });
    it('should fix property and element access expression', () => {
        const src = `if (_.isUndefined(someObj.someArray[nested])) { // do stuff }`;
        const expected = `if (someObj.someArray[nested] === undefined) { // do stuff }`;
        const actual = getFixedResult(src, rule);
        const result = helper(src, rule);
        assert.equal(result.errorCount, 1);
        assert.equal(actual, expected);
    });
    it('should fix negation', () => {
        const src = `if (!_.isUndefined(someObj)) { // do stuff }`;
        const expected = `if (someObj !== undefined) { // do stuff }`;
        const actual = getFixedResult(src, rule);
        const result = helper(src, rule);
        assert.equal(result.errorCount, 1);
        assert.equal(actual, expected);
    });
    it('should fix negation with property and element access expression', () => {
        const src = `if (!_.isUndefined(someObj.someArray[nested])) { // do stuff }`;
        const expected = `if (someObj.someArray[nested] !== undefined) { // do stuff }`;
        const actual = getFixedResult(src, rule);
        const result = helper(src, rule);
        assert.equal(result.errorCount, 1);
        assert.equal(actual, expected);
    });
});
