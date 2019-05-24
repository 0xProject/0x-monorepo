

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

pragma solidity ^0.5.5;



library LibMath {
    
    function _nthRoot(uint256 base, uint256 n) internal pure returns (uint256 root) {
        assembly {
            ///// Implements Newton's Approximation, derived from Newton's nth Root Algorithm /////
            // See https://en.wikipedia.org/wiki/Nth_root#nth_root_algorithm
            // 1. Find greatest power-of-2 <= `value`
            let m := 0
            for {let v := base}
                gt(v, 0)
                {v := shr(1, v)}
            {
                m := add(m, 1)
            }
            m := sub(m, 1)

            // 2. Find greatest power-of-2 that, when raised to the power of `n`,
            //    is <= `value`
            let x := exp(2, div(m, n))

            // 3. Find y such that `x` + `y` = `value`
            let y := xor(base, exp(2, mul(div(m, n), n)))

            // 4. Run Newton's Approximation to approximate the root
            root := add(x, div(y, mul(n, exp(2, mul(div(m, n), sub(n, 1))))))

            /**
             * Note 1:
             * On some clients (like ganache), execution freezes when running exponentiation
             * with a dynamically generated base. Because of this, all exponentiation above
             * is done base-2.
             * Example:
             * Call the solidity function below with `n >= 1` and execution will timeout.
             *
             *      function repro(uint256 n) public pure returns (uint256) {
             *          uint256 m = 2**n;
             *          return m**n;
             *      }
             *
             * Call a similar function with the same input _does not_ timeout:
             *
             *  function fix(uint256 n) public pure returns (uint256) {
             *      uint256 m = 2**(n*n);
             *       return m;
             *   }
             */

            function exp2(b,p) -> z {
                z := b
                for {p := sub(p, 1)}
                    gt(p, 0)
                    {p := sub(p, 1)}
                {
                    z := mul(z, b)
                }
            }

            // 5. Run Newton's nth Root Algorithm
            let delta := 1 // run at least once
            for {let i := 0}
                and(lt(i, 20), gt(delta, 0))
                {i := add(i,1)}
            {
                let lhsDenominator :=
                exp2(
                    root,
                    sub(n, 1)
                )

                let lhs := div(base, lhsDenominator)

                // check for overlow
                switch lt(lhs, root)
                case 0 {
                    // underestimate
                    delta := div(sub(lhs, root), n)
                    root := add(root, delta)
                }
                case 1 {
                    // overestimate
                    delta := div(sub(root, lhs), n)
                    root := sub(root, delta)
                }
            }
        }
    }
    function _nthRootFixedPoint(
        uint256 base,
        uint256 n,
        uint256 decimals
    )
        internal
        pure
        returns (uint256 root)
    {
        uint256 scalar = 10**decimals;
        uint256 numerator = _nthRoot(base, n);
        uint256 denominator = _nthRoot(scalar, n);
        root = (scalar * numerator) / denominator;
    }

    // scalar gets multiplied by once at the beginning
    function _exp(uint256 numerator, uint256 scalar, uint256 denominator, uint256 power)
        internal
        pure
        returns (uint256 result)
    {
        result = (numerator * scalar) / denominator;
        for(power = power - 1; power > 0; power -= 1) {
            result = (result * numerator) / denominator;
        }
        return result;
    }

    uint256 constant fixedPointDecimals = 18;
    uint256 constant scalar = 10**fixedPointDecimals;
    uint256 constant halfScalar = 10**(fixedPointDecimals/2);

    // cobb-douglas using the nth root fixed point algorithm above
    // no limitation on alpha. We tend to get better rounding
    // on the simplified versions below.
    function _cobbDouglas(
        uint256 totalRewards,
        uint256 ownerFees,
        uint256 totalFees,
        uint256 ownerStake,
        uint256 totalStake,
        uint8 alphaNumerator,
        uint8 alphaDenominator
    )
        internal
        pure
        returns (uint256)
    {
        return _exp(_nthRootFixedPoint(ownerFees * totalStake, alphaDenominator, 18),
                    ((totalRewards * ownerStake) / totalStake),
                    _nthRootFixedPoint(totalFees * ownerStake, alphaDenominator, 18),
                    alphaNumerator
                );
    }

    // alpha = 1/x
    function _cobbDouglasSimplified(
        uint256 totalRewards,
        uint256 ownerFees,
        uint256 totalFees,
        uint256 ownerStake,
        uint256 totalStake,
        uint8 alphaDenominator
    )
        internal
        pure
        returns (uint256)
    {
        return  (_nthRootFixedPoint(ownerFees * totalStake, alphaDenominator, 18) * totalRewards * ownerStake) /
                (_nthRootFixedPoint(totalFees * ownerStake, alphaDenominator, 18) * totalStake);
    }

    // (1 - alpha) = 1/x
    function _cobbDouglasSimplifiedInverse(
        uint256 totalRewards,
        uint256 ownerFees,
        uint256 totalFees,
        uint256 ownerStake,
        uint256 totalStake,
        uint8 alphaDenominator
    )
        internal
        pure
        returns (uint256)
    {
        return  (_nthRootFixedPoint(ownerStake * totalFees, alphaDenominator, 18) * totalRewards * ownerFees) /
                (_nthRootFixedPoint(totalStake * ownerFees, alphaDenominator, 18) * totalFees);
    }
}
