import * as assert from 'assert';

import { Rule } from '../rules/enumSnakeCaseRule';

import { getFixedResult, helper } from './lintRunner';
const rule = 'enum-snake-case';

describe('enumNamingRule', () => {
    it(`testing failure example`, () => {
        const src = `enum test { memberOne, memberTwo }`;
        const result = helper(src, rule);
        assert.equal(result.errorCount, 2);
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
        const src = `enum test { memberOne, memberTwo }`;
        const expected = `enum test { MEMBER_ONE, MEMBER_TWO }`;
        const actual = getFixedResult(src, rule);
        const result = helper(src, rule);
        assert.equal(result.errorCount, 2);
        assert.equal(actual, expected);
    });
});
