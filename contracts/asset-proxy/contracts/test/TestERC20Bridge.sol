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

import "../src/interfaces/IERC20Bridge.sol";


/// @dev Test bridge token
contract TestERC20BridgeToken {
    mapping (address => uint256) private _balances;

    function addBalance(address owner, int256 amount)
        external
    {
        setBalance(owner, uint256(int256(balanceOf(owner)) + amount));
    }

    function setBalance(address owner, uint256 balance)
        public
    {
        _balances[owner] = balance;
    }

    function balanceOf(address owner)
        public
        view
        returns (uint256)
    {
        return _balances[owner];
    }
}


/// @dev Test bridge contract.
contract TestERC20Bridge is
    IERC20Bridge
{
    TestERC20BridgeToken public testToken;

    event BridgeTransfer(
        bytes bridgeData,
        address tokenAddress,
        address from,
        address to,
        uint256 amount
    );

    constructor() public {
        testToken = new TestERC20BridgeToken();
    }

    function setTestTokenBalance(address owner, uint256 balance)
        external
    {
        testToken.setBalance(owner, balance);
    }

    function transfer(
        bytes calldata bridgeData,
        address tokenAddress,
        address from,
        address to,
        uint256 amount
    )
        external
        returns (bytes4)
    {
        emit BridgeTransfer(
            bridgeData,
            tokenAddress,
            from,
            to,
            amount
        );
        // Unpack the bridgeData.
        (
            int256 transferAmount,
            bytes memory revertData,
            bytes memory returnData
        ) = abi.decode(bridgeData, (int256, bytes, bytes));

        // If `revertData` is set, revert.
        if (revertData.length != 0) {
            assembly { revert(add(revertData, 0x20), mload(revertData)) }
        }
        // Increase `to`'s balance by `transferAmount`.
        TestERC20BridgeToken(tokenAddress).addBalance(to, transferAmount);
        // Return `returnData`.
        assembly { return(add(returnData, 0x20), mload(returnData)) }
    }
}
