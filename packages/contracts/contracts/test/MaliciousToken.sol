pragma solidity 0.4.11;

import "./../base/StandardToken.sol";

contract MaliciousToken is StandardToken {
    uint8 stateToUpdate = 1;  // Not null so that change only requires 5000 gas

    function updateState() internal {
        stateToUpdate++;
    }

    function balanceOf(address _owner)
        public
        constant
        returns (uint)
    {
        updateState();
        return balances[_owner];
    }

    function allowance(address _owner, address _spender)
        public
        constant
        returns (uint)
    {
        updateState();
        return allowed[_owner][_spender];
    }
}
