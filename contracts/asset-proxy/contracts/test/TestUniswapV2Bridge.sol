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
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "@0x/contracts-utils/contracts/src/LibAddressArray.sol";
import "../src/bridges/UniswapV2Bridge.sol";
import "../src/interfaces/IUniswapV2Router01.sol";


/// @dev A minimalist ERC20/WETH token.
contract TestToken {

    using LibSafeMath for uint256;

    mapping (address => uint256) public balances;
    string private _nextRevertReason;

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

    /// @dev Set the balance for `owner`.
    function setBalance(address owner)
        external
        payable
    {
        balances[owner] = msg.value;
    }

    /// @dev Set the revert reason for `transfer()`,
    ///      `deposit()`, and `withdraw()`.
    function setRevertReason(string calldata reason)
        external
    {
        _nextRevertReason = reason;
    }

    /// @dev Just emits a TokenTransfer event on the caller
    function transfer(address to, uint256 amount)
        external
        returns (bool)
    {
        _revertIfReasonExists();
        emit TokenTransfer(msg.sender, msg.sender, to, amount);
        return true;
    }

    /// @dev Just emits a TokenApprove event on the caller
    function approve(address spender, uint256 allowance)
        external
        returns (bool)
    {
        emit TokenApprove(spender, allowance);
        return true;
    }

    /// @dev `IWETH.deposit()` that increases balances and calls
    ///     `raiseWethDeposit()` on the caller.
    function deposit()
        external
        payable
    {
        _revertIfReasonExists();
        balances[msg.sender] += balances[msg.sender].safeAdd(msg.value);
        // TestEventsRaiser(msg.sender).raiseWethDeposit(msg.value);
    }

    /// @dev `IWETH.withdraw()` that just reduces balances and calls
    ///       `raiseWethWithdraw()` on the caller.
    function withdraw(uint256 amount)
        external
    {
        _revertIfReasonExists();
        balances[msg.sender] = balances[msg.sender].safeSub(amount);
        msg.sender.transfer(amount);
        // TestEventsRaiser(msg.sender).raiseWethWithdraw(amount);
    }

    function allowance(address, address) external view returns (uint256) {
        return 0;
    }

    /// @dev Retrieve the balance for `owner`.
    function balanceOf(address owner)
        external
        view
        returns (uint256)
    {
        return balances[owner];
    }

    function _revertIfReasonExists()
        private
        view
    {
        if (bytes(_nextRevertReason).length != 0) {
            revert(_nextRevertReason);
        }
    }
}


contract TestRouter is
    IUniswapV2Router01
{

    event TokenToTokenTransferInput(
        address exchange,
        uint256 tokensSold,
        uint256 minTokensBought,
        uint256 deadline,
        address recipient,
        address toTokenAddress
    );

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts)
    {
        amounts = new uint[](2);
        amounts[0] = amountIn;
        // amounts[1] = address(this).balance;
        amounts[1] = amountOutMin;

        emit TokenToTokenTransferInput(
            msg.sender,
            // tokens sold
            amountIn,
            // tokens bought
            amountOutMin,
            // deadline
            deadline,
            // recipient
            to,
            // output token (toTokenAddress)
            path[1]
        );
    }

}


/// @dev UniswapV2Bridge overridden to mock tokens and Uniswap router
contract TestUniswapV2Bridge is
    UniswapV2Bridge
{

    // Token address to TestToken instance.
    mapping (address => TestToken) private _testTokens;
    // TestRouter instance.
    TestRouter private _testRouter;

    constructor() public {
        _testRouter = new TestRouter();
    }

    /// @dev Sets the balance of this contract for an existing token.
    ///      The wei attached will be the balance.
    function setTokenBalance(address tokenAddress)
        external
        payable
    {
        TestToken token = _testTokens[tokenAddress];
        token.deposit.value(msg.value)();
    }

    /// @dev Sets the revert reason for an existing token.
    function setTokenRevertReason(address tokenAddress, string calldata revertReason)
        external
    {
        TestToken token = _testTokens[tokenAddress];
        token.setRevertReason(revertReason);
    }

    /// @dev Create a new token
    /// @param tokenAddress The token address. If zero, one will be created.
    function createToken(
        address tokenAddress
    )
        external
        payable
        returns (TestToken token)
    {
        token = TestToken(tokenAddress);
        if (tokenAddress == address(0)) {
            token = new TestToken();
        }
        _testTokens[address(token)] = token;

        return token;
    }

    function _getUniswapV2Router01Address()
        internal
        view
        returns (address)
    {
        return address(_testRouter);
    }
}
