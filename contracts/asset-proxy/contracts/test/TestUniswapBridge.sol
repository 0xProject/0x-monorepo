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
import "../src/bridges/UniswapBridge.sol";
import "../src/interfaces/IUniswap.sol";


// solhint-disable no-simple-event-func-name
/// @dev Interface that allows `TestToken` to call functions on the
///      `TestUniswapBridge` contract.
interface ITestEventRaiser {

    function raiseTokenTransferEvent(
        address from,
        address to,
        uint256 amount
    )
        external;

    function raiseTokenApproveEvent(
        address spender,
        uint256 allowance
    )
        external;

    function raiseWethDeposit(
        uint256 amount
    )
        external;

    function raiseWethWithdraw(
        uint256 amount
    )
        external;
}


/// @dev A minimalist ERC20/WETH token.
contract TestToken {

    mapping (address => uint256) public balances;

    /// @dev Just calls `raiseTokenTransferEvent()` on the caller.
    function transfer(address to, uint256 amount)
        external
        returns (bool)
    {
        ITestEventRaiser(msg.sender).raiseTokenTransferEvent(msg.sender, to, amount);
        return true;
    }

    /// @dev Just calls `raiseTokenApproveEvent()` on the caller.
    function approve(address spender, uint256 allowance)
        external
        returns (bool)
    {
        ITestEventRaiser(msg.sender).raiseTokenApproveEvent(spender, allowance);
        return true;
    }

    /// @dev Set the balance for `owner`.
    function setBalance(address owner, uint256 balance)
        external
    {
        balances[owner] = balance;
    }

    // @dev `IWETH.deposit()` that just calls `raiseWethDeposit()` on the caller.
    function deposit()
        external
        payable
    {
        ITestEventRaiser(msg.sender).raiseWethDeposit(msg.value);
    }

    // @dev `IWETH.withdraw()` that just calls `raiseWethWithdraw()` on the caller.
    function withdraw(uint256 amount)
        external
    {
        ITestEventRaiser(msg.sender).raiseWethWithdraw(amount);
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


/// @dev UniswapBridge overridden to mock tokens and implement IUniswap.
contract TestUniswapBridge is
    IUniswap,
    UniswapBridge
{
    event SellAllAmount(
        address sellToken,
        uint256 sellTokenAmount,
        address buyToken,
        uint256 minimumFillAmount
    );

    event TokenTransfer(
        address token,
        address from,
        address to,
        uint256 amount
    );

    event TokenApprove(
        address spender,
        uint256 allowance
    );

    event WethDeposit(
        uint256 amount
    );

    event WethWithdraw(
        uint256 amount
    );

    TestToken public wethToken = new TestToken();
    TestToken public daiToken = new TestToken();
    string private _nextRevertReason;
    uint256 private _nextFillAmount;

    /// @dev Set token balances for this contract.
    function setTokenBalances(uint256 wethBalance, uint256 daiBalance)
        external
    {
        wethToken.setBalance(address(this), wethBalance);
        daiToken.setBalance(address(this), daiBalance);
    }

    /// @dev Set the behavior for `IUniswap.sellAllAmount()`.
    function setFillBehavior(string calldata revertReason, uint256 fillAmount)
        external
    {
        _nextRevertReason = revertReason;
        _nextFillAmount = fillAmount;
    }

    /// @dev Implementation of `IUniswap.sellAllAmount()`
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

    function raiseTokenTransferEvent(
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

    function raiseTokenApproveEvent(
        address spender,
        uint256 allowance
    )
        external
    {
        emit TokenApprove(
            spender,
            allowance
        );
    }

    /// @dev Retrieves the allowances of the test tokens.
    function getUniswapTokenAllowances()
        external
        view
        returns (uint256 wethAllowance, uint256 daiAllowance)
    {
        wethAllowance = wethToken.allowances(address(this), address(this));
        daiAllowance = daiToken.allowances(address(this), address(this));
        return (wethAllowance, daiAllowance);
    }

    // @dev Use `wethToken`.
    function _getWethContract()
        internal
        view
        returns (IERC20Token)
    {
        return IERC20Token(address(wethToken));
    }

    // @dev Use `daiToken`.
    function _getDaiContract()
        internal
        view
        returns (IERC20Token)
    {
        return IERC20Token(address(daiToken));
    }

    // @dev This contract will double as the Uniswap contract.
    function _getUniswapContract()
        internal
        view
        returns (IUniswap)
    {
        return IUniswap(address(this));
    }
}
