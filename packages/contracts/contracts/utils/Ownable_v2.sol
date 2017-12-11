pragma solidity 0.4.18;

/*
 * Ownable
 *
 * Base contract with an owner.
 * Provides onlyOwner modifier, which prevents function from running if it is called by anyone other than the owner.
 */

contract Ownable_v2 {
    address public owner;

    function Ownable_v2()
        public
    {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
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
