/*

  Copyright 2019 ZeroEx Intl.

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

pragma solidity ^0.5.5;

import "@0x/contracts-utils/contracts/src/Ownable.sol";
import "../src/MintableERC20Token.sol";


contract DummyERC20Token is 
    Ownable,
    MintableERC20Token
{
    string public name;
    string public symbol;
    uint256 public decimals;
    uint256 public constant MAX_MINT_AMOUNT = 10000000000000000000000;

    constructor (
        string memory _name,
        string memory _symbol,
        uint256 _decimals,
        uint256 _totalSupply
    )
        public
    {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        _totalSupply = _totalSupply;
        balances[msg.sender] = _totalSupply;
    }

    /// @dev Sets the balance of target address
    /// @param _target Address or which balance will be updated
    /// @param _value New balance of target address
    function setBalance(address _target, uint256 _value)
        external
        onlyOwner
    {
        uint256 currBalance = balances[_target];
        if (_value < currBalance) {
            _totalSupply = _safeSub(_totalSupply, _safeSub(currBalance, _value));
        } else {
            _totalSupply = _safeAdd(_totalSupply, _safeSub(_value, currBalance));
        }
        balances[_target] = _value;
    }

    /// @dev Mints new tokens for sender
    /// @param _value Amount of tokens to mint
    function mint(uint256 _value)
        external
    {
        require(
            _value <= MAX_MINT_AMOUNT,
            "VALUE_TOO_LARGE"
        );

        _mint(msg.sender, _value);
    }
}
