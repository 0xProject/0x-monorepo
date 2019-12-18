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

import "../src/bridges/DydxBridge.sol";


// solhint-disable space-after-comma
contract TestDydxBridge is
    IDydx,
    DydxBridge
{

    address private constant ALWAYS_REVERT_ADDRESS = address(1);
    mapping (address => uint256) private balances;
    bool private shouldRevertOnOperate;

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

    /// @dev Simulates `operate` in dydx contract.
    ///      Emits events so that arguments can be validated client-side.
    function operate(
        AccountInfo[] calldata accounts,
        ActionArgs[] calldata actions
    )
        external
    {
        if (shouldRevertOnOperate) {
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
                balances[actions[i].otherAddress] += actions[i].amount.value;
            } else if (actions[i].actionType == IDydx.ActionType.Deposit) {
                balances[actions[i].otherAddress] -= actions[i].amount.value;
            } else {
                revert("TestDydxBridge/UNSUPPORTED_ACTION");
            }
        }
    }

    /// @dev If `true` then subsequent calls to `operate` will revert.
    function setRevertOnOperate(bool shouldRevert)
        external
    {
        shouldRevertOnOperate = shouldRevert;
    }

    /// @dev Returns balance of `holder`.
    function balanceOf(address holder)
        external
        view
        returns (uint256)
    {
        return balances[holder];
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