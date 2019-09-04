pragma solidity ^0.5.9;

import "./LibSafeMath.sol";


library LibFractions {

    using LibSafeMath for uint256;

    /// @dev Safely adds two fractions `n1/d1 + n2/d2`
    /// @param n1 numerator of `1`
    /// @param d1 denominator of `1`
    /// @param n2 numerator of `2`
    /// @param d2 denominator of `2`
    /// @return numerator of sum
    /// @return denominator of sum
    function addFractions(
        uint256 n1,
        uint256 d1,
        uint256 n2,
        uint256 d2
    )
        internal
        pure
        returns (
            uint256 numerator,
            uint256 denominator
        )
    {
        numerator = n1
            .safeMul(d2)
            .safeAdd(n2.safeMul(d1));

        denominator = d1.safeMul(d2);
        return (numerator, denominator);
    }

    /// @dev Safely scales the difference between two fractions.
    /// @param n1 numerator of `1`
    /// @param d1 denominator of `1`
    /// @param n2 numerator of `2`
    /// @param d2 denominator of `2`
    /// @param s scalar to multiply by difference.
    /// @return result = `s * (n1/d1 - n2/d2)`.
    function scaleFractionalDifference(
        uint256 n1,
        uint256 d1,
        uint256 n2,
        uint256 d2,
        uint256 s
    )
        internal
        pure
        returns (uint256 result)
    {
        uint256 numerator = n1
            .safeMul(d2)
            .safeSub(n2.safeMul(d1));

        uint256 tmp = numerator.safeDiv(d2);
        result = s
            .safeMul(tmp)
            .safeDiv(d1);
        return result;
    }
}
