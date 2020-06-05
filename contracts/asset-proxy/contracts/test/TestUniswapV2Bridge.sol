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


contract TestEventsRaiser {

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

    event SwapExactTokensForTokensInput(
        uint amountIn,
        uint amountOutMin,
        address toTokenAddress,
        address to,
        uint deadline
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

    function raiseTokenApprove(address spender, uint256 allowance) external {
        emit TokenApprove(spender, allowance);
    }

    function raiseSwapExactTokensForTokensInput(
        uint amountIn,
        uint amountOutMin,
        address toTokenAddress,
        address to,
        uint deadline
    ) external
    {
        emit SwapExactTokensForTokensInput(
            amountIn,
            amountOutMin,
            toTokenAddress,
            to,
            deadline
        );
    }
}


/// @dev A minimalist ERC20 token.
contract TestToken {

    using LibSafeMath for uint256;

    mapping (address => uint256) public balances;
    string private _nextRevertReason;

    /// @dev Set the balance for `owner`.
    function setBalance(address owner, uint256 balance)
        external
        payable
    {
        balances[owner] = balance;
    }

    /// @dev Just emits a TokenTransfer event on the caller
    function transfer(address to, uint256 amount)
        external
        returns (bool)
    {
        TestEventsRaiser(msg.sender).raiseTokenTransfer(msg.sender, to, amount);
        return true;
    }

    /// @dev Just emits a TokenApprove event on the caller
    function approve(address spender, uint256 allowance)
        external
        returns (bool)
    {
        TestEventsRaiser(msg.sender).raiseTokenApprove(spender, allowance);
        return true;
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
}


/// @dev Mock the UniswapV2Router01 contract
contract TestRouter is
    IUniswapV2Router01
{
    string private _nextRevertReason;

    /// @dev Set the revert reason for `swapExactTokensForTokens`.
    function setRevertReason(string calldata reason)
        external
    {
        _nextRevertReason = reason;
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts)
    {
        _revertIfReasonExists();

        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        amounts[amounts.length - 1] = amountOutMin;

        TestEventsRaiser(msg.sender).raiseSwapExactTokensForTokensInput(
            // tokens sold
            amountIn,
            // tokens bought
            amountOutMin,
            // output token (toTokenAddress)
            path[path.length - 1],
            // recipient
            to,
            // deadline
            deadline
        );
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


/// @dev UniswapV2Bridge overridden to mock tokens and Uniswap router
contract TestUniswapV2Bridge is
    UniswapV2Bridge,
    TestEventsRaiser
{

    // Token address to TestToken instance.
    mapping (address => TestToken) private _testTokens;
    // TestRouter instance.
    TestRouter private _testRouter;

    constructor() public {
        _testRouter = new TestRouter();
    }

    function setRouterRevertReason(string calldata revertReason)
        external
    {
        _testRouter.setRevertReason(revertReason);
    }

    /// @dev Sets the balance of this contract for an existing token.
    ///      The wei attached will be the balance.
    function setTokenBalance(address tokenAddress, uint256 balance)
        external
    {
        TestToken token = _testTokens[tokenAddress];
        token.setBalance(address(this), balance);
    }

    /// @dev Create a new token
    /// @param tokenAddress The token address. If zero, one will be created.
    function createToken(
        address tokenAddress
    )
        external
        returns (TestToken token)
    {
        token = TestToken(tokenAddress);
        if (tokenAddress == address(0)) {
            token = new TestToken();
        }
        _testTokens[address(token)] = token;

        return token;
    }

    function getRouterAddress()
        external
        view
        returns (address)
    {
        return address(_testRouter);
    }

    function _getUniswapV2Router01Address()
        internal
        view
        returns (address)
    {
        return address(_testRouter);
    }
}
