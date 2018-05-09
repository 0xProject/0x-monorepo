/*

  Copyright 2018 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.4.23;
pragma experimental ABIEncoderV2;

import "../Mintable/Mintable.sol";
import "../../utils/Ownable/Ownable.sol";

contract DummyERC20Token is Mintable, Ownable {
    string public name;
    string public symbol;
    uint256 public decimals;

    constructor (
        string _name,
        string _symbol,
        uint256 _decimals,
        uint256 _totalSupply)
        public
    {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply;
        balances[msg.sender] = _totalSupply;
    }

    function setBalance(address _target, uint256 _value)
        public
        onlyOwner
    {
        uint256 currBalance = balanceOf(_target);
        if (_value < currBalance) {
            totalSupply = safeSub(totalSupply, safeSub(currBalance, _value));
        } else {
            totalSupply = safeAdd(totalSupply, safeSub(_value, currBalance));
        }
        balances[_target] = _value;
    }
}
