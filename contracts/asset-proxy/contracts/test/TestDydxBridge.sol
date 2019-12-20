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
import "../src/bridges/DydxBridge.sol";


contract TestDydxBridgeToken {

    uint256 private constant INIT_HOLDER_BALANCE = 10 * 10**18; // 10 tokens
    mapping (address => uint256) private _balances;

    /// @dev Sets initial balance of token holders.
    constructor(address[] memory holders)
        public
    {
        for (uint256 i = 0; i != holders.length; ++i) {
            _balances[holders[i]] = INIT_HOLDER_BALANCE;
        }
        _balances[msg.sender] = INIT_HOLDER_BALANCE;
    }

    /// @dev Basic transferFrom implementation.
    function transferFrom(address from, address to, uint256 amount)
        external
        returns (bool)
    {
        if (_balances[from] < amount || _balances[to] + amount < _balances[to]) {
            return false;
        }
        _balances[from] -= amount;
        _balances[to] += amount;
        return true;
    }

    /// @dev Returns balance of `holder`.
    function balanceOf(address holder)
        external
        view
        returns (uint256)
    {
        return _balances[holder];
    }
}


// solhint-disable space-after-comma
contract TestDydxBridge is
    IDydx,
    DydxBridge
{

    address private constant ALWAYS_REVERT_ADDRESS = address(1);
    address private _testTokenAddress;
    bool private _shouldRevertOnOperate;

    event OperateAccount(
        address owner,
        uint256 number
    );

    event OperateAction(
        ActionType actionType,
        uint256 accountId,
        bool amountSign,
        AssetDenomination amountDenomination,
        AssetReference amountRef,
        uint256 amountValue,
        uint256 primaryMarketId,
        uint256 secondaryMarketId,
        address otherAddress,
        uint256 otherAccountId,
        bytes data
    );

    constructor(address[] memory holders)
        public
    {
        // Deploy a test token. This represents the asset being deposited/withdrawn from dydx.
        _testTokenAddress = address(new TestDydxBridgeToken(holders));
    }

    /// @dev Simulates `operate` in dydx contract.
    ///      Emits events so that arguments can be validated client-side.
    function operate(
        AccountInfo[] calldata accounts,
        ActionArgs[] calldata actions
    )
        external
    {
        if (_shouldRevertOnOperate) {
            revert("TestDydxBridge/SHOULD_REVERT_ON_OPERATE");
        }

        for (uint i = 0; i < accounts.length; ++i) {
            emit OperateAccount(
                accounts[i].owner,
                accounts[i].number
            );
        }

        for (uint i = 0; i < actions.length; ++i) {
            emit OperateAction(
                actions[i].actionType,
                actions[i].accountId,
                actions[i].amount.sign,
                actions[i].amount.denomination,
                actions[i].amount.ref,
                actions[i].amount.value,
                actions[i].primaryMarketId,
                actions[i].secondaryMarketId,
                actions[i].otherAddress,
                actions[i].otherAccountId,
                actions[i].data
            );

            if (actions[i].actionType == IDydx.ActionType.Withdraw) {
                require(
                    IERC20Token(_testTokenAddress).transferFrom(
                        address(this),
                        actions[i].otherAddress,
                        actions[i].amount.value
                    ),
                    "TestDydxBridge/WITHDRAW_FAILED"
                );
            } else if (actions[i].actionType == IDydx.ActionType.Deposit) {
                require(
                    IERC20Token(_testTokenAddress).transferFrom(
                        actions[i].otherAddress,
                        address(this),
                        actions[i].amount.value
                    ),
                    "TestDydxBridge/DEPOSIT_FAILED"
                );
            } else {
                revert("TestDydxBridge/UNSUPPORTED_ACTION");
            }
        }
    }

    /// @dev If `true` then subsequent calls to `operate` will revert.
    function setRevertOnOperate(bool shouldRevert)
        external
    {
        _shouldRevertOnOperate = shouldRevert;
    }

    /// @dev Returns test token.
    function getTestToken()
        external
        returns (address)
    {
        return _testTokenAddress;
    }

    /// @dev overrides `_getDydxAddress()` from `DeploymentConstants` to return this address.
    function _getDydxAddress()
        internal
        view
        returns (address)
    {
        return address(this);
    }

    /// @dev overrides `_getERC20BridgeProxyAddress()` from `DeploymentConstants` for testing.
    function _getERC20BridgeProxyAddress()
        internal
        view
        returns (address)
    {
        return msg.sender == ALWAYS_REVERT_ADDRESS ? address(0) : msg.sender;
    }
}