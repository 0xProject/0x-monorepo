pragma solidity ^0.5.5;

import "./RichErrors.sol";
import "./mixins/MOwnableRichErrors.sol";

contract MixinOwnableRichErrors is 
    RichErrors,
    MOwnableRichErrors
{
    function OnlyOwnerError(
        address _sender, 
        address _error 
    )
        internal 
        pure 
        returns (bytes memory) 
    {
        return abi.encodeWithSelector(
            ONLY_OWNER_ERROR,
            _sender,
            _error
        );
    }
}
