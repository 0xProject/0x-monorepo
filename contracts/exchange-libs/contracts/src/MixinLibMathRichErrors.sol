pragma solidity ^0.5.9;

import "@0x/contracts-utils/contracts/src/RichErrors.sol";
import "./interfaces/IMixinLibMathRichErrors.sol";


contract MixinLibMathRichErrors is
    IMixinLibMathRichErrors,
    RichErrors
{
    // solhint-disable func-name-mixedcase
    function DivisionByZeroError()
        internal
        pure
        returns (bytes memory)
    {
        bytes4 divisionError = DIVISION_BY_ZERO_SELECTOR;
        assembly {
            mstore(0, divisionError)
            revert(0, 4)
        }
    }

    function RoundingError(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ROUNDING_ERROR_SELECTOR,
            numerator,
            denominator,
            target
        );
    }
}
