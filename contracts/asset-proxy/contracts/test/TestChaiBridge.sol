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

import "../src/bridges/ChaiBridge.sol";
import "@0x/contracts-erc20/contracts/src/ERC20Token.sol";


contract TestChaiDai is
    ERC20Token
{
    address private ALWAYS_REVERT_ADDRESS = address(1);

    function draw(
        address from,
        uint256 amount
    )
        external
    {
        if (from == ALWAYS_REVERT_ADDRESS) {
            revert();
        }
        balances[msg.sender] += amount;
    }
}

contract TestChaiBridge is
    ChaiBridge
{
    address public testChaiDai;
    address private ALWAYS_REVERT_ADDRESS = address(1);

    constructor()
        public
    {
        testChaiDai = address(new TestChaiDai());
    }

    function _getDaiAddress()
        internal
        view
        returns (address)
    {
        return testChaiDai;
    }

    function _getChaiAddress()
        internal
        view
        returns (address)
    {
        return testChaiDai;
    }

    function _getERC20BridgeProxyAddress()
        internal
        view
        returns (address)
    {
        return msg.sender == ALWAYS_REVERT_ADDRESS ? address(0) : msg.sender;
    }
}
