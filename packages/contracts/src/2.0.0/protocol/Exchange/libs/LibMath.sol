/*

  Copyright 2018 ZeroEx Intl.

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

pragma solidity ^0.4.24;

import "../../../utils/SafeMath/SafeMath.sol";

contract LibMath is
    SafeMath
{
    // Errors
    string constant NUMERATOR_GT_DENOMINATOR = "NUMERATOR_GT_DENOMINATOR";

    /// @dev Calculates partial value given a numerator and denominator.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to calculate partial of.
    /// @return Floor( (target * numerator) / denominator )
    function getPartialAmount(
        uint256 numerator,
        uint256 denominator,
        uint256 target)
        internal
        pure
        returns (uint256 partialAmount)
    {
        // Preconditions
        // The fraction needs to be <= 1. This guarantees that the resulting
        // partialAmount <= target and always fits in a 256 bit response.
        // We do not check for denominator > 0. When denominator is zero we
        // require numerator == 0 and return partialAmount == 0.
        require(numerator <= denominator, NUMERATOR_GT_DENOMINATOR);
        
        // 512-bit multiply [prod1 prod0] = target * numerator
        // Compute the product mod 2**256 and mod 2**256 - 1
        // then use the Chinese Remiander Theorem to reconstruct
        // the 512 bit result. The result is stored in two 256
        // variables such that product = prod1 * 2**256 + prod0
        uint256 prod0; // Least significant 256 bits of the product
        uint256 prod1; // Most siginificant 256 bits of the product
        assembly {
            let mm := mulmod(target, numerator, not(0))
            prod0 := mul(target, numerator)
            prod1 := sub(sub(mm, prod0), lt(mm, prod0))
        }
        
        // Handle non-overflow cases, 256 by 256 division
        if (prod1 == 0) {
            assembly {
                // If denominator is zero then by the precodition
                // numerator is also zero and therefore prod is
                // zero. We get div(_, 0), which evaluates to 0.
                partialAmount := div(prod0, denominator)
            }
            return partialAmount;
        }
        
        ///////////////////////////////////////////////
        // 512 by 256 division.
        ///////////////////////////////////////////////
        
        // Make division exact by subtracting the remainder from [prod1 prod0]
        // Compute remainder using mulmod
        // mulmod(_, _, 0) == 0
        uint256 remainder;
        assembly {
            remainder := mulmod(target, numerator, denominator)
        }
        // Subtract 256 bit number from 512 bit number
        assembly {
            prod1 := sub(prod1, gt(remainder, prod0))
            prod0 := sub(prod0, remainder)
        }
        
        // Factor powers of two out of denominator
        // Compute largest power of two divisor of denominator.
        // Always >= 1 unless denominator is zero, then twos is zero.
        uint256 twos = -denominator & denominator;
        // Divide denominator by power of two
        assembly {
            denominator := div(denominator, twos)
        }
        
        // Divide [prod1 prod0] by the factors of two
        assembly {
            prod0 := div(prod0, twos)
        }
        // Shift in bits from prod1 into prod0. For this we need
        // to flip `twos` such that it is 2**256 / twos.
        // If twos is zero, then it becomes one
        assembly {
            twos := add(div(sub(0, twos), twos), 1)
        }
        prod0 |= prod1 * twos;
        
        // Invert denominator mod 2**256
        // Now that denominator is an odd number, it has an inverse
        // modulo 2**256 such that denominator * inv = 1 mod 2**256.
        // Compute the inverse by starting with a seed that is correct
        // correct for four bits. That is, denominator * inv = 1 mod 2**4
        // If denominator is zero the inverse starts with 2
        uint256 inv = 3 * denominator ^ 2;
        // Now use Newton-Raphson itteration to improve the precision.
        // Thanks to Hensel's lifting lemma, this also works in modular
        // arithmetic, doubling the correct bits in each step.
        inv *= 2 - denominator * inv; // inverse mod 2**8
        inv *= 2 - denominator * inv; // inverse mod 2**16
        inv *= 2 - denominator * inv; // inverse mod 2**32
        inv *= 2 - denominator * inv; // inverse mod 2**64
        inv *= 2 - denominator * inv; // inverse mod 2**128
        inv *= 2 - denominator * inv; // inverse mod 2**256
        // If denominator is zero, inv is now 128
        
        // Because the division is now exact we can divide by multiplying
        // with the modular inverse of denominator. This will give us the
        // correct result modulo 2**256. Since the precoditions guarantee
        // that the outcome is less than 2**256, this is the final result.
        // We don't need to compute the high bits of the result and prod1
        // is no longer required.
        // If denominator is zero, prod0 is zero and the result is zero.
        partialAmount = prod0 * inv;
        return partialAmount;
    }
    
    /// @dev Checks if rounding error > 0.1%.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to multiply with numerator/denominator.
    /// @return Rounding error is present.
    function isRoundingError(
        uint256 numerator,
        uint256 denominator,
        uint256 target)
        internal
        pure
        returns (bool isError)
    {
        // The relative error is defined as the difference between
        // the actual value and ideal value divided by the ideal value.
        // If the error must be less than or equal to 0.1% of the ideal
        // value.
        //
        //   ideal value - actual value
        //   --------------------------   <  0.001
        //          ideal value
        //
        // where 
        //
        //                  target * numerator        product 
        // ideal value  =   ------------------  =  -------------
        //                     denominator          denominator
        //
        //
        // actual value  =  |_  ideal value _|    (i.e. floor)
        //
        // The actual value can also be written as:
        //
        //                      product - (product mod denominator)
        //                =   --------------------------------------
        //                                 denominator
        //
        //  Subsituting all of this back in the first equation:
        //
        //       product           product - (product mod denominator)
        //   ---------------  -  --------------------------------------
        //     denominator                    denominator
        // --------------------------------------------------------------
        //                            product
        //                        --------------
        //                          denominator
        //
        //  And this cancels out to:
        //
        //            product mod denominator
        //           -------------------------   <   0.001
        //                   product
        //
        // Multiply both sides by 1000 * product:
        //
        //      1000 * (product mod denominator)  <  product
        //
        // This is the equation we use to check for rounding errors.
        //
        // The product is a 512 bit number and while the remainder
        // (product mod denominator) is 256 bit, it can overflow when
        // multiplied by 1000. We compute both products as 512 bit numbers.
        // and then compare them.
        
        // Compute remainder = target * numerator mod denominator
        uint256 remainder;
        assembly {
            remainder := mulmod(target, numerator, denominator)
        }
        
        // Compute prod = target * numerator in 512 bits
        // See getPartialAmount for documentation
        uint256 prod0; // Least significant 256 bits of the product
        uint256 prod1; // Most siginificant 256 bits of the product
        assembly {
            let mm := mulmod(target, numerator, not(0))
            prod0 := mul(target, numerator)
            prod1 := sub(sub(mm, prod0), lt(mm, prod0))
        }
        
        // Compute rem = remainder * 1000 in 512 bits
        // See getPartialAmount for documentation
        uint256 rem0; // Least significant 256 bits of the rem
        uint256 rem1; // Most siginificant 256 bits of the rem
        assembly {
            let mm := mulmod(remainder, 1000, not(0))
            rem0 := mul(remainder, 1000)
            rem1 := sub(sub(mm, rem0), lt(mm, rem0))
        }
        
        // Compare rem > prod in 512 bits
        if (rem1 == prod1) {
            isError = rem0 > prod0;
        } else {
            isError = rem1 > prod1;
        }
        return isError;
    }
}
