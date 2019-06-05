pragma solidity ^0.5.9;

import "./RichErrors.sol";


contract MixinSafeMathRichErrors is
    RichErrors
{
    // bytes4(keccak256("Uint256OverflowError(uint256,uint256)"))
    bytes4 internal constant UINT256_OVERFLOW_ERROR =
        0x55101607;

    // bytes4(keccak256("Uint256UnderflowError(uint256,uint256)"))
    bytes4 internal constant UINT256_UNDERFLOW_ERROR =
        0x60ee612f;

    // solhint-disable func-name-mixedcase
    function Uint256OverflowError(
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            UINT256_OVERFLOW_ERROR,
            a,
            b
        );
    }

    function Uint256UnderflowError(
        uint256 a,
        uint256 b
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            UINT256_UNDERFLOW_ERROR,
            a,
            b
        );
    }
}
