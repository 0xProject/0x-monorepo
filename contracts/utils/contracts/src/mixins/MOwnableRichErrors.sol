pragma solidity ^0.5.5;

import "./MRichErrors.sol";
import "./MOwnableRichErrorTypes.sol";

contract MOwnableRichErrors is 
    MOwnableRichErrorTypes,
    MRichErrors 
{
    function OnlyOwnerError(
        address _sender, 
        address _error 
    )
        internal 
        pure 
        returns (bytes memory);
}
