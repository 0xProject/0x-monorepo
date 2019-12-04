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
import "@0x/contracts-utils/contracts/src/Authorizable.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "../interfaces/IERC20Bridge.sol";
import "../interfaces/IDydxBridge.sol";
import "../interfaces/IDydx.sol";


contract DydxBridge is
    IERC20Bridge,
    IDydxBridge,
    DeploymentConstants,
    Authorizable
{

    using LibSafeMath for uint256;

    /// @dev Callback for `IERC20Bridge`. Deposits or withdraws tokens from a dydx account.
    ///      Notes:
    ///         1. This bridge must be set as an operator of the dydx account that is being operated on.
    ///         2. This function may only be called in the context of the 0x Exchange executing an order
    ///            (ERC20Bridge is authorized).
    ///         3. The `from` address must be the maker and owner of the dydx account.
    ///            This signature is validated by the 0x Exchange.
    /// @param from The sender of the tokens.
    /// @param to The recipient of the tokens.
    /// @param amount Minimum amount of `toTokenAddress` tokens to buy.
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
        onlyAuthorized
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

        // Construct dydx account info.
        IDydx.AccountInfo[] memory dydxAccounts = new IDydx.AccountInfo[](1);
        dydxAccounts[0] = IDydx.AccountInfo({
            owner: from,
            number: bridgeData.accountNumber
        });

        // Create dydx action.
        IDydx.ActionArgs[] memory dydxActions = new IDydx.ActionArgs[](bridgeData.actions.length);
        for (uint256 i = 0; i < dydxActions.length; ++i) {
            BridgeAction bridgeAction = bridgeData.actions[i];
            if (bridgeAction == BridgeAction.Deposit) {
                // Compute the amount to deposit.
                // The `amount` parameter is the amount to be withdrawn. It is computed by the Exchange as:
                //  amount = floor[(takerAssetFillAmount * makerAssetAmount) / takerAssetAmount]
                // The amount to deposit is equal to to `takerFillAmount`, which we compute below as:
                //  takerAssetFillAmount ~= floor[(amount * takerAssetAmount) / makerAssetAmount]
                //                        = floor[(amount * conversionRateNumerator) / conversionRateDenominator]
                // Note that we can only approximate the original value of `takerFillAmount`. If we were to use
                // `ceil` then we would risk overestimating.
                uint256 amountToDeposit = amount
                    .safeMul(bridgeData.conversionRateNumerator)
                    .safeDiv(bridgeData.conversionRateDenominator);
                dydxActions[i] = _createDepositAction(
                    from,
                    amount,
                    bridgeData
                );
            } else if (bridgeAction == BridgeAction.Withdraw) {
                dydxActions[i] = _createWithdrawAction(
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
        }

        // Run operation. This will revert on failure.
        dydx.operate(dydxAccounts, dydxActions);
        return BRIDGE_SUCCESS;
    }

    /// @dev Returns a dydx `DepositAction`.
    /// @param depositFrom Deposit tokens from this address.
    /// @param amount of tokens to deposit.
    /// @param bridgeData A `BridgeData` struct.
    function _createDepositAction(
        address depositFrom,
        uint256 amount,
        BridgeData memory bridgeData
    )
        internal
        pure
        returns (IDydx.ActionArgs memory)
    {
        // Create dydx amount.
        IDydx.AssetAmount memory dydxAmount = IDydx.AssetAmount({
            sign: true,                                 // true if positive.
            denomination: IDydx.AssetDenomination.Wei,  // Wei => actual token amount held in account.
            ref: IDydx.AssetReference.Target,           // Target => an absolute amount.
            value: amount                               // amount to deposit.
        });

        // Create dydx deposit action.
        IDydx.ActionArgs memory depositAction = IDydx.ActionArgs({
            actionType: IDydx.ActionType.Deposit,           // deposit tokens.
            amount: dydxAmount,                             // amount to deposit.
            accountId: 0,                                   // index in the `accounts` when calling `operate`.
            primaryMarketId: bridgeData.marketId,           // indicates which token to deposit.
            otherAddress: depositFrom,                      // deposit from this address.
            // unused parameters
            secondaryMarketId: 0,
            otherAccountId: 0,
            data: hex''
        });

        return depositAction;
    }

    /// @dev Returns a dydx `WithdrawAction`.
    /// @param withdrawTo Withdraw tokens to this address.
    /// @param amount of tokens to withdraw.
    /// @param bridgeData A `BridgeData` struct.
    function _createWithdrawAction(
        address withdrawTo,
        uint256 amount,
        BridgeData memory bridgeData
    )
        internal
        pure
        returns (IDydx.ActionArgs memory)
    {
        // Create dydx amount.
        IDydx.AssetAmount memory amountToWithdraw = IDydx.AssetAmount({
            sign: true,                                     // true if positive.
            denomination: IDydx.AssetDenomination.Wei,      // Wei => actual token amount held in account.
            ref: IDydx.AssetReference.Target,               // Target => an absolute amount.
            value: amount                                   // amount to withdraw.
        });

        // Create withdraw action.
        IDydx.ActionArgs memory withdrawAction = IDydx.ActionArgs({
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

        return withdrawAction;
    }
}
