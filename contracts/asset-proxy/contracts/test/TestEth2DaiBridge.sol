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

import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";
import "../src/bridges/Eth2DaiBridge.sol";
import "../src/interfaces/IEth2Dai.sol";


// solhint-disable no-simple-event-func-name
contract TestEvents {

    event TokenTransfer(
        address token,
        address from,
        address to,
        uint256 amount
    );

    event TokenApprove(
        address token,
        address spender,
        uint256 allowance
    );

    function raiseTokenTransfer(
        address from,
        address to,
        uint256 amount
    )
        external
    {
        emit TokenTransfer(
            msg.sender,
            from,
            to,
            amount
        );
    }

    function raiseTokenApprove(address spender, uint256 allowance)
        external
    {
        emit TokenApprove(msg.sender, spender, allowance);
    }
}


/// @dev A minimalist ERC20 token.
contract TestToken {

    mapping (address => uint256) public balances;
    string private _nextTransferRevertReason;
    bytes private _nextTransferReturnData;

    /// @dev Just calls `raiseTokenTransfer()` on the caller.
    function transfer(address to, uint256 amount)
        external
        returns (bool)
    {
        TestEvents(msg.sender).raiseTokenTransfer(msg.sender, to, amount);
        if (bytes(_nextTransferRevertReason).length != 0) {
            revert(_nextTransferRevertReason);
        }
        bytes memory returnData = _nextTransferReturnData;
        assembly { return(add(returnData, 0x20), mload(returnData)) }
    }

    /// @dev Set the balance for `owner`.
    function setBalance(address owner, uint256 balance)
        external
    {
        balances[owner] = balance;
    }

    /// @dev Set the behavior of the `transfer()` call.
    function setTransferBehavior(
        string calldata revertReason,
        bytes calldata returnData
    )
        external
    {
        _nextTransferRevertReason = revertReason;
        _nextTransferReturnData = returnData;
    }

    /// @dev Just calls `raiseTokenApprove()` on the caller.
    function approve(address spender, uint256 allowance)
        external
        returns (bool)
    {
        TestEvents(msg.sender).raiseTokenApprove(spender, allowance);
        return true;
    }

    /// @dev Retrieve the balance for `owner`.
    function balanceOf(address owner)
        external
        view
        returns (uint256)
    {
        return balances[owner];
    }
}


/// @dev Eth2DaiBridge overridden to mock tokens and
///      implement IEth2Dai.
contract TestEth2DaiBridge is
    TestEvents,
    IEth2Dai,
    Eth2DaiBridge
{
    event SellAllAmount(
        address sellToken,
        uint256 sellTokenAmount,
        address buyToken,
        uint256 minimumFillAmount
    );

    mapping (address => TestToken)  public testTokens;
    string private _nextRevertReason;
    uint256 private _nextFillAmount;

    /// @dev Create a token and set this contract's balance.
    function createToken(uint256 balance)
        external
        returns (address tokenAddress)
    {
        TestToken token = new TestToken();
        testTokens[address(token)] = token;
        token.setBalance(address(this), balance);
        return address(token);
    }

    /// @dev Set the behavior for `IEth2Dai.sellAllAmount()`.
    function setFillBehavior(string calldata revertReason, uint256 fillAmount)
        external
    {
        _nextRevertReason = revertReason;
        _nextFillAmount = fillAmount;
    }

    /// @dev Set the behavior of a token's `transfer()`.
    function setTransferBehavior(
        address tokenAddress,
        string calldata revertReason,
        bytes calldata returnData
    )
        external
    {
        testTokens[tokenAddress].setTransferBehavior(revertReason, returnData);
    }

    /// @dev Implementation of `IEth2Dai.sellAllAmount()`
    function sellAllAmount(
        address sellTokenAddress,
        uint256 sellTokenAmount,
        address buyTokenAddress,
        uint256 minimumFillAmount
    )
        external
        returns (uint256 fillAmount)
    {
        emit SellAllAmount(
            sellTokenAddress,
            sellTokenAmount,
            buyTokenAddress,
            minimumFillAmount
        );
        if (bytes(_nextRevertReason).length != 0) {
            revert(_nextRevertReason);
        }
        return _nextFillAmount;
    }

    // @dev This contract will double as the Eth2Dai contract.
    function _getEth2DaiAddress()
        internal
        view
        returns (address)
    {
        return address(this);
    }
}
