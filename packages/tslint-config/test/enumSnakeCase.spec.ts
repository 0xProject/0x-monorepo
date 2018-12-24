import * as assert from 'assert';

import { Rule } from '../rules/enumSnakeCaseRule';

import { getFixedResult, helper } from './lintrunner';
const rule = 'enum-snake-case';

describe('enumNamingRule', () => {
    it(`testing failure example`, () => {
        const src = `enum test { memberOne = 'memberOne', member_two = 'member-two', member3 = 3 }`;
        const result = helper(src, rule);
        assert.equal(result.errorCount, 3);
    });

    it(`testing not failure example`, () => {
        const src = `enum test { MEMBER_ONE, MEMBER_TWO }`;
        const result = helper(src, rule);
        assert.equal(result.errorCount, 0);
    });

    it(`testing position example`, () => {
        const src = `enum test { memberOne }`;
        const startPosition = src.indexOf('memberOne');
        const endPosition = startPosition + 'memberOne'.length;
        const failure = helper(src, rule).failures[0];

        assert.equal(failure.getStartPosition().getPosition(), startPosition);
        assert.equal(failure.getEndPosition().getPosition(), endPosition);
        assert.equal(failure.getFailure(), Rule.FAILURE_STRING);
    });

    it(`testing failure message example`, () => {
        const src = `enum test { memberOne, memberTwo }`;
        const failure = helper(src, rule).failures[0];

        assert.equal(failure.getFailure(), Rule.FAILURE_STRING);
    });

    it('testing fixer example', () => {
        const src = `enum test { MemberOne = 'memberOne', member_two = 'member-two', member3 = 3, memberFour }`;
        const expected = `enum test { MEMBER_ONE = 'memberOne', MEMBER_TWO = 'member-two', MEMBER3 = 3, MEMBER_FOUR }`;
        const actual = getFixedResult(src, rule);
        const result = helper(src, rule);
        assert.equal(result.errorCount, 4); // tslint:disable-line:custom-no-magic-numbers
        assert.equal(actual, expected);
    });
});
