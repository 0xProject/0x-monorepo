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
import "../src/bridges/KyberBridge.sol";
import "../src/interfaces/IKyberNetworkProxy.sol";


// solhint-disable no-simple-event-func-name
interface ITestContract {

    function wethWithdraw(
        address payable ownerAddress,
        uint256 amount
    )
        external;

    function wethDeposit(
        address ownerAddress
    )
        external
        payable;

    function tokenTransfer(
        address ownerAddress,
        address recipientAddress,
        uint256 amount
    )
        external
        returns (bool success);

    function tokenApprove(
        address ownerAddress,
        address spenderAddress,
        uint256 allowance
    )
        external
        returns (bool success);

    function tokenBalanceOf(
        address ownerAddress
    )
        external
        view
        returns (uint256 balance);
}


/// @dev A minimalist ERC20/WETH token.
contract TestToken {

    ITestContract private _testContract;

    constructor() public {
        _testContract = ITestContract(msg.sender);
    }

    function approve(address spender, uint256 allowance)
        external
        returns (bool)
    {
        return _testContract.tokenApprove(
            msg.sender,
            spender,
            allowance
        );
    }

    function transfer(address recipient, uint256 amount)
        external
        returns (bool)
    {
        return _testContract.tokenTransfer(
            msg.sender,
            recipient,
            amount
        );
    }

    function withdraw(uint256 amount)
        external
    {
        return _testContract.wethWithdraw(msg.sender, amount);
    }

    function deposit()
        external
        payable
    {
        return _testContract.wethDeposit.value(msg.value)(msg.sender);
    }

    function balanceOf(address owner)
        external
        view
        returns (uint256)
    {
        return _testContract.tokenBalanceOf(owner);
    }
}


/// @dev Eth2DaiBridge overridden to mock tokens and
///      implement IEth2Dai.
contract TestKyberBridge is
    KyberBridge,
    ITestContract,
    IKyberNetworkProxy
{
    event KyberBridgeTrade(
        uint256 msgValue,
        address sellTokenAddress,
        uint256 sellAmount,
        address buyTokenAddress,
        address payable recipientAddress,
        uint256 maxBuyTokenAmount,
        uint256 minConversionRate,
        address walletId
    );

    event KyberBridgeWethWithdraw(
        address ownerAddress,
        uint256 amount
    );

    event KyberBridgeWethDeposit(
        uint256 msgValue,
        address ownerAddress,
        uint256 amount
    );

    event KyberBridgeTokenApprove(
        address tokenAddress,
        address ownerAddress,
        address spenderAddress,
        uint256 allowance
    );

    event KyberBridgeTokenTransfer(
        address tokenAddress,
        address ownerAddress,
        address recipientAddress,
        uint256 amount
    );

    IEtherToken public weth;
    mapping (address => mapping (address => uint256)) private _tokenBalances;
    uint256 private _nextFillAmount;

    constructor() public {
        weth = IEtherToken(address(new TestToken()));
    }

    /// @dev Implementation of `IKyberNetworkProxy.trade()`
    function trade(
        address sellTokenAddress,
        uint256 sellAmount,
        address buyTokenAddress,
        address payable recipientAddress,
        uint256 maxBuyTokenAmount,
        uint256 minConversionRate,
        address walletId
    )
        external
        payable
        returns(uint256 boughtAmount)
    {
        emit KyberBridgeTrade(
            msg.value,
            sellTokenAddress,
            sellAmount,
            buyTokenAddress,
            recipientAddress,
            maxBuyTokenAmount,
            minConversionRate,
            walletId
        );
        return _nextFillAmount;
    }

    function createToken()
        external
        returns (address tokenAddress)
    {
        return address(new TestToken());
    }

    function setNextFillAmount(uint256 amount)
        external
        payable
    {
        if (msg.value != 0) {
            require(amount == msg.value, "VALUE_AMOUNT_MISMATCH");
            grantTokensTo(address(weth), address(this), msg.value);
        }
        _nextFillAmount = amount;
    }

    function wethDeposit(
        address ownerAddress
    )
        external
        payable
    {
        require(msg.sender == address(weth), "ONLY_WETH");
        grantTokensTo(address(weth), ownerAddress, msg.value);
        emit KyberBridgeWethDeposit(
            msg.value,
            ownerAddress,
            msg.value
        );
    }

    function wethWithdraw(
        address payable ownerAddress,
        uint256 amount
    )
        external
    {
        require(msg.sender == address(weth), "ONLY_WETH");
        _tokenBalances[address(weth)][ownerAddress] -= amount;
        if (ownerAddress != address(this)) {
            ownerAddress.transfer(amount);
        }
        emit KyberBridgeWethWithdraw(
            ownerAddress,
            amount
        );
    }

    function tokenApprove(
        address ownerAddress,
        address spenderAddress,
        uint256 allowance
    )
        external
        returns (bool success)
    {
        emit KyberBridgeTokenApprove(
            msg.sender,
            ownerAddress,
            spenderAddress,
            allowance
        );
        return true;
    }

    function tokenTransfer(
        address ownerAddress,
        address recipientAddress,
        uint256 amount
    )
        external
        returns (bool success)
    {
        _tokenBalances[msg.sender][ownerAddress] -= amount;
        _tokenBalances[msg.sender][recipientAddress] += amount;
        emit KyberBridgeTokenTransfer(
            msg.sender,
            ownerAddress,
            recipientAddress,
            amount
        );
        return true;
    }

    function tokenBalanceOf(
        address ownerAddress
    )
        external
        view
        returns (uint256 balance)
    {
        return _tokenBalances[msg.sender][ownerAddress];
    }

    function grantTokensTo(address tokenAddress, address ownerAddress, uint256 amount)
        public
        payable
    {
        _tokenBalances[tokenAddress][ownerAddress] += amount;
        if (tokenAddress != address(weth)) {
            // Send back ether if not WETH.
            msg.sender.transfer(msg.value);
        } else {
            require(msg.value == amount, "VALUE_AMOUNT_MISMATCH");
        }
    }

    // @dev overridden to point to this contract.
    function _getKyberContract()
        internal
        view
        returns (IKyberNetworkProxy kyber)
    {
        return IKyberNetworkProxy(address(this));
    }

    // @dev overridden to point to test WETH.
    function _getWETHContract()
        internal
        view
        returns (IEtherToken weth_)
    {
        return weth;
    }
}
