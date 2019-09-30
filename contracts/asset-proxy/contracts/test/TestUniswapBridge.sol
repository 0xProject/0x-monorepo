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
import "../src/bridges/UniswapBridge.sol";
import "../src/interfaces/IUniswapExchangeFactory.sol";
import "../src/interfaces/IUniswapExchange.sol";


contract TestEventsRaiser {

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

    event EthToTokenTransferInput(
        uint256 minTokensBought,
        uint256 deadline,
        address recipient
    );

    event TokenToEthSwapInput(
        uint256 tokensSold,
        uint256 minEthBought,
        uint256 deadline
    );

    event TokenToTokenTransferInput(
        uint256 tokensSold,
        uint256 minTokensBought,
        uint256 minEthBought,
        uint256 deadline,
        address recipient,
        address toTokenAddress
    );

    function raiseEthToTokenTransferInput(
        uint256 minTokensBought,
        uint256 deadline,
        address recipient
    )
        external
    {
        emit EthToTokenTransferInput(
            minTokensBought,
            deadline,
            recipient
        );
    }

    function raiseTokenToEthSwapInput(
        uint256 tokensSold,
        uint256 minEthBought,
        uint256 deadline
    )
        external
    {
        emit TokenToEthSwapInput(
            tokensSold,
            minEthBought,
            deadline
        );
    }

    function raiseTokenToTokenTransferInput(
        uint256 tokensSold,
        uint256 minTokensBought,
        uint256 minEthBought,
        uint256 deadline,
        address recipient,
        address toTokenAddress
    )
        external
    {
        emit TokenToTokenTransferInput(
            tokensSold,
            minTokensBought,
            minEthBought,
            deadline,
            recipient,
            toTokenAddress
        );
    }

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
        emit TokenApprove(spender, allowance);
    }

    function raiseWethDeposit(uint256 amount)
        external
    {
        emit WethDeposit(amount);
    }

    function raiseWethWithdraw(uint256 amount)
        external
    {
        emit WethWithdraw(amount);
    }
}

