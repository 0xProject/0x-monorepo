pragma solidity ^0.5.5;

import "./MRichErrorTypes.sol";

contract MOwnableRichErrorTypes is 
    MRichErrorTypes 
{
    // bytes4(keccak256("OnlyOwnerError(address,address)"))
    bytes4 internal constant ONLY_OWNER_ERROR = 
        0x1de45ad1;
}
