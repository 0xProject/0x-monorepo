pragma solidity 0.4.18;

import "./Mintable_v2.sol";
import "./../utils/Ownable_v2.sol";

contract DummyToken_v2 is Mintable_v2, Ownable_v2 {
    string public name;
    string public symbol;
    uint public decimals;

    function DummyToken_v2(
        string _name,
        string _symbol,
        uint _decimals,
        uint _totalSupply)
        public
    {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply;
        balances[msg.sender] = _totalSupply;
    }

    function setBalance(address _target, uint _value) 
        public
        onlyOwner 
    {
        uint currBalance = balanceOf(_target);
        if (_value < currBalance) {
            totalSupply = safeSub(totalSupply, safeSub(currBalance, _value));
        } else {
            totalSupply = safeAdd(totalSupply, safeSub(_value, currBalance));
        }
        balances[_target] = _value;
    }
}
