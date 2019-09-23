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

pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "../src/Staking.sol";


// solhint-disable no-empty-blocks
/// @dev A version of the staking contract with WETH-related functions
///      overridden to do nothing.
contract TestStakingNoWETH is
    Staking
{
    event Transfer(
        address indexed _from,
        address indexed _to,
        uint256 _value
    );

    function transfer(address to, uint256 amount)
        external
        returns (bool)
    {
        emit Transfer(address(this), to, amount);
        return true;
    }

    function _wrapEth()
        internal
    {}

    function _getAvailableWethBalance()
        internal
        view
        returns (uint256)
    {
        return address(this).balance;
    }

    function _getWethContract()
        internal
        view
        returns (IEtherToken)
    {
        return IEtherToken(address(this));
    }
}
