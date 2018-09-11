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

pragma solidity 0.4.24;

import "./DummyERC20Token.sol";


// solhint-disable no-empty-blocks
contract DummyMultipleReturnERC20Token is
    DummyERC20Token
{
    constructor (
        string _name,
        string _symbol,
        uint256 _decimals,
        uint256 _totalSupply
    )
        public
        DummyERC20Token(
            _name,
            _symbol,
            _decimals,
            _totalSupply
        )
    {}

    /// @dev send `value` token to `to` from `from` on the condition it is approved by `from`
    /// @param _from The address of the sender
    /// @param _to The address of the recipient
    /// @param _value The amount of token to be transferred
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    )
        external
        returns (bool)
    {
        emit Transfer(
            _from,
            _to,
            _value
        );

        // HACK: This contract will not compile if we remove `returns (bool)`, so we manually return 64 bytes (equiavalent to true, true)
        assembly {
            mstore(0, 1)
            mstore(32, 1)
            return(0, 64)
        }
    }
}

