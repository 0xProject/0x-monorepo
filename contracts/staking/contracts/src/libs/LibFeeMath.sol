

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


library LibFeeMath {

    /// @dev This library implements math helpers for fee computation.
    /// *** READ MixinExchangeFees BEFORE CONTINUING ***
    /// @TODO - Optimization / Precision / SafeMath.
    /// @TODO Once better nth root - choose a value that is not a divisor of 18, like 7.
    /// @TODO Update these values for deployment.
    /// There may be better, more efficient ways of implementing these functions.
    /// This works well enough to test the end-to-system, but it would be really
    /// good to get some math experts in here to check out this code. We should also
    /// look at existing projects, in case similar functionality exists and has been
    /// audited by a third-party.

    // Denominator of alpha in cobb-douglas function
    uint256 constant internal COBB_DOUGLAS_ALPHA_DENOMINATOR = 6;

    // Reflects number of decimal places in a token amount
    uint256 constant internal TOKEN_MULTIPLIER = 1000000000000000000;

    // The divisor for finding the nth root of token amounts.
    uint256 constant internal NTH_ROOT_OF_TOKEN_MULTIPLIER = 1000;

    /// @dev Computes the nth root of a number.
    /// @param base to compute the root.
    /// @param n nth root.
    /// @return nth root of base.
    function _nthRoot(uint256 base, uint256 n)
        internal
        pure
        returns (uint256 root)
    {
        assembly {
            ///// Implements Newton's Approximation, derived from Newton's nth Root Algorithm /////
            ///// See https://en.wikipedia.org/wiki/Nth_root#nth_root_algorithm

            // 1. Find greatest power-of-2 <= `value`
            let nearestPowerOf2 := 0x100000000000000000000000000000000
            let m := 128
            for {let p := 64}
                gt(p, 0)
                { p := div(p, 2) }
            {

                switch gt(nearestPowerOf2, base)
                case 1 {
                    nearestPowerOf2 := shr(p, nearestPowerOf2)
                    m := sub(m, p)
                }
                case 0 {
                    switch lt(nearestPowerOf2, base)
                    case 1 {
                        nearestPowerOf2 := shl(p, nearestPowerOf2)
                        m := add(m, p)
                    }
                    case 0 {
                        p := 0
                    }
                }
            }
            if gt(nearestPowerOf2, base) {
                nearestPowerOf2 := shr(1, nearestPowerOf2)
                m := sub(m, 1)
            }


            // 2. Find greatest power-of-2 that, when raised to the power of `n`,
            //    is <= `value`
            let x := exp(2, div(m, n))

            // 3. Find y such that `x` + `y` = `base`
            let y := sub(base, exp2(x, n))

            // 4. Run Newton's Approximation to approximate the root
            let denominator := mul(n, exp2(x, sub(n, 1)))
            root := add(x, div(y, denominator))
                
            // 5. Run Newton's nth Root Algorithm
            let delta := 1 // run at least once
            // solhint-disable no-empty-blocks
            for {}
                gt(delta, 0)
                {}
            {
                // compute lhs
                let lhsDenominator := exp2(root, sub(n, 1))
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

            // @HACK(hysz) - ganache core workaround (issue #430)
            function exp2(b, p) -> z {
                z := b
                for {p := sub(p, 1)}
                    gt(p, 0)
                    {p := sub(p, 1)}
                {
                    z := mul(z, b)
                }
            }
        }
    }

    /// @dev Computes the nth root of a fixed point value.
    /// @param base to compute the root.
    /// @param n nth root.
    /// @return nth root of base.
    function _nthRootFixedPoint(
        uint256 base,
        uint256 n
    )
        internal
        pure
        returns (uint256 root)
    {
        uint256 scalar = 10**18;
        uint256 numerator = _nthRoot(base, n);
        uint256 denominator = _nthRoot(scalar, n);
        root = (scalar * numerator) / denominator;
    }

    /// @dev Computes the nth root of a fixed point value, where the 
    /// number of decimal places is known before hand (hardcoded above).
    /// @param base to compute the root.
    /// @return nth root of base.
    function _nthRootFixedPointFixedN(
        uint256 base
    )
        internal
        pure
        returns (uint256 root)
    {
        uint256 numerator = _nthRoot(base, COBB_DOUGLAS_ALPHA_DENOMINATOR);
        root = (TOKEN_MULTIPLIER * numerator) / NTH_ROOT_OF_TOKEN_MULTIPLIER;
        return root;
    }

    /// @dev Computes an exponent of a value in the form (ab)/c, minimizing loss of precision.
    /// @param numerator of fraction
    /// @param scalar to be multiplied by the numerator
    /// @param denominator of fraction
    /// @param power to raise value to
    /// @return Exponent of input value.
    function _exp(uint256 numerator, uint256 scalar, uint256 denominator, uint256 power)
        internal
        pure
        returns (uint256 result)
    {
        result = (numerator * scalar) / denominator;
        for (power = power - 1; power > 0; power -= 1) {
            result = (result * numerator) / denominator;
        }
        return result;
    }

    /// @dev The cobb-douglas function used to compute fee-based rewards for staking pools in a given epoch.
    /// Note that in this function there is no limitation on alpha; we tend to get better rounding
    /// on the simplified versions below.
    /// @param totalRewards collected over an epoch.
    /// @param ownerFees Fees attributed to the owner of the staking pool.
    /// @param totalFees collected across all active staking pools in the epoch.
    /// @param ownerStake Stake attributed to the owner of the staking pool.
    /// @param totalStake collected across all active staking pools in the epoch.
    /// @param alphaNumerator Numerator of `alpha` in the cobb-dougles function.
    /// @param alphaDenominator Denominator of `alpha` in the cobb-douglas function.
    /// @return Result of computing the cobb-douglas function.
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
        return _exp(_nthRootFixedPoint(ownerFees * totalStake, alphaDenominator),
                    ((totalRewards * ownerStake) / totalStake),
                    _nthRootFixedPoint(totalFees * ownerStake, alphaDenominator),
                    alphaNumerator
                );
    }

    /// @dev The cobb-douglas function used to compute fee-based rewards for staking pools in a given epoch.
    /// Note - we assume that alpha = 1/x
    /// @param totalRewards collected over an epoch.
    /// @param ownerFees Fees attributed to the owner of the staking pool.
    /// @param totalFees collected across all active staking pools in the epoch.
    /// @param ownerStake Stake attributed to the owner of the staking pool.
    /// @param totalStake collected across all active staking pools in the epoch.
    /// @param alphaDenominator Denominator of `alpha` in the cobb-douglas function.
    /// @return Result of computing the cobb-douglas function.
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
        return  (_nthRootFixedPoint(ownerFees * totalStake, alphaDenominator) * totalRewards * ownerStake) /
                (_nthRootFixedPoint(totalFees * ownerStake, alphaDenominator) * totalStake);
    }

    /// @dev The cobb-douglas function used to compute fee-based rewards for staking pools in a given epoch.
    /// Note - we assume that (1 - alpha) = 1/x
    /// @param totalRewards collected over an epoch.
    /// @param ownerFees Fees attributed to the owner of the staking pool.
    /// @param totalFees collected across all active staking pools in the epoch.
    /// @param ownerStake Stake attributed to the owner of the staking pool.
    /// @param totalStake collected across all active staking pools in the epoch.
    /// @param alphaDenominator Denominator of `alpha` in the cobb-douglas function.
    /// @return Result of computing the cobb-douglas function.
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
        return  (_nthRootFixedPoint(ownerStake * totalFees, alphaDenominator) * totalRewards * ownerFees) /
                (_nthRootFixedPoint(totalStake * ownerFees, alphaDenominator) * totalFees);
    }

    /// @dev The cobb-douglas function used to compute fee-based rewards for staking pools in a given epoch.
    /// Note - we assume that alpha = 1/x, where x is defined by `COBB_DOUGLAS_ALPHA_DENOMINATOR`
    /// @param totalRewards collected over an epoch.
    /// @param ownerFees Fees attributed to the owner of the staking pool.
    /// @param totalFees collected across all active staking pools in the epoch.
    /// @param ownerStake Stake attributed to the owner of the staking pool.
    /// @param totalStake collected across all active staking pools in the epoch.
    /// @return Result of computing the cobb-douglas function.
    function _cobbDouglasSuperSimplified(
        uint256 totalRewards,
        uint256 ownerFees,
        uint256 totalFees,
        uint256 ownerStake,
        uint256 totalStake
    )
        internal
        pure
        returns (uint256)
    {
        return  (_nthRootFixedPointFixedN(ownerFees * totalStake) * totalRewards * ownerStake) /
                (_nthRootFixedPointFixedN(totalFees * ownerStake) * totalStake);
    }

    /// @dev The cobb-douglas function used to compute fee-based rewards for staking pools in a given epoch.
    /// Note - we assume that (1 - alpha) = 1/x, where x is defined by `COBB_DOUGLAS_ALPHA_DENOMINATOR`
    /// @param totalRewards collected over an epoch.
    /// @param ownerFees Fees attributed to the owner of the staking pool.
    /// @param totalFees collected across all active staking pools in the epoch.
    /// @param ownerStake Stake attributed to the owner of the staking pool.
    /// @param totalStake collected across all active staking pools in the epoch.
    /// @return Result of computing the cobb-douglas function.
    function _cobbDouglasSuperSimplifiedInverse(
        uint256 totalRewards,
        uint256 ownerFees,
        uint256 totalFees,
        uint256 ownerStake,
        uint256 totalStake
    )
        internal
        pure
        returns (uint256)
    {
        return  (_nthRootFixedPointFixedN(ownerStake * totalFees) * totalRewards * ownerFees) /
                (_nthRootFixedPointFixedN(totalStake * ownerFees) * totalFees);
    }
}
