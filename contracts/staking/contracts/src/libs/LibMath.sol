

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
                or(lt(i, 10), gt(delta, 0))
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
}
