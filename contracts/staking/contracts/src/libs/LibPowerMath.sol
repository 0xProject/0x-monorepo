/*

  Original work: Copyright 2017 Bprotocol Foundation.
  Modifications: Copyright 2019 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.5.5;


library LibPowerMath {
    uint256 private constant ONE = 1;
    uint8 private constant MIN_PRECISION = 32;
    uint8 private constant MAX_PRECISION = 127;

    uint256 private constant FIXED_1 = 0x080000000000000000000000000000000;
    uint256 private constant FIXED_2 = 0x100000000000000000000000000000000;
    uint256 private constant MAX_NUM = 0x200000000000000000000000000000000;

    uint256 private constant LN2_NUMERATOR   = 0x3f80fe03f80fe03f80fe03f80fe03f8;
    uint256 private constant LN2_DENOMINATOR = 0x5b9de1d10bf4103d647b0955897ba80;

    uint256 private constant OPT_LOG_MAX_VAL = 0x15bf0a8b1457695355fb8ac404e7a79e3;
    uint256 private constant OPT_EXP_MAX_VAL = 0x800000000000000000000000000000000;

    /**
        General Description:
            Determine a value of precision.
            Calculate an integer approximation of (_baseN / _baseD) ^ (_expN / _expD) * 2 ^ precision.
            Return the result along with the precision used.

        Detailed Description:
            Instead of calculating "base ^ exp", we calculate "e ^ (log(base) * exp)".
            The value of "log(base)" is represented with an integer slightly smaller than "log(base) * 2 ^ precision".
            The larger "precision" is, the more accurately this value represents the real value.
            However, the larger "precision" is, the more bits are required in order to store this value.
            And the exponentiation function, which takes "x" and calculates "e ^ x", is limited to a maximum exponent (maximum value of "x").
            This maximum exponent depends on the "precision" used, and it is given by "maxExpArray[precision] >> (MAX_PRECISION - precision)".
            Hence we need to determine the highest precision which can be used for the given input, before calling the exponentiation function.
            This allows us to compute "base ^ exp" with maximum accuracy and without exceeding 256 bits in any of the intermediate computations.
            This functions assumes that "_expN < 2 ^ 256 / log(MAX_NUM - 1)", otherwise the multiplication should be replaced with a "safeMul".
    */
    function power(uint256 _baseN, uint256 _baseD, uint32 _expN, uint32 _expD) internal pure returns (uint256, uint8) {
        require(_baseN < MAX_NUM);

        uint256 baseLog;
        uint256 base = _baseN * FIXED_1 / _baseD;
        if (base < OPT_LOG_MAX_VAL) {
            baseLog = _optimalLog(base);
        }
        else {
            baseLog = _generalLog(base);
        }

        uint256 baseLogTimesExp = baseLog * _expN / _expD;
        if (baseLogTimesExp < OPT_EXP_MAX_VAL) {
            return (_optimalExp(baseLogTimesExp), MAX_PRECISION);
        }
        else {
            uint8 precision = _findPositionInMaxExpArray(baseLogTimesExp);
            return (_generalExp(baseLogTimesExp >> (MAX_PRECISION - precision), precision), precision);
        }
    }

    /**
        Compute log(x / FIXED_1) * FIXED_1.
        This functions assumes that "x >= FIXED_1", because the output would be negative otherwise.
    */
    function _generalLog(uint256 x) private pure returns (uint256) {
        uint256 res = 0;

        // If x >= 2, then we compute the integer part of log2(x), which is larger than 0.
        if (x >= FIXED_2) {
            uint8 count = _floorLog2(x / FIXED_1);
            x >>= count; // now x < 2
            res = count * FIXED_1;
        }

        // If x > 1, then we compute the fraction part of log2(x), which is larger than 0.
        if (x > FIXED_1) {
            for (uint8 i = MAX_PRECISION; i > 0; --i) {
                x = (x * x) / FIXED_1; // now 1 < x < 4
                if (x >= FIXED_2) {
                    x >>= 1; // now 1 < x < 2
                    res += ONE << (i - 1);
                }
            }
        }

        return res * LN2_NUMERATOR / LN2_DENOMINATOR;
    }

    /**
        Compute the largest integer smaller than or equal to the binary logarithm of the input.
    */
    function _floorLog2(uint256 _n) private pure returns (uint8) {
        uint8 res = 0;

        if (_n < 256) {
            // At most 8 iterations
            while (_n > 1) {
                _n >>= 1;
                res += 1;
            }
        }
        else {
            // Exactly 8 iterations
            for (uint8 s = 128; s > 0; s >>= 1) {
                if (_n >= (ONE << s)) {
                    _n >>= s;
                    res |= s;
                }
            }
        }

        return res;
    }

    /**
        The global "maxExpArray" is sorted in descending order, and therefore the following statements are equivalent:
        - This function finds the position of [the smallest value in "maxExpArray" larger than or equal to "x"]
        - This function finds the highest position of [a value in "maxExpArray" larger than or equal to "x"]
    */
    function _findPositionInMaxExpArray(uint256 _x) private pure returns (uint8) {
        uint8 lo = MIN_PRECISION;
        uint8 hi = MAX_PRECISION;
        uint256[128] memory maxExpArray = _createTemporaryMaxExpArray();

        while (lo + 1 < hi) {
            uint8 mid = (lo + hi) / 2;
            if (maxExpArray[mid] >= _x)
                lo = mid;
            else
                hi = mid;
        }

        if (maxExpArray[hi] >= _x)
            return hi;
        if (maxExpArray[lo] >= _x)
            return lo;

        require(false);
        return 0;
    }

    /**
        This function can be auto-generated by the script 'PrintFunctionGeneralExp.py'.
        It approximates "e ^ x" via maclaurin summation: "(x^0)/0! + (x^1)/1! + ... + (x^n)/n!".
        It returns "e ^ (x / 2 ^ precision) * 2 ^ precision", that is, the result is upshifted for accuracy.
        The global "maxExpArray" maps each "precision" to "((maximumExponent + 1) << (MAX_PRECISION - precision)) - 1".
        The maximum permitted value for "x" is therefore given by "maxExpArray[precision] >> (MAX_PRECISION - precision)".
    */
    function _generalExp(uint256 _x, uint8 _precision) private pure returns (uint256) {
        uint256 xi = _x;
        uint256 res = 0;

        xi = (xi * _x) >> _precision; res += xi * 0x3442c4e6074a82f1797f72ac0000000; // add x^02 * (33! / 02!)
        xi = (xi * _x) >> _precision; res += xi * 0x116b96f757c380fb287fd0e40000000; // add x^03 * (33! / 03!)
        xi = (xi * _x) >> _precision; res += xi * 0x045ae5bdd5f0e03eca1ff4390000000; // add x^04 * (33! / 04!)
        xi = (xi * _x) >> _precision; res += xi * 0x00defabf91302cd95b9ffda50000000; // add x^05 * (33! / 05!)
        xi = (xi * _x) >> _precision; res += xi * 0x002529ca9832b22439efff9b8000000; // add x^06 * (33! / 06!)
        xi = (xi * _x) >> _precision; res += xi * 0x00054f1cf12bd04e516b6da88000000; // add x^07 * (33! / 07!)
        xi = (xi * _x) >> _precision; res += xi * 0x0000a9e39e257a09ca2d6db51000000; // add x^08 * (33! / 08!)
        xi = (xi * _x) >> _precision; res += xi * 0x000012e066e7b839fa050c309000000; // add x^09 * (33! / 09!)
        xi = (xi * _x) >> _precision; res += xi * 0x000001e33d7d926c329a1ad1a800000; // add x^10 * (33! / 10!)
        xi = (xi * _x) >> _precision; res += xi * 0x0000002bee513bdb4a6b19b5f800000; // add x^11 * (33! / 11!)
        xi = (xi * _x) >> _precision; res += xi * 0x00000003a9316fa79b88eccf2a00000; // add x^12 * (33! / 12!)
        xi = (xi * _x) >> _precision; res += xi * 0x0000000048177ebe1fa812375200000; // add x^13 * (33! / 13!)
        xi = (xi * _x) >> _precision; res += xi * 0x0000000005263fe90242dcbacf00000; // add x^14 * (33! / 14!)
        xi = (xi * _x) >> _precision; res += xi * 0x000000000057e22099c030d94100000; // add x^15 * (33! / 15!)
        xi = (xi * _x) >> _precision; res += xi * 0x0000000000057e22099c030d9410000; // add x^16 * (33! / 16!)
        xi = (xi * _x) >> _precision; res += xi * 0x00000000000052b6b54569976310000; // add x^17 * (33! / 17!)
        xi = (xi * _x) >> _precision; res += xi * 0x00000000000004985f67696bf748000; // add x^18 * (33! / 18!)
        xi = (xi * _x) >> _precision; res += xi * 0x000000000000003dea12ea99e498000; // add x^19 * (33! / 19!)
        xi = (xi * _x) >> _precision; res += xi * 0x00000000000000031880f2214b6e000; // add x^20 * (33! / 20!)
        xi = (xi * _x) >> _precision; res += xi * 0x000000000000000025bcff56eb36000; // add x^21 * (33! / 21!)
        xi = (xi * _x) >> _precision; res += xi * 0x000000000000000001b722e10ab1000; // add x^22 * (33! / 22!)
        xi = (xi * _x) >> _precision; res += xi * 0x0000000000000000001317c70077000; // add x^23 * (33! / 23!)
        xi = (xi * _x) >> _precision; res += xi * 0x00000000000000000000cba84aafa00; // add x^24 * (33! / 24!)
        xi = (xi * _x) >> _precision; res += xi * 0x00000000000000000000082573a0a00; // add x^25 * (33! / 25!)
        xi = (xi * _x) >> _precision; res += xi * 0x00000000000000000000005035ad900; // add x^26 * (33! / 26!)
        xi = (xi * _x) >> _precision; res += xi * 0x000000000000000000000002f881b00; // add x^27 * (33! / 27!)
        xi = (xi * _x) >> _precision; res += xi * 0x0000000000000000000000001b29340; // add x^28 * (33! / 28!)
        xi = (xi * _x) >> _precision; res += xi * 0x00000000000000000000000000efc40; // add x^29 * (33! / 29!)
        xi = (xi * _x) >> _precision; res += xi * 0x0000000000000000000000000007fe0; // add x^30 * (33! / 30!)
        xi = (xi * _x) >> _precision; res += xi * 0x0000000000000000000000000000420; // add x^31 * (33! / 31!)
        xi = (xi * _x) >> _precision; res += xi * 0x0000000000000000000000000000021; // add x^32 * (33! / 32!)
        xi = (xi * _x) >> _precision; res += xi * 0x0000000000000000000000000000001; // add x^33 * (33! / 33!)

        return res / 0x688589cc0e9505e2f2fee5580000000 + _x + (ONE << _precision); // divide by 33! and then add x^1 / 1! + x^0 / 0!
    }

    /**
        Return log(x / FIXED_1) * FIXED_1
        Input range: FIXED_1 <= x <= LOG_EXP_MAX_VAL - 1
        Auto-generated via 'PrintFunctionOptimalLog.py'
        Detailed description:
        - Rewrite the input as a product of natural exponents and a single residual r, such that 1 < r < 2
        - The natural logarithm of each (pre-calculated) exponent is the degree of the exponent
        - The natural logarithm of r is calculated via Taylor series for log(1 + x), where x = r - 1
        - The natural logarithm of the input is calculated by summing up the intermediate results above
        - For example: log(250) = log(e^4 * e^1 * e^0.5 * 1.021692859) = 4 + 1 + 0.5 + log(1 + 0.021692859)
    */
    function _optimalLog(uint256 x) private pure returns (uint256) {
        uint256 res = 0;

        uint256 y;
        uint256 z;
        uint256 w;

        if (x >= 0xd3094c70f034de4b96ff7d5b6f99fcd8) {res += 0x40000000000000000000000000000000; x = x * FIXED_1 / 0xd3094c70f034de4b96ff7d5b6f99fcd8;} // add 1 / 2^1
        if (x >= 0xa45af1e1f40c333b3de1db4dd55f29a7) {res += 0x20000000000000000000000000000000; x = x * FIXED_1 / 0xa45af1e1f40c333b3de1db4dd55f29a7;} // add 1 / 2^2
        if (x >= 0x910b022db7ae67ce76b441c27035c6a1) {res += 0x10000000000000000000000000000000; x = x * FIXED_1 / 0x910b022db7ae67ce76b441c27035c6a1;} // add 1 / 2^3
        if (x >= 0x88415abbe9a76bead8d00cf112e4d4a8) {res += 0x08000000000000000000000000000000; x = x * FIXED_1 / 0x88415abbe9a76bead8d00cf112e4d4a8;} // add 1 / 2^4
        if (x >= 0x84102b00893f64c705e841d5d4064bd3) {res += 0x04000000000000000000000000000000; x = x * FIXED_1 / 0x84102b00893f64c705e841d5d4064bd3;} // add 1 / 2^5
        if (x >= 0x8204055aaef1c8bd5c3259f4822735a2) {res += 0x02000000000000000000000000000000; x = x * FIXED_1 / 0x8204055aaef1c8bd5c3259f4822735a2;} // add 1 / 2^6
        if (x >= 0x810100ab00222d861931c15e39b44e99) {res += 0x01000000000000000000000000000000; x = x * FIXED_1 / 0x810100ab00222d861931c15e39b44e99;} // add 1 / 2^7
        if (x >= 0x808040155aabbbe9451521693554f733) {res += 0x00800000000000000000000000000000; x = x * FIXED_1 / 0x808040155aabbbe9451521693554f733;} // add 1 / 2^8

        z = y = x - FIXED_1;
        w = y * y / FIXED_1;
        res += z * (0x100000000000000000000000000000000 - y) / 0x100000000000000000000000000000000; z = z * w / FIXED_1; // add y^01 / 01 - y^02 / 02
        res += z * (0x0aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa - y) / 0x200000000000000000000000000000000; z = z * w / FIXED_1; // add y^03 / 03 - y^04 / 04
        res += z * (0x099999999999999999999999999999999 - y) / 0x300000000000000000000000000000000; z = z * w / FIXED_1; // add y^05 / 05 - y^06 / 06
        res += z * (0x092492492492492492492492492492492 - y) / 0x400000000000000000000000000000000; z = z * w / FIXED_1; // add y^07 / 07 - y^08 / 08
        res += z * (0x08e38e38e38e38e38e38e38e38e38e38e - y) / 0x500000000000000000000000000000000; z = z * w / FIXED_1; // add y^09 / 09 - y^10 / 10
        res += z * (0x08ba2e8ba2e8ba2e8ba2e8ba2e8ba2e8b - y) / 0x600000000000000000000000000000000; z = z * w / FIXED_1; // add y^11 / 11 - y^12 / 12
        res += z * (0x089d89d89d89d89d89d89d89d89d89d89 - y) / 0x700000000000000000000000000000000; z = z * w / FIXED_1; // add y^13 / 13 - y^14 / 14
        res += z * (0x088888888888888888888888888888888 - y) / 0x800000000000000000000000000000000;                      // add y^15 / 15 - y^16 / 16

        return res;
    }

    /**
        Return e ^ (x / FIXED_1) * FIXED_1
        Input range: 0 <= x <= OPT_EXP_MAX_VAL - 1
        Auto-generated via 'PrintFunctionOptimalExp.py'
        Detailed description:
        - Rewrite the input as a sum of binary exponents and a single residual r, as small as possible
        - The exponentiation of each binary exponent is given (pre-calculated)
        - The exponentiation of r is calculated via Taylor series for e^x, where x = r
        - The exponentiation of the input is calculated by multiplying the intermediate results above
        - For example: e^5.521692859 = e^(4 + 1 + 0.5 + 0.021692859) = e^4 * e^1 * e^0.5 * e^0.021692859
    */
    function _optimalExp(uint256 x) private pure returns (uint256) {
        uint256 res = 0;

        uint256 y;
        uint256 z;

        z = y = x % 0x10000000000000000000000000000000; // get the input modulo 2^(-3)
        z = z * y / FIXED_1; res += z * 0x10e1b3be415a0000; // add y^02 * (20! / 02!)
        z = z * y / FIXED_1; res += z * 0x05a0913f6b1e0000; // add y^03 * (20! / 03!)
        z = z * y / FIXED_1; res += z * 0x0168244fdac78000; // add y^04 * (20! / 04!)
        z = z * y / FIXED_1; res += z * 0x004807432bc18000; // add y^05 * (20! / 05!)
        z = z * y / FIXED_1; res += z * 0x000c0135dca04000; // add y^06 * (20! / 06!)
        z = z * y / FIXED_1; res += z * 0x0001b707b1cdc000; // add y^07 * (20! / 07!)
        z = z * y / FIXED_1; res += z * 0x000036e0f639b800; // add y^08 * (20! / 08!)
        z = z * y / FIXED_1; res += z * 0x00000618fee9f800; // add y^09 * (20! / 09!)
        z = z * y / FIXED_1; res += z * 0x0000009c197dcc00; // add y^10 * (20! / 10!)
        z = z * y / FIXED_1; res += z * 0x0000000e30dce400; // add y^11 * (20! / 11!)
        z = z * y / FIXED_1; res += z * 0x000000012ebd1300; // add y^12 * (20! / 12!)
        z = z * y / FIXED_1; res += z * 0x0000000017499f00; // add y^13 * (20! / 13!)
        z = z * y / FIXED_1; res += z * 0x0000000001a9d480; // add y^14 * (20! / 14!)
        z = z * y / FIXED_1; res += z * 0x00000000001c6380; // add y^15 * (20! / 15!)
        z = z * y / FIXED_1; res += z * 0x000000000001c638; // add y^16 * (20! / 16!)
        z = z * y / FIXED_1; res += z * 0x0000000000001ab8; // add y^17 * (20! / 17!)
        z = z * y / FIXED_1; res += z * 0x000000000000017c; // add y^18 * (20! / 18!)
        z = z * y / FIXED_1; res += z * 0x0000000000000014; // add y^19 * (20! / 19!)
        z = z * y / FIXED_1; res += z * 0x0000000000000001; // add y^20 * (20! / 20!)
        res = res / 0x21c3677c82b40000 + y + FIXED_1; // divide by 20! and then add y^1 / 1! + y^0 / 0!

        if ((x & 0x010000000000000000000000000000000) != 0) res = res * 0x1c3d6a24ed82218787d624d3e5eba95f9 / 0x18ebef9eac820ae8682b9793ac6d1e776; // multiply by e^2^(-3)
        if ((x & 0x020000000000000000000000000000000) != 0) res = res * 0x18ebef9eac820ae8682b9793ac6d1e778 / 0x1368b2fc6f9609fe7aceb46aa619baed4; // multiply by e^2^(-2)
        if ((x & 0x040000000000000000000000000000000) != 0) res = res * 0x1368b2fc6f9609fe7aceb46aa619baed5 / 0x0bc5ab1b16779be3575bd8f0520a9f21f; // multiply by e^2^(-1)
        if ((x & 0x080000000000000000000000000000000) != 0) res = res * 0x0bc5ab1b16779be3575bd8f0520a9f21e / 0x0454aaa8efe072e7f6ddbab84b40a55c9; // multiply by e^2^(+0)
        if ((x & 0x100000000000000000000000000000000) != 0) res = res * 0x0454aaa8efe072e7f6ddbab84b40a55c5 / 0x00960aadc109e7a3bf4578099615711ea; // multiply by e^2^(+1)
        if ((x & 0x200000000000000000000000000000000) != 0) res = res * 0x00960aadc109e7a3bf4578099615711d7 / 0x0002bf84208204f5977f9a8cf01fdce3d; // multiply by e^2^(+2)
        if ((x & 0x400000000000000000000000000000000) != 0) res = res * 0x0002bf84208204f5977f9a8cf01fdc307 / 0x0000003c6ab775dd0b95b4cbee7e65d11; // multiply by e^2^(+3)

        return res;
    }

    /** Create a temporary `maxExpArray` without advancing the free memory pointer.
    */
    function _createTemporaryMaxExpArray() private pure returns (uint256[128] memory maxExpArray) {
        assembly {
            // Allocate memory for this array.
            maxExpArray := mload(0x40)
            // Populate the array.
            mstore(add(maxExpArray, 0), 0 ) // 0x6bffffffffffffffffffffffffffffffff
            mstore(add(maxExpArray, 32), 0 ) // 0x67ffffffffffffffffffffffffffffffff
            mstore(add(maxExpArray, 64), 0 ) // 0x637fffffffffffffffffffffffffffffff
            mstore(add(maxExpArray, 96), 0 ) // 0x5f6fffffffffffffffffffffffffffffff
            mstore(add(maxExpArray, 128), 0 ) // 0x5b77ffffffffffffffffffffffffffffff
            mstore(add(maxExpArray, 160), 0 ) // 0x57b3ffffffffffffffffffffffffffffff
            mstore(add(maxExpArray, 192), 0 ) // 0x5419ffffffffffffffffffffffffffffff
            mstore(add(maxExpArray, 224), 0 ) // 0x50a2ffffffffffffffffffffffffffffff
            mstore(add(maxExpArray, 256), 0 ) // 0x4d517fffffffffffffffffffffffffffff
            mstore(add(maxExpArray, 288), 0 ) // 0x4a233fffffffffffffffffffffffffffff
            mstore(add(maxExpArray, 320), 0 ) // 0x47165fffffffffffffffffffffffffffff
            mstore(add(maxExpArray, 352), 0 ) // 0x4429afffffffffffffffffffffffffffff
            mstore(add(maxExpArray, 384), 0 ) // 0x415bc7ffffffffffffffffffffffffffff
            mstore(add(maxExpArray, 416), 0 ) // 0x3eab73ffffffffffffffffffffffffffff
            mstore(add(maxExpArray, 448), 0 ) // 0x3c1771ffffffffffffffffffffffffffff
            mstore(add(maxExpArray, 480), 0 ) // 0x399e96ffffffffffffffffffffffffffff
            mstore(add(maxExpArray, 512), 0 ) // 0x373fc47fffffffffffffffffffffffffff
            mstore(add(maxExpArray, 544), 0 ) // 0x34f9e8ffffffffffffffffffffffffffff
            mstore(add(maxExpArray, 576), 0 ) // 0x32cbfd5fffffffffffffffffffffffffff
            mstore(add(maxExpArray, 608), 0 ) // 0x30b5057fffffffffffffffffffffffffff
            mstore(add(maxExpArray, 640), 0 ) // 0x2eb40f9fffffffffffffffffffffffffff
            mstore(add(maxExpArray, 672), 0 ) // 0x2cc8340fffffffffffffffffffffffffff
            mstore(add(maxExpArray, 704), 0 ) // 0x2af09481ffffffffffffffffffffffffff
            mstore(add(maxExpArray, 736), 0 ) // 0x292c5bddffffffffffffffffffffffffff
            mstore(add(maxExpArray, 768), 0 ) // 0x277abdcdffffffffffffffffffffffffff
            mstore(add(maxExpArray, 800), 0 ) // 0x25daf6657fffffffffffffffffffffffff
            mstore(add(maxExpArray, 832), 0 ) // 0x244c49c65fffffffffffffffffffffffff
            mstore(add(maxExpArray, 864), 0 ) // 0x22ce03cd5fffffffffffffffffffffffff
            mstore(add(maxExpArray, 896), 0 ) // 0x215f77c047ffffffffffffffffffffffff
            mstore(add(maxExpArray, 928), 0 ) // 0x1fffffffffffffffffffffffffffffffff
            mstore(add(maxExpArray, 960), 0 ) // 0x1eaefdbdabffffffffffffffffffffffff
            mstore(add(maxExpArray, 992), 0 ) // 0x1d6bd8b2ebffffffffffffffffffffffff
            mstore(add(maxExpArray, 1024), 0x1c35fedd14ffffffffffffffffffffffff)
            mstore(add(maxExpArray, 1056), 0x1b0ce43b323fffffffffffffffffffffff)
            mstore(add(maxExpArray, 1088), 0x19f0028ec1ffffffffffffffffffffffff)
            mstore(add(maxExpArray, 1120), 0x18ded91f0e7fffffffffffffffffffffff)
            mstore(add(maxExpArray, 1152), 0x17d8ec7f0417ffffffffffffffffffffff)
            mstore(add(maxExpArray, 1184), 0x16ddc6556cdbffffffffffffffffffffff)
            mstore(add(maxExpArray, 1216), 0x15ecf52776a1ffffffffffffffffffffff)
            mstore(add(maxExpArray, 1248), 0x15060c256cb2ffffffffffffffffffffff)
            mstore(add(maxExpArray, 1280), 0x1428a2f98d72ffffffffffffffffffffff)
            mstore(add(maxExpArray, 1312), 0x13545598e5c23fffffffffffffffffffff)
            mstore(add(maxExpArray, 1344), 0x1288c4161ce1dfffffffffffffffffffff)
            mstore(add(maxExpArray, 1376), 0x11c592761c666fffffffffffffffffffff)
            mstore(add(maxExpArray, 1408), 0x110a688680a757ffffffffffffffffffff)
            mstore(add(maxExpArray, 1440), 0x1056f1b5bedf77ffffffffffffffffffff)
            mstore(add(maxExpArray, 1472), 0x0faadceceeff8bffffffffffffffffffff)
            mstore(add(maxExpArray, 1504), 0x0f05dc6b27edadffffffffffffffffffff)
            mstore(add(maxExpArray, 1536), 0x0e67a5a25da4107fffffffffffffffffff)
            mstore(add(maxExpArray, 1568), 0x0dcff115b14eedffffffffffffffffffff)
            mstore(add(maxExpArray, 1600), 0x0d3e7a392431239fffffffffffffffffff)
            mstore(add(maxExpArray, 1632), 0x0cb2ff529eb71e4fffffffffffffffffff)
            mstore(add(maxExpArray, 1664), 0x0c2d415c3db974afffffffffffffffffff)
            mstore(add(maxExpArray, 1696), 0x0bad03e7d883f69bffffffffffffffffff)
            mstore(add(maxExpArray, 1728), 0x0b320d03b2c343d5ffffffffffffffffff)
            mstore(add(maxExpArray, 1760), 0x0abc25204e02828dffffffffffffffffff)
            mstore(add(maxExpArray, 1792), 0x0a4b16f74ee4bb207fffffffffffffffff)
            mstore(add(maxExpArray, 1824), 0x09deaf736ac1f569ffffffffffffffffff)
            mstore(add(maxExpArray, 1856), 0x0976bd9952c7aa957fffffffffffffffff)
            mstore(add(maxExpArray, 1888), 0x09131271922eaa606fffffffffffffffff)
            mstore(add(maxExpArray, 1920), 0x08b380f3558668c46fffffffffffffffff)
            mstore(add(maxExpArray, 1952), 0x0857ddf0117efa215bffffffffffffffff)
            mstore(add(maxExpArray, 1984), 0x07ffffffffffffffffffffffffffffffff)
            mstore(add(maxExpArray, 2016), 0x07abbf6f6abb9d087fffffffffffffffff)
            mstore(add(maxExpArray, 2048), 0x075af62cbac95f7dfa7fffffffffffffff)
            mstore(add(maxExpArray, 2080), 0x070d7fb7452e187ac13fffffffffffffff)
            mstore(add(maxExpArray, 2112), 0x06c3390ecc8af379295fffffffffffffff)
            mstore(add(maxExpArray, 2144), 0x067c00a3b07ffc01fd6fffffffffffffff)
            mstore(add(maxExpArray, 2176), 0x0637b647c39cbb9d3d27ffffffffffffff)
            mstore(add(maxExpArray, 2208), 0x05f63b1fc104dbd39587ffffffffffffff)
            mstore(add(maxExpArray, 2240), 0x05b771955b36e12f7235ffffffffffffff)
            mstore(add(maxExpArray, 2272), 0x057b3d49dda84556d6f6ffffffffffffff)
            mstore(add(maxExpArray, 2304), 0x054183095b2c8ececf30ffffffffffffff)
            mstore(add(maxExpArray, 2336), 0x050a28be635ca2b888f77fffffffffffff)
            mstore(add(maxExpArray, 2368), 0x04d5156639708c9db33c3fffffffffffff)
            mstore(add(maxExpArray, 2400), 0x04a23105873875bd52dfdfffffffffffff)
            mstore(add(maxExpArray, 2432), 0x0471649d87199aa990756fffffffffffff)
            mstore(add(maxExpArray, 2464), 0x04429a21a029d4c1457cfbffffffffffff)
            mstore(add(maxExpArray, 2496), 0x0415bc6d6fb7dd71af2cb3ffffffffffff)
            mstore(add(maxExpArray, 2528), 0x03eab73b3bbfe282243ce1ffffffffffff)
            mstore(add(maxExpArray, 2560), 0x03c1771ac9fb6b4c18e229ffffffffffff)
            mstore(add(maxExpArray, 2592), 0x0399e96897690418f785257fffffffffff)
            mstore(add(maxExpArray, 2624), 0x0373fc456c53bb779bf0ea9fffffffffff)
            mstore(add(maxExpArray, 2656), 0x034f9e8e490c48e67e6ab8bfffffffffff)
            mstore(add(maxExpArray, 2688), 0x032cbfd4a7adc790560b3337ffffffffff)
            mstore(add(maxExpArray, 2720), 0x030b50570f6e5d2acca94613ffffffffff)
            mstore(add(maxExpArray, 2752), 0x02eb40f9f620fda6b56c2861ffffffffff)
            mstore(add(maxExpArray, 2784), 0x02cc8340ecb0d0f520a6af58ffffffffff)
            mstore(add(maxExpArray, 2816), 0x02af09481380a0a35cf1ba02ffffffffff)
            mstore(add(maxExpArray, 2848), 0x0292c5bdd3b92ec810287b1b3fffffffff)
            mstore(add(maxExpArray, 2880), 0x0277abdcdab07d5a77ac6d6b9fffffffff)
            mstore(add(maxExpArray, 2912), 0x025daf6654b1eaa55fd64df5efffffffff)
            mstore(add(maxExpArray, 2944), 0x0244c49c648baa98192dce88b7ffffffff)
            mstore(add(maxExpArray, 2976), 0x022ce03cd5619a311b2471268bffffffff)
            mstore(add(maxExpArray, 3008), 0x0215f77c045fbe885654a44a0fffffffff)
            mstore(add(maxExpArray, 3040), 0x01ffffffffffffffffffffffffffffffff)
            mstore(add(maxExpArray, 3072), 0x01eaefdbdaaee7421fc4d3ede5ffffffff)
            mstore(add(maxExpArray, 3104), 0x01d6bd8b2eb257df7e8ca57b09bfffffff)
            mstore(add(maxExpArray, 3136), 0x01c35fedd14b861eb0443f7f133fffffff)
            mstore(add(maxExpArray, 3168), 0x01b0ce43b322bcde4a56e8ada5afffffff)
            mstore(add(maxExpArray, 3200), 0x019f0028ec1fff007f5a195a39dfffffff)
            mstore(add(maxExpArray, 3232), 0x018ded91f0e72ee74f49b15ba527ffffff)
            mstore(add(maxExpArray, 3264), 0x017d8ec7f04136f4e5615fd41a63ffffff)
            mstore(add(maxExpArray, 3296), 0x016ddc6556cdb84bdc8d12d22e6fffffff)
            mstore(add(maxExpArray, 3328), 0x015ecf52776a1155b5bd8395814f7fffff)
            mstore(add(maxExpArray, 3360), 0x015060c256cb23b3b3cc3754cf40ffffff)
            mstore(add(maxExpArray, 3392), 0x01428a2f98d728ae223ddab715be3fffff)
            mstore(add(maxExpArray, 3424), 0x013545598e5c23276ccf0ede68034fffff)
            mstore(add(maxExpArray, 3456), 0x01288c4161ce1d6f54b7f61081194fffff)
            mstore(add(maxExpArray, 3488), 0x011c592761c666aa641d5a01a40f17ffff)
            mstore(add(maxExpArray, 3520), 0x0110a688680a7530515f3e6e6cfdcdffff)
            mstore(add(maxExpArray, 3552), 0x01056f1b5bedf75c6bcb2ce8aed428ffff)
            mstore(add(maxExpArray, 3584), 0x00faadceceeff8a0890f3875f008277fff)
            mstore(add(maxExpArray, 3616), 0x00f05dc6b27edad306388a600f6ba0bfff)
            mstore(add(maxExpArray, 3648), 0x00e67a5a25da41063de1495d5b18cdbfff)
            mstore(add(maxExpArray, 3680), 0x00dcff115b14eedde6fc3aa5353f2e4fff)
            mstore(add(maxExpArray, 3712), 0x00d3e7a3924312399f9aae2e0f868f8fff)
            mstore(add(maxExpArray, 3744), 0x00cb2ff529eb71e41582cccd5a1ee26fff)
            mstore(add(maxExpArray, 3776), 0x00c2d415c3db974ab32a51840c0b67edff)
            mstore(add(maxExpArray, 3808), 0x00bad03e7d883f69ad5b0a186184e06bff)
            mstore(add(maxExpArray, 3840), 0x00b320d03b2c343d4829abd6075f0cc5ff)
            mstore(add(maxExpArray, 3872), 0x00abc25204e02828d73c6e80bcdb1a95bf)
            mstore(add(maxExpArray, 3904), 0x00a4b16f74ee4bb2040a1ec6c15fbbf2df)
            mstore(add(maxExpArray, 3936), 0x009deaf736ac1f569deb1b5ae3f36c130f)
            mstore(add(maxExpArray, 3968), 0x00976bd9952c7aa957f5937d790ef65037)
            mstore(add(maxExpArray, 4000), 0x009131271922eaa6064b73a22d0bd4f2bf)
            mstore(add(maxExpArray, 4032), 0x008b380f3558668c46c91c49a2f8e967b9)
            mstore(add(maxExpArray, 4064), 0x00857ddf0117efa215952912839f6473e6)
        }
    }
}
