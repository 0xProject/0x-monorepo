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

pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "../src/LibDydxBalance.sol";


contract TestLibDydxBalanceToken {

    uint8 public decimals;
    mapping (address => uint256) public balanceOf;
    mapping (address => mapping (address => uint256)) public allowance;

    constructor(uint8 decimals_) public {
        decimals = decimals_;
    }

    function setBalance(address owner, uint256 balance) external {
        balanceOf[owner] = balance;
    }

    function setApproval(
        address owner,
        address spender,
        uint256 allowance_
    )
        external
    {
        allowance[owner][spender] = allowance_;
    }
}


contract TestLibDydxBalance {

    mapping (address => TestLibDydxBalanceToken) private tokens;

    function createToken(uint8 decimals) external returns (address) {
        TestLibDydxBalanceToken token = new TestLibDydxBalanceToken(decimals);
        return address(tokens[address(token)] = token);
    }

    function setTokenBalance(
        address tokenAddress,
        address owner,
        uint256 balance
    )
        external
    {
        tokens[tokenAddress].setBalance(owner, balance);
    }

    function setTokenApproval(
        address tokenAddress,
        address owner,
        address spender,
        uint256 allowance
    )
        external
    {
        tokens[tokenAddress].setApproval(owner, spender, allowance);
    }

    function getSolventMakerAmount(
        LibDydxBalance.BalanceCheckInfo memory info
    )
        public
        view
        returns (uint256 solventMakerAmount)
    {
        return LibDydxBalance._getSolventMakerAmount(info);
    }

    function getDepositableMakerAmount(
        LibDydxBalance.BalanceCheckInfo memory info
    )
        public
        view
        returns (uint256 depositableMakerAmount)
    {
        return LibDydxBalance._getDepositableMakerAmount(info);
    }
}
