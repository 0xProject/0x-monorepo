pragma solidity 0.4.18;

import "./../tokens/UnlimitedAllowanceToken_v2.sol";
import "./../utils/SafeMath_v2.sol";

/*
 * Mintable
 * Base contract that creates a mintable UnlimitedAllowanceToken
 */
contract Mintable_v2 is UnlimitedAllowanceToken_v2, SafeMath_v2 {
    function mint(uint _value) 
        public
    {
        require(_value <= 100000000000000000000);
        balances[msg.sender] = safeAdd(_value, balances[msg.sender]);
        totalSupply = safeAdd(totalSupply, _value);
    }
}
