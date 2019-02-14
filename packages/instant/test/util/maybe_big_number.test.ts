import { BigNumber } from '@0x/utils';

import { maybeBigNumberUtil } from '../../src/util/maybe_big_number';

const BIG_NUMBER_1 = new BigNumber('10.1');
const BIG_NUMBER_2 = new BigNumber('10.1');
const BIG_NUMBER_3 = new BigNumber('11.1');

describe('maybeBigNumberUtil', () => {
    describe('stringToMaybeBigNumber', () => {
        it('should return undefined if stringValue is NaN', () => {
            expect(maybeBigNumberUtil.stringToMaybeBigNumber('NaN')).toEqual(undefined);
        });
        it('should return bignumber constructed with stringValue', () => {
            const bn = maybeBigNumberUtil.stringToMaybeBigNumber('10.1');
            if (!!bn) {
                expect(bn.toString()).toEqual('10.1');
            }
        });
        it('should return undefined if stringValue is not valid (i.e not numeric)', () => {
            expect(maybeBigNumberUtil.stringToMaybeBigNumber('test')).toEqual(undefined);
        });
    });

    describe('areMaybeBigNumbersEqual', () => {
        it('should return true if val1 and val2 are equivalent BigNumber values', () => {
            expect(maybeBigNumberUtil.areMaybeBigNumbersEqual(BIG_NUMBER_1, BIG_NUMBER_2)).toEqual(true);
        });
        it('should return true if val1 and val2 are both undefined', () => {
            expect(maybeBigNumberUtil.areMaybeBigNumbersEqual(undefined, undefined)).toEqual(true);
        });
        it('should return false if either one val1 or val2 is undefined', () => {
            expect(maybeBigNumberUtil.areMaybeBigNumbersEqual(BIG_NUMBER_1, undefined)).toEqual(false);
        });
        it('should return false if val1 and val2 are equivalent values BigNumber', () => {
            expect(maybeBigNumberUtil.areMaybeBigNumbersEqual(BIG_NUMBER_1, BIG_NUMBER_3)).toEqual(false);
        });
    });

    // this doesn't test coercing a pre v8.0.0 version of big number to desired version
    describe('toMaybeBigNumber', () => {
        it('should return BigNumber (>=v8.0.0) constructed with value if type is string', () => {
            const bn = maybeBigNumberUtil.toMaybeBigNumber('10.1');
            if (!!bn) {
                expect(bn.toString()).toEqual('10.1');
            }
        });
        it('should return undefined if value is NaN', () => {
            expect(maybeBigNumberUtil.toMaybeBigNumber('NaN')).toEqual(undefined);
        });
        it('should return undefined if value as string is not valid (i.e not numeric)', () => {
            expect(maybeBigNumberUtil.toMaybeBigNumber('test')).toEqual(undefined);
        });
        it('should return undefined if value as string is not valid (i.e not numeric)', () => {
            expect(maybeBigNumberUtil.toMaybeBigNumber('test')).toEqual(undefined);
        });
        it('should return BigNumber (>=v8.0.0) when passed a value as BigNumber (>=v8.0.0)', () => {
            const bn = maybeBigNumberUtil.toMaybeBigNumber(BIG_NUMBER_1);
            expect(BigNumber.isBigNumber(bn)).toEqual(true);
        });
        it('should return undefined if value is not BigNumber or string', () => {
            expect(maybeBigNumberUtil.toMaybeBigNumber(true)).toEqual(undefined);
        });
    });
});
