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


// solhint-disable no-simple-event-func-name
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

    event WethDeposit(
        uint256 amount
    );

    event WethWithdraw(
        uint256 amount
    );

    event EthToTokenTransferInput(
        address exchange,
        uint256 minTokensBought,
        uint256 deadline,
        address recipient
    );

    event TokenToEthSwapInput(
        address exchange,
        uint256 tokensSold,
        uint256 minEthBought,
        uint256 deadline
    );

    event TokenToTokenTransferInput(
        address exchange,
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
            msg.sender,
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
            msg.sender,
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
            msg.sender,
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
    string private _nextRevertReason;

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

    /// @dev Just calls `raiseTokenTransfer()` on the caller.
    function transfer(address to, uint256 amount)
        external
        returns (bool)
    {
        _revertIfReasonExists();
        TestEventsRaiser(msg.sender).raiseTokenTransfer(msg.sender, to, amount);
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

    /// @dev `IWETH.deposit()` that increases balances and calls
    ///     `raiseWethDeposit()` on the caller.
    function deposit()
        external
        payable
    {
        _revertIfReasonExists();
        balances[msg.sender] += balances[msg.sender].safeAdd(msg.value);
        TestEventsRaiser(msg.sender).raiseWethDeposit(msg.value);
    }

    /// @dev `IWETH.withdraw()` that just reduces balances and calls
    ///       `raiseWethWithdraw()` on the caller.
    function withdraw(uint256 amount)
        external
    {
        _revertIfReasonExists();
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

    function _revertIfReasonExists()
        private
        view
    {
        if (bytes(_nextRevertReason).length != 0) {
            revert(_nextRevertReason);
        }
    }
}


contract TestExchange is
    IUniswapExchange
{
    address public tokenAddress;
    string private _nextRevertReason;

    constructor(address _tokenAddress) public {
        tokenAddress = _tokenAddress;
    }

    function setFillBehavior(
        string calldata revertReason
    )
        external
        payable
    {
        _nextRevertReason = revertReason;
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
        return address(this).balance;
    }

    function tokenToEthSwapInput(
        uint256 tokensSold,
        uint256 minEthBought,
        uint256 deadline
    )
        external
        returns (uint256 ethBought)
    {
        TestEventsRaiser(msg.sender).raiseTokenToEthSwapInput(
            tokensSold,
            minEthBought,
            deadline
        );
        _revertIfReasonExists();
        uint256 fillAmount = address(this).balance;
        msg.sender.transfer(fillAmount);
        return fillAmount;
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
        return address(this).balance;
    }

    function toTokenAddress()
        external
        view
        returns (address _tokenAddress)
    {
        return tokenAddress;
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


/// @dev UniswapBridge overridden to mock tokens and implement IUniswapExchangeFactory.
contract TestUniswapBridge is
    IUniswapExchangeFactory,
    TestEventsRaiser,
    UniswapBridge
{
    TestToken public wethToken;
    // Token address to TestToken instance.
    mapping (address => TestToken) private _testTokens;
    // Token address to TestExchange instance.
    mapping (address => TestExchange) private _testExchanges;

    constructor() public {
        wethToken = new TestToken();
        _testTokens[address(wethToken)] = wethToken;
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

    /// @dev Create a token and exchange (if they don't exist) for a new token
    ///      and sets the exchange revert and fill behavior. The wei attached
    ///      will be the fill amount for the exchange.
    /// @param tokenAddress The token address. If zero, one will be created.
    /// @param revertReason The revert reason for exchange operations.
    function createTokenAndExchange(
        address tokenAddress,
        string calldata revertReason
    )
        external
        payable
        returns (TestToken token, TestExchange exchange)
    {
        token = TestToken(tokenAddress);
        if (tokenAddress == address(0)) {
            token = new TestToken();
        }
        _testTokens[address(token)] = token;
        exchange = _testExchanges[address(token)];
        if (address(exchange) == address(0)) {
            _testExchanges[address(token)] = exchange = new TestExchange(address(token));
        }
        exchange.setFillBehavior.value(msg.value)(revertReason);
        return (token, exchange);
    }

    /// @dev `IUniswapExchangeFactory.getExchange`
    function getExchange(address tokenAddress)
        external
        view
        returns (address)
    {
        return address(_testExchanges[tokenAddress]);
    }

    // @dev Use `wethToken`.
    function _getWethAddress()
        internal
        view
        returns (address)
    {
        return address(wethToken);
    }

    // @dev This contract will double as the Uniswap contract.
    function _getUniswapExchangeFactoryAddress()
        internal
        view
        returns (address)
    {
        return address(this);
    }
}
