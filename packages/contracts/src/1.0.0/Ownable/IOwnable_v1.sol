pragma solidity ^0.4.19;

/*
 * Ownable
 *
 * Base contract with an owner.
 * Provides onlyOwner modifier, which prevents function from running if it is called by anyone other than the owner.
 */

contract IOwnable_v1 {
  
    function owner()
      public view
      returns (address);
  
    function transferOwnership(address newOwner)
      public;
}
