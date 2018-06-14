pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

/*
 * Ownable
 *
 * Base contract with an owner.
 * Provides onlyOwner modifier, which prevents function from running if it is called by anyone other than the owner.
 */

import "./IOwnable.sol";

contract Ownable is IOwnable {
    address public owner;

    constructor ()
        public
    {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Only contract owner is allowed to call this method."
        );
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
