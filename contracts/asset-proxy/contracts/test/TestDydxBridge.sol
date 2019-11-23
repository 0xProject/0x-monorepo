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

    address public accountOperator;

    constructor(address _accountOperator)
        public
        DydxBridge()
    {
        accountOperator = _accountOperator;
    }

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
        }
    }

    /// @dev Return true iff `operator` equals `accountOperator` in state.
    function getIsLocalOperator(
        address /* owner */,
        address operator
    )
        external
        view
        returns (bool)
    {
        return operator == accountOperator;
    }

    /// @dev overrides `_getDydxAddress()` from `DeploymentConstants` to return this address.
    function _getDydxAddress()
        internal
        view
        returns (address)
    {
        return address(this);
    }
}