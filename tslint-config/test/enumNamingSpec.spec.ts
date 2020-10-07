import * as assert from 'assert';

import { Rule } from '../rules/enumNamingRule';

import { getFixedResult, helper } from './lintrunner';
const rule = 'enum-naming';

describe('enumNamingRule', () => {
    it(`should not fail PascalCase`, () => {
        const src = `enum test { MemberOne, MemberTwo }`;
        const result = helper(src, rule);
        assert.equal(result.errorCount, 0);
    });
    it(`should not fail PascalCase keys with uncased values`, () => {
        const src = `enum test { MemberOne = 'member_one', MemberTwo = 'member two' }`;
        const result = helper(src, rule);
        assert.equal(result.errorCount, 0);
    });
    it(`should not fail PascalCase keys with numbers`, () => {
        const src = `enum test { Member1 = 'member_one', MemberTwo = 'member two' }`;
        const result = helper(src, rule);
        assert.equal(result.errorCount, 0);
    });
    it(`should fail with camelCase`, () => {
        const src = `enum test { memberOne, memberTwo }`;
        const result = helper(src, rule);
        assert.equal(result.errorCount, 2);
    });
    it(`should fail with snake case`, () => {
        const src = `enum test { member_one, member_two }`;
        const result = helper(src, rule);
        assert.equal(result.errorCount, 2);
    });
    it(`should fail with all caps`, () => {
        const src = `enum test { MEMBERONE, MEMBER_TWO }`;
        const result = helper(src, rule);
        assert.equal(result.errorCount, 2);
    });
    it(`should fail with mixed case`, () => {
        const src = `enum test { member_one, MemberTwo }`;
        const result = helper(src, rule);
        assert.equal(result.errorCount, 1);
    });

    it(`should fail with the right position`, () => {
        const src = `enum test { MemberOne, member_two }`;
        const startPosition = src.indexOf('member_two');
        const endPosition = startPosition + 'member_two'.length;
        const failure = helper(src, rule).failures[0];

        assert.equal(failure.getStartPosition().getPosition(), startPosition);
        assert.equal(failure.getEndPosition().getPosition(), endPosition);
        assert.equal(failure.getFailure(), Rule.FAILURE_STRING);
    });

    it(`should fail with the right message`, () => {
        const src = `enum test { memberOne, memberTwo }`;
        const failure = helper(src, rule).failures[0];

        assert.equal(failure.getFailure(), Rule.FAILURE_STRING);
    });
});
describe('enumNaming fixer', () => {
    it('should fix keys', () => {
        const src = `enum test { MemberOne, memberTwo, member_three, MEMBER_FOUR, MEMBERFIVE }`;
        const expected = `enum test { MemberOne, MemberTwo, MemberThree, MemberFour, Memberfive }`;
        const actual = getFixedResult(src, rule);
        const result = helper(src, rule);
        assert.equal(result.errorCount, 4); // tslint:disable-line:custom-no-magic-numbers
        assert.equal(actual, expected);
    });
    it('should not fix values', () => {
        const src = `enum test { MemberOne = 'MemberOne', memberTwo = 'memberTwo', member_three = 'member_three', MEMBER_FOUR = 'MEMBER_FOUR' }`;
        const expected = `enum test { MemberOne = 'MemberOne', MemberTwo = 'memberTwo', MemberThree = 'member_three', MemberFour = 'MEMBER_FOUR' }`;
        const actual = getFixedResult(src, rule);
        const result = helper(src, rule);
        assert.equal(result.errorCount, 3); // tslint:disable-line:custom-no-magic-numbers
        assert.equal(actual, expected);
    });
    it('should preserve values with equals sign', () => {
        const src = `enum Operators { assign = '=', EQUALS = '==', Triple_Equals = '===' }`;
        const expected = `enum Operators { Assign = '=', Equals = '==', TripleEquals = '===' }`;
        const actual = getFixedResult(src, rule);
        const result = helper(src, rule);
        assert.equal(result.errorCount, 3); // tslint:disable-line:custom-no-magic-numbers
        assert.equal(actual, expected);
    });
});
