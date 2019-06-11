pragma solidity ^0.5.9;

import "./interfaces/IOwnable.sol";
import "./MixinOwnableRichErrors.sol";


contract Ownable is
    MixinOwnableRichErrors,
    IOwnable
{
    address public owner;

    constructor ()
        public
    {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) {
            _rrevert(OnlyOwnerError(
                msg.sender,
                owner
            ));
        }
        _;
    }

    function transferOwnership(address newOwner)
        public
        onlyOwner
    {
        if (newOwner != address(0)) {
            owner = newOwner;
        }
    }
}
