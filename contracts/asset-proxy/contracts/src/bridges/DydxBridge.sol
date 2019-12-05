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

import "@0x/contracts-utils/contracts/src/DeploymentConstants.sol";
import "../interfaces/IERC20Bridge.sol";
import "../interfaces/IDydxBridge.sol";
import "../interfaces/IDydx.sol";


contract DydxBridge is
    IERC20Bridge,
    IDydxBridge,
    DeploymentConstants
{

    /// @dev Callback for `IERC20Bridge`. Deposits or withdraws tokens from a dydx account.
    ///      Notes:
    ///         1. This bridge must be set as an operator of the input dydx account.
    ///         2. This function may only be called in the context of the 0x Exchange.
    ///         3. The maker of the 0x order must be the dydx account owner.
    ///         4. To deposit into dydx use this function in the `takerAssetData`.
    ///            (The `to` address is the 0x order maker and dydx account owner).
    ///         5. To withdraw from dydx use this function in the `makerAssetData`.
    ///            (The `from` address is the 0x order maker and dydx account owner).
    /// @param from The sender of the tokens.
    /// @param to The recipient of the tokens.
    /// @param amount Minimum amount of `toTokenAddress` tokens to deposit or withdraw.
    /// @param encodedBridgeData An abi-encoded `BridgeData` struct.
    /// @return success The magic bytes if successful.
    function bridgeTransferFrom(
        address,
        address from,
        address to,
        uint256 amount,
        bytes calldata encodedBridgeData
    )
        external
        returns (bytes4 success)
    {
        // Ensure that only the `ERC20BridgeProxy` can call this function.
        require(
            msg.sender == _getERC20BridgeProxyAddress(),
            "DydxBridge/ONLY_CALLABLE_BY_ERC20_BRIDGE_PROXY"
        );

        // Decode bridge data.
        (BridgeData memory bridgeData) = abi.decode(encodedBridgeData, (BridgeData));

        // Cache dydx contract.
        IDydx dydx = IDydx(_getDydxAddress());

        // Create dydx action.
        IDydx.AccountInfo[] memory accounts = new IDydx.AccountInfo[](1);
        IDydx.ActionArgs[] memory actions = new IDydx.ActionArgs[](1);
        if (bridgeData.action == BridgeAction.Deposit) {
            // We interpret `to` as the 0x order maker and `from` as the taker.
            accounts[0] = IDydx.AccountInfo({
                owner: to,
                number: bridgeData.accountNumber
            });

            // Deposit tokens from the `to` address into their dydx account.
            actions[0] = _createDepositAction(
                to,
                amount,
                bridgeData
            );
        } else if (bridgeData.action == BridgeAction.Withdraw) {
            // We interpret `from` as the 0x order maker and `to` as the taker.
            accounts[0] = IDydx.AccountInfo({
                owner: from,
                number: bridgeData.accountNumber
            });

            // Withdraw tokens from dydx account owned by `from` into the `to` address.
            actions[0] = _createWithdrawAction(
                to,
                amount,
                bridgeData
            );
        } else {
            // If all values in the `Action` enum are handled then this
            // revert is unreachable: Solidity will revert when casting
            // from `uint8` to `Action`.
            revert("DydxBridge/UNRECOGNIZED_BRIDGE_ACTION");
        }

        // Run operation. This will revert on failure.
        dydx.operate(accounts, actions);
        return BRIDGE_SUCCESS;
    }

    /// @dev Returns a dydx `DepositAction`.
    /// @param depositFrom Deposit tokens from this address who is also the account owner.
    /// @param amount of tokens to deposit.
    /// @param bridgeData A `BridgeData` struct.
    /// @return depositAction The encoded dydx action.
    function _createDepositAction(
        address depositFrom,
        uint256 amount,
        BridgeData memory bridgeData
    )
        internal
        pure
        returns (
            IDydx.ActionArgs memory depositAction
        )
    {
        // Create dydx amount.
        IDydx.AssetAmount memory dydxAmount = IDydx.AssetAmount({
            sign: true,                                 // true if positive.
            denomination: IDydx.AssetDenomination.Wei,  // Wei => actual token amount held in account.
            ref: IDydx.AssetReference.Target,           // Target => an absolute amount.
            value: amount                               // amount to deposit.
        });

        // Create dydx deposit action.
        depositAction = IDydx.ActionArgs({
            actionType: IDydx.ActionType.Deposit,           // deposit tokens.
            amount: dydxAmount,                             // amount to deposit.
            accountId: 0,                                   // index in the `accounts` when calling `operate`.
            primaryMarketId: bridgeData.marketId,           // indicates which token to deposit.
            otherAddress: depositFrom,                      // deposit from the account owner.
            // unused parameters
            secondaryMarketId: 0,
            otherAccountId: 0,
            data: hex''
        });
    }

    /// @dev Returns a dydx `WithdrawAction`.
    /// @param withdrawTo Withdraw tokens to this address.
    /// @param amount of tokens to withdraw.
    /// @param bridgeData A `BridgeData` struct.
    /// @return withdrawAction The encoded dydx action.
    function _createWithdrawAction(
        address withdrawTo,
        uint256 amount,
        BridgeData memory bridgeData
    )
        internal
        pure
        returns (
            IDydx.ActionArgs memory withdrawAction
        )
    {
        // Create dydx amount.
        IDydx.AssetAmount memory amountToWithdraw = IDydx.AssetAmount({
            sign: true,                                     // true if positive.
            denomination: IDydx.AssetDenomination.Wei,      // Wei => actual token amount held in account.
            ref: IDydx.AssetReference.Target,               // Target => an absolute amount.
            value: amount                                   // amount to withdraw.
        });

        // Create withdraw action.
        withdrawAction = IDydx.ActionArgs({
            actionType: IDydx.ActionType.Withdraw,          // withdraw tokens.
            amount: amountToWithdraw,                       // amount to withdraw.
            accountId: 0,                                   // index in the `accounts` when calling `operate`.
            primaryMarketId: bridgeData.marketId,           // indicates which token to withdraw.
            otherAddress: withdrawTo,                       // withdraw tokens to this address.
            // unused parameters
            secondaryMarketId: 0,
            otherAccountId: 0,
            data: hex''
        });
    }
}
