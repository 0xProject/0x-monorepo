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

import "../src/LibERC20Token.sol";
import "./TestLibERC20TokenTarget.sol";


contract TestLibERC20Token {

    TestLibERC20TokenTarget public target;

    constructor() public {
        target = new TestLibERC20TokenTarget();
    }

    function testApprove(
        bool shouldRevert,
        bytes calldata revertData,
        bytes calldata returnData,
        address spender,
        uint256 allowance
    )
        external
    {
        target.setBehavior(shouldRevert, revertData, returnData);
        LibERC20Token.approve(address(target), spender, allowance);
    }

    function testTransfer(
        bool shouldRevert,
        bytes calldata revertData,
        bytes calldata returnData,
        address to,
        uint256 amount
    )
        external
    {
        target.setBehavior(shouldRevert, revertData, returnData);
        LibERC20Token.transfer(address(target), to, amount);
    }

    function testTransferFrom(
        bool shouldRevert,
        bytes calldata revertData,
        bytes calldata returnData,
        address from,
        address to,
        uint256 amount
    )
        external
    {
        target.setBehavior(shouldRevert, revertData, returnData);
        LibERC20Token.transferFrom(address(target), from, to, amount);
    }
}
