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
import "../src/bridges/BancorBridge.sol";
import "../src/interfaces/IBancorNetwork.sol";


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

    event ConvertByPathInput(
        uint amountIn,
        uint amountOutMin,
        address toTokenAddress,
        address to,
        address feeRecipient,
        uint256 feeAmount
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

    function raiseConvertByPathInput(
        uint amountIn,
        uint amountOutMin,
        address toTokenAddress,
        address to,
        address feeRecipient,
        uint256 feeAmount
    ) external
    {
        emit ConvertByPathInput(
            amountIn,
            amountOutMin,
            toTokenAddress,
            to,
            feeRecipient,
            feeAmount
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


/// @dev Mock the BancorNetwork contract
contract TestBancorNetwork is
    IBancorNetwork
{
    string private _nextRevertReason;

    /// @dev Set the revert reason for `swapExactTokensForTokens`.
    function setRevertReason(string calldata reason)
        external
    {
        _nextRevertReason = reason;
    }

    function convertByPath(
        address[] calldata _path,
        uint256 _amount,
        uint256 _minReturn,
        address _beneficiary,
        address _affiliateAccount,
        uint256 _affiliateFee
    ) external payable returns (uint256)
    {
        _revertIfReasonExists();

        TestEventsRaiser(msg.sender).raiseConvertByPathInput(
            // tokens sold
            _amount,
            // tokens bought
            _minReturn,
            // output token
            _path[_path.length - 1],
            // recipient
            _beneficiary,
            // fee recipient
            _affiliateAccount,
            // fee amount
            _affiliateFee
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


/// @dev BancorBridge overridden to mock tokens and BancorNetwork
contract TestBancorBridge is
    BancorBridge,
    TestEventsRaiser
{

    // Token address to TestToken instance.
    mapping (address => TestToken) private _testTokens;
    // TestRouter instance.
    TestBancorNetwork private _testNetwork;

    constructor() public {
        _testNetwork = new TestBancorNetwork();
    }

    function setNetworkRevertReason(string calldata revertReason)
        external
    {
        _testNetwork.setRevertReason(revertReason);
    }

    /// @dev Sets the balance of this contract for an existing token.
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

    function getNetworkAddress()
        external
        view
        returns (address)
    {
        return address(_testNetwork);
    }

}