/// @dev A minimalist ERC20/WETH token.
contract TestToken {

    using LibSafeMath for uint256;

    mapping (address => uint256) public balances;

    /// @dev Calls `raiseTokenTransfer()` on the caller.
    function transfer(address to, uint256 amount)
        external
        returns (bool)
    {
        TestEventsRaiser(msg.sender).raiseTokenTransfer(msg.sender, to, amount);
        balances[msg.sender] = balances[msg.sender].safeSub(amount);
        balances[to] = balances[to].safeAdd(amount);
        return true;
    }

    /// @dev Just calls `raiseTokenApprove()` on the caller.
    function approve(address spender, uint256 allowance)
        external
        returns (bool)
    {
        TestEventsRaiser(msg.sender).raiseTokenApprove(spender, allowance);
        return true;
    }

    /// @dev Set the balance for `owner`.
    function setBalance(address owner, uint256 balance)
        external
        payable
    {
        balances[owner] = balance;
    }

    /// @dev `IWETH.deposit()` that increases balances and calls
    ///     `raiseWethDeposit()` on the caller.
    function deposit()
        external
        payable
    {
        balances[msg.sender] += balances[msg.sender].safeAdd(msg.value);
        TestEventsRaiser(msg.sender).raiseWethDeposit(msg.value);
    }

    /// @dev `IWETH.withdraw()` that just reduces balances and calls
    ///       `raiseWethWithdraw()` on the caller.
    function withdraw(uint256 amount)
        external
    {
        balances[msg.sender] = balances[msg.sender].safeSub(amount);
        msg.sender.transfer(amount);
        TestEventsRaiser(msg.sender).raiseWethWithdraw(amount);
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


contract TestExchange is
    IUniswapExchange
{
    address public tokenAddress;
    string private _nextRevertReason;
    uint256 private _nextFillAmount;

    constructor(address _tokenAddress) public {
        tokenAddress = _tokenAddress;
    }

    function setFillBehavior(
        string calldata revertReason,
        uint256 fillAmount
    )
        external
        payable
    {
        _nextRevertReason = revertReason;
        _nextFillAmount = fillAmount;
    }

    function ethToTokenTransferInput(
        uint256 minTokensBought,
        uint256 deadline,
        address recipient
    )
        external
        payable
        returns (uint256 tokensBought)
    {
        TestEventsRaiser(msg.sender).raiseEthToTokenTransferInput(
            minTokensBought,
            deadline,
            recipient
        );
        _revertIfReasonExists();
        return _nextFillAmount;
    }

    function tokenToEthSwapInput(
        uint256 tokensSold,
        uint256 minEthBought,
        uint256 deadline
    )
        external
        payable
        returns (uint256 ethBought)
    {
        TestEventsRaiser(msg.sender).raiseTokenToEthSwapInput(
            tokensSold,
            minEthBought,
            deadline
        );
        _revertIfReasonExists();
        return _nextFillAmount;
    }

    function tokenToTokenTransferInput(
        uint256 tokensSold,
        uint256 minTokensBought,
        uint256 minEthBought,
        uint256 deadline,
        address recipient,
        address toTokenAddress
    )
        external
        returns (uint256 tokensBought)
    {
        TestEventsRaiser(msg.sender).raiseTokenToTokenTransferInput(
            tokensSold,
            minTokensBought,
            minEthBought,
            deadline,
            recipient,
            toTokenAddress
        );
        _revertIfReasonExists();
        return _nextFillAmount;
    }

    function _revertIfReasonExists()
        private
    {
        if (bytes(_nextRevertReason).length != 0) {
            revert(_nextRevertReason);
        }
    }
}


/// @dev UniswapBridge overridden to mock tokens and implement IUniswapExchangeFactory.
contract TestUniswapBridge is
    IUniswapExchangeFactory,
    TestEventsRaiser,
    UniswapBridge
{

    TestToken public wethToken = new TestToken();
    // Token address to TestToken instance.
    mapping (address => TestToken) private _testTokens;
    // Token address to TestExchange instance.
    mapping (address => TestExchange) private _testExchanges;

    /// @dev Set token balances for this contract.
    function setTokenBalances(address tokenAddress, uint256 balance)
        external
    {
        TestToken token = _testTokens[tokenAddress];
        // Create the token if it doesn't exist.
        if (address(token) == address(0)) {
            _testTokens[tokenAddress] = token = new TestToken();
        }
        token.setBalance(address(this), balance);
    }

    /// @dev Set the behavior for a fill on a uniswap exchange.
    function setExchangeFillBehavior(
        address exchangeAddress,
        string calldata revertReason,
        uint256 fillAmount
    )
        external
        payable
    {
        createExchange(exchangeAddress).setFillBehavior.value(msg.value)(
            revertReason,
            fillAmount
        );
    }

    /// @dev Create an exchange for a token.
    function createExchange(address tokenAddress)
        public
        returns (TestExchange exchangeAddress)
    {
        TestExchange exchange = _testExchanges[tokenAddress];
        if (address(exchange) == address(0)) {
            _testExchanges[tokenAddress] = exchange = new TestExchange(tokenAddress);
        }
        return exchange;
    }

    /// @dev `IUniswapExchangeFactory.getExchange`
    function getExchange(address tokenAddress)
        external
        view
        returns (IUniswapExchange)
    {
        return IUniswapExchange(_testExchanges[tokenAddress]);
    }

    // @dev Use `wethToken`.
    function _getWethContract()
        internal
        view
        returns (IEtherToken)
    {
        return IEtherToken(address(wethToken));
    }

    // @dev This contract will double as the Uniswap contract.
    function _getUniswapExchangeFactoryContract()
        internal
        view
        returns (IUniswapExchangeFactory)
    {
        return IUniswapExchangeFactory(address(this));
    }
}
