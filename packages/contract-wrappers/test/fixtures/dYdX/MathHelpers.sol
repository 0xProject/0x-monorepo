/* Retrieved from https://raw.githubusercontent.com/dydxprotocol/exchange-wrappers/master/contracts/lib/MathHelpers.sol
on August 29, 2019. */

/*

    Copyright 2018 dYdX Trading Inc.

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

pragma solidity 0.5.9;

import { SafeMath } from "./SafeMath.sol";


/**
 * @title MathHelpers
 * @author dYdX
 *
 * This library helps with common math functions in Solidity
 */
library MathHelpers {
    using SafeMath for uint256;

    /**
     * Calculates partial value given a numerator and denominator.
     *
     * @param  numerator    Numerator
     * @param  denominator  Denominator
     * @param  target       Value to calculate partial of
     * @return              target * numerator / denominator
     */
    function getPartialAmount(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        internal
        pure
        returns (uint256)
    {
        return numerator.mul(target).div(denominator);
    }

    /**
     * Calculates partial value given a numerator and denominator, rounded up.
     *
     * @param  numerator    Numerator
     * @param  denominator  Denominator
     * @param  target       Value to calculate partial of
     * @return              Rounded-up result of target * numerator / denominator
     */
    function getPartialAmountRoundedUp(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        internal
        pure
        returns (uint256)
    {
        return divisionRoundedUp(numerator.mul(target), denominator);
    }

    /**
     * Calculates division given a numerator and denominator, rounded up.
     *
     * @param  numerator    Numerator.
     * @param  denominator  Denominator.
     * @return              Rounded-up result of numerator / denominator
     */
    function divisionRoundedUp(
        uint256 numerator,
        uint256 denominator
    )
        internal
        pure
        returns (uint256)
    {
        assert(denominator != 0); // coverage-enable-line
        if (numerator == 0) {
            return 0;
        }
        return numerator.sub(1).div(denominator).add(1);
    }

    /**
     * Calculates and returns the maximum value for a uint256 in solidity
     *
     * @return  The maximum value for uint256
     */
    function maxUint256(
    )
        internal
        pure
        returns (uint256)
    {
        return 2 ** 256 - 1;
    }

    /**
     * Calculates and returns the maximum value for a uint256 in solidity
     *
     * @return  The maximum value for uint256
     */
    function maxUint32(
    )
        internal
        pure
        returns (uint32)
    {
        return 2 ** 32 - 1;
    }

    /**
     * Returns the number of bits in a uint256. That is, the lowest number, x, such that n >> x == 0
     *
     * @param  n  The uint256 to get the number of bits in
     * @return    The number of bits in n
     */
    function getNumBits(
        uint256 n
    )
        internal
        pure
        returns (uint256)
    {
        uint256 first = 0;
        uint256 last = 256;
        while (first < last) {
            uint256 check = (first + last) / 2;
            if ((n >> check) == 0) {
                last = check;
            } else {
                first = check + 1;
            }
        }
        assert(first <= 256);
        return first;
    }
}
