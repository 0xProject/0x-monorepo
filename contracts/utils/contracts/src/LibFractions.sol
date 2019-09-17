pragma solidity ^0.5.9;

import "./LibSafeMath.sol";


library LibFractions {

    using LibSafeMath for uint256;

    /// @dev Maximum value for addition result components.
    uint256 constant internal RESCALE_THRESHOLD = 10 ** 27;
    /// @dev Rescale factor for addition.
    uint256 constant internal RESCALE_BASE = 10 ** 9;

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
        if (n1 == 0) {
            return (numerator = n2, denominator = d2);
        }
        if (n2 == 0) {
            return (numerator = n1, denominator = d1);
        }
        numerator = n1
            .safeMul(d2)
            .safeAdd(n2.safeMul(d1));
        denominator = d1.safeMul(d2);

        // If either the numerator or the denominator are > RESCALE_THRESHOLD,
        // re-scale them to prevent overflows in future operations.
        if (numerator > RESCALE_THRESHOLD || denominator > RESCALE_THRESHOLD) {
            numerator = numerator.safeDiv(RESCALE_BASE);
            denominator = denominator.safeDiv(RESCALE_BASE);
        }
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
        if (s == 0) {
            return 0;
        }
        if (n2 == 0) {
            return result = s
                .safeMul(n1)
                .safeDiv(d1);
        }
        uint256 numerator = n1
            .safeMul(d2)
            .safeSub(n2.safeMul(d1));
        uint256 tmp = numerator.safeDiv(d2);
        result = s
            .safeMul(tmp)
            .safeDiv(d1);
    }
}
