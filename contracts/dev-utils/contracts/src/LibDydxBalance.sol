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

pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "@0x/contracts-asset-proxy/contracts/src/interfaces/IAssetData.sol";
import "@0x/contracts-asset-proxy/contracts/src/interfaces/IDydxBridge.sol";
import "@0x/contracts-asset-proxy/contracts/src/interfaces/IDydx.sol";
import "@0x/contracts-erc20/contracts/src/LibERC20Token.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "@0x/contracts-utils/contracts/src/D18.sol";
import "./LibAssetData.sol";


library LibDydxBalance {

    using LibBytes for bytes;
    using LibSafeMath for uint256;

    /// @dev Padding % added to the minimum collateralization ratio to
    ///      prevent withdrawing exactly the amount that would make an account
    ///      insolvent. 1 bps.
    int256 private constant MARGIN_RATIO_PADDING = 0.0001e18;

    /// @dev Structure that holds all pertinent info needed to perform a balance
    ///      check.
    struct BalanceCheckInfo {
        IDydx dydx;
        address bridgeAddress;
        address makerAddress;
        address makerTokenAddress;
        address takerTokenAddress;
        int256 orderMakerToTakerRate;
        uint256[] accounts;
        IDydxBridge.BridgeAction[] actions;
    }

    /// @dev Gets the maker asset allowance for a Dydx bridge order.
    /// @param makerAddress The maker of the order.
    /// @param bridgeAddress The address of the Dydx bridge.
    /// @param dydx The Dydx contract address.
    /// @return allowance The maker asset allowance.
    function getDydxMakerAllowance(address makerAddress, address bridgeAddress, address dydx)
        public
        view
        returns (uint256 allowance)
    {
        // Allowance is infinite if the dydx bridge is an operator for the maker.
        return IDydx(dydx).getIsLocalOperator(makerAddress, bridgeAddress)
            ? uint256(-1) : 0;
    }

    /// @dev Gets the maker allowance for a
    /// @dev Get the maker asset balance of an order with a `DydxBridge` maker asset.
    /// @param order An order with a dydx maker asset.
    /// @param dydx The address of the dydx contract.
    /// @return balance The maker asset balance.
    function getDydxMakerBalance(LibOrder.Order memory order, address dydx)
        public
        view
        returns (uint256 balance)
    {
        BalanceCheckInfo memory info = _getBalanceCheckInfo(order, dydx);
        // Actions must be well-formed.
        if (!_areActionsWellFormed(info)) {
            return 0;
        }
        // If the rate we withdraw maker tokens is less than one, the asset
        // proxy will throw because we will always transfer less maker tokens
        // than asked.
        if (_getMakerTokenWithdrawRate(info) < D18.one()) {
            return 0;
        }
        // The maker balance is the smaller of:
        return LibSafeMath.min256(
            // How many times we can execute all the deposit actions.
            _getDepositableMakerAmount(info),
            // How many times we can execute all the actions before the an
            // account becomes undercollateralized.
            _getSolventMakerAmount(info)
        );
    }

    /// @dev Checks that:
    ///      1. Actions are arranged as [...deposits, withdraw].
    ///      2. There is only one deposit for each market ID.
    ///      3. Every action has a valid account index.
    ///      4. There is exactly one withdraw at the end and it is for the
    ///         maker token.
    /// @param info State from `_getBalanceCheckInfo()`.
    /// @return areWellFormed Whether the actions are well-formed.
    function _areActionsWellFormed(BalanceCheckInfo memory info)
        internal
        view
        returns (bool areWellFormed)
    {
        if (info.actions.length == 0) {
            return false;
        }
        uint256 depositCount = 0;
        // Count the number of deposits.
        for (; depositCount < info.actions.length; ++depositCount) {
            IDydxBridge.BridgeAction memory action = info.actions[depositCount];
            if (action.actionType != IDydxBridge.BridgeActionType.Deposit) {
                break;
            }
            // Search all prior actions for the same market ID.
            uint256 marketId = action.marketId;
            for (uint256 j = 0; j < depositCount; ++j) {
                if (info.actions[j].marketId == marketId) {
                    // Market ID is not unique.
                    return false;
                }
            }
            // Check that the account index is within the valid range.
            if (action.accountIdx >= info.accounts.length) {
                return false;
            }
        }
        // There must be exactly one withdraw action at the end.
        if (depositCount + 1 != info.actions.length) {
            return false;
        }
        IDydxBridge.BridgeAction memory withdraw = info.actions[depositCount];
        if (withdraw.actionType != IDydxBridge.BridgeActionType.Withdraw) {
            return false;
        }
        // And it must be for the maker token.
        if (info.dydx.getMarketTokenAddress(withdraw.marketId) != info.makerTokenAddress) {
            return false;
        }
        // Check the account index.
        return withdraw.accountIdx < info.accounts.length;
    }

    /// @dev Returns the rate at which we withdraw maker tokens.
    /// @param info State from `_getBalanceCheckInfo()`.
    /// @return makerTokenWithdrawRate Maker token withdraw rate.
    function _getMakerTokenWithdrawRate(BalanceCheckInfo memory info)
        internal
        pure
        returns (int256 makerTokenWithdrawRate)
    {
        // The last action is always a withdraw for the maker token.
        IDydxBridge.BridgeAction memory withdraw = info.actions[info.actions.length - 1];
        return _getActionRate(withdraw);
    }

    /// @dev Get how much maker asset we can transfer before a deposit fails.
    /// @param info State from `_getBalanceCheckInfo()`.
    function _getDepositableMakerAmount(BalanceCheckInfo memory info)
        internal
        view
        returns (uint256 depositableMakerAmount)
    {
        depositableMakerAmount = uint256(-1);
        // Take the minimum maker amount from all deposits.
        for (uint256 i = 0; i < info.actions.length; ++i) {
            IDydxBridge.BridgeAction memory action = info.actions[i];
            // Only looking at deposit actions.
            if (action.actionType != IDydxBridge.BridgeActionType.Deposit) {
                continue;
            }
            // `depositRate` is the rate at which we convert a maker token into
            // a taker token for deposit.
            int256 depositRate = _getActionRate(action);
            // Taker tokens will be transferred to the maker for every fill, so
            // we reduce the effective deposit rate if we're depositing the taker
            // token.
            address depositToken = info.dydx.getMarketTokenAddress(action.marketId);
            if (info.takerTokenAddress != address(0) && depositToken == info.takerTokenAddress) {
                depositRate = D18.sub(depositRate, info.orderMakerToTakerRate);
            }
            // If the deposit rate is > 0, we are limited by the transferrable
            // token balance of the maker.
            if (depositRate > 0) {
                uint256 supply = _getTransferabeTokenAmount(
                    depositToken,
                    info.makerAddress,
                    address(info.dydx)
                );
                depositableMakerAmount = LibSafeMath.min256(
                    depositableMakerAmount,
                    uint256(D18.div(supply, depositRate))
                );
            }
        }
    }

    /// @dev Get how much maker asset we can transfer before an account
    ///      becomes insolvent.
    /// @param info State from `_getBalanceCheckInfo()`.
    function _getSolventMakerAmount(BalanceCheckInfo memory info)
        internal
        view
        returns (uint256 solventMakerAmount)
    {
        solventMakerAmount = uint256(-1);
        assert(info.actions.length >= 1);
        IDydxBridge.BridgeAction memory withdraw = info.actions[info.actions.length - 1];
        assert(withdraw.actionType == IDydxBridge.BridgeActionType.Withdraw);
        int256 minCr = D18.add(_getMinimumCollateralizationRatio(info.dydx), MARGIN_RATIO_PADDING);
        // Loop through the accounts.
        for (uint256 accountIdx = 0; accountIdx < info.accounts.length; ++accountIdx) {
            (uint256 supplyValue, uint256 borrowValue) =
                _getAccountMarketValues(info, info.accounts[accountIdx]);
            // All accounts must currently be solvent.
            if (borrowValue != 0 && D18.div(supplyValue, borrowValue) < minCr) {
                return 0;
            }
            // If this is the same account used to in the withdraw/borrow action,
            // compute the maker amount at which it will become insolvent.
            if (accountIdx != withdraw.accountIdx) {
                continue;
            }
            // Compute the deposit/collateralization rate, which is the rate at
            // which (USD) value is added to the account across all markets.
            int256 dd = 0;
            for (uint256 i = 0; i < info.actions.length - 1; ++i) {
                IDydxBridge.BridgeAction memory deposit = info.actions[i];
                assert(deposit.actionType == IDydxBridge.BridgeActionType.Deposit);
                if (deposit.accountIdx == accountIdx) {
                    dd = D18.add(
                        dd,
                        _getActionRateValue(
                            info,
                            deposit
                        )
                    );
                }
            }
            // Compute the borrow/withdraw rate, which is the rate at which
            // (USD) value is deducted from the account.
            int256 db = _getActionRateValue(
                info,
                withdraw
            );
            // If the deposit to withdraw ratio is >= the minimum collateralization
            // ratio, then we will never become insolvent at these prices.
            if (D18.div(dd, db) >= minCr) {
                continue;
            }
            // If the adjusted deposit rates are equal, the account will remain
            // at the same level of collateralization.
            if (D18.mul(minCr, db) == dd) {
                continue;
            }
            // The collateralization ratio for this account, parameterized by
            // `t` (maker amount), is given by:
            //      `cr = (supplyValue + t * dd) / (borrowValue + t * db)`
            // Solving for `t` gives us:
            //      `t = (supplyValue - cr * borrowValue) / (cr * db - dd)`
            int256 t = D18.div(
                D18.sub(supplyValue, D18.mul(minCr, borrowValue)),
                D18.sub(D18.mul(minCr, db), dd)
            );
            solventMakerAmount = LibSafeMath.min256(
                solventMakerAmount,
                // `t` is in maker token units, so convert it to maker wei.
                _toWei(info.makerTokenAddress, uint256(D18.clip(t)))
            );
        }
    }

    /// @dev Create a `BalanceCheckInfo` struct.
    /// @param order An order with a `DydxBridge` maker asset.
    /// @param dydx The address of the Dydx contract.
    /// @return info The `BalanceCheckInfo` struct.
    function _getBalanceCheckInfo(LibOrder.Order memory order, address dydx)
        private
        pure
        returns (BalanceCheckInfo memory info)
    {
        bytes memory rawBridgeData;
        (, info.makerTokenAddress, info.bridgeAddress, rawBridgeData) =
            LibAssetData.decodeERC20BridgeAssetData(order.makerAssetData);
        info.dydx = IDydx(dydx);
        info.makerAddress = order.makerAddress;
        if (order.takerAssetData.length == 36) {
            if (order.takerAssetData.readBytes4(0) == IAssetData(0).ERC20Token.selector) {
                (, info.takerTokenAddress) =
                    LibAssetData.decodeERC20AssetData(order.takerAssetData);
            }
        }
        info.orderMakerToTakerRate = D18.div(order.takerAssetAmount, order.makerAssetAmount);
        (IDydxBridge.BridgeData memory bridgeData) =
            abi.decode(rawBridgeData, (IDydxBridge.BridgeData));
        info.accounts = bridgeData.accountNumbers;
        info.actions = bridgeData.actions;
    }

    /// @dev Returns the conversion rate for an action.
    /// @param action A `BridgeAction`.
    function _getActionRate(IDydxBridge.BridgeAction memory action)
        private
        pure
        returns (int256 rate)
    {
        rate = action.conversionRateDenominator == 0
            ? D18.one()
            : D18.div(
                action.conversionRateNumerator,
                action.conversionRateDenominator
            );
    }

    /// @dev Returns the USD value of an action based on its conversion rate
    ///      and market prices.
    /// @param info State from `_getBalanceCheckInfo()`.
    /// @param action A `BridgeAction`.
    function _getActionRateValue(
        BalanceCheckInfo memory info,
        IDydxBridge.BridgeAction memory action
    )
        private
        view
        returns (int256 value)
    {
        address toToken = info.dydx.getMarketTokenAddress(action.marketId);
        uint256 fromTokenDecimals = LibERC20Token.decimals(info.makerTokenAddress);
        uint256 toTokenDecimals = LibERC20Token.decimals(toToken);
        // First express the rate as 18-decimal units.
        value = toTokenDecimals > fromTokenDecimals
            ? int256(
                uint256(_getActionRate(action))
                    .safeDiv(10 ** (toTokenDecimals - fromTokenDecimals))
            )
            : int256(
                uint256(_getActionRate(action))
                    .safeMul(10 ** (fromTokenDecimals - toTokenDecimals))
            );
        // Prices have 18 + (18 - TOKEN_DECIMALS) decimal places because
        // consistency is stupid.
        uint256 price = info.dydx.getMarketPrice(action.marketId).value;
        // Make prices have 18 decimals.
        if (toTokenDecimals > 18) {
            price = price.safeMul(10 ** (toTokenDecimals - 18));
        } else {
            price = price.safeDiv(10 ** (18 - toTokenDecimals));
        }
        // The action value is the action rate times the price.
        value = D18.mul(price, value);
        // Scale by the market premium.
        int256 marketPremium = D18.add(
            D18.one(),
            info.dydx.getMarketMarginPremium(action.marketId).value
        );
        if (action.actionType == IDydxBridge.BridgeActionType.Deposit) {
            value = D18.div(value, marketPremium);
        } else {
            value = D18.mul(value, marketPremium);
        }
    }

    /// @dev Convert a `D18` fraction of 1 token to the equivalent integer wei.
    /// @param token Address the of the token.
    /// @param units Token units expressed with 18 digit precision.
    function _toWei(address token, uint256 units)
        private
        view
        returns (uint256 rate)
    {
        uint256 decimals = LibERC20Token.decimals(token);
        rate = decimals > 18
            ? units.safeMul(10 ** (decimals - 18))
            : units.safeDiv(10 ** (18 - decimals));
    }

    /// @dev Get the global minimum collateralization ratio required for
    ///      an account to be considered solvent.
    /// @param dydx The Dydx interface.
    function _getMinimumCollateralizationRatio(IDydx dydx)
        private
        view
        returns (int256 ratio)
    {
        IDydx.RiskParams memory riskParams = dydx.getRiskParams();
        return D18.add(D18.one(), D18.toSigned(riskParams.marginRatio.value));
    }

    /// @dev Get the total supply and borrow values for an account across all markets.
    /// @param info State from `_getBalanceCheckInfo()`.
    /// @param account The Dydx account identifier.
    function _getAccountMarketValues(BalanceCheckInfo memory info, uint256 account)
        private
        view
        returns (uint256 supplyValue, uint256 borrowValue)
    {
        (IDydx.Value memory supplyValue_, IDydx.Value memory borrowValue_) =
            info.dydx.getAdjustedAccountValues(IDydx.AccountInfo(
                info.makerAddress,
                account
            ));
        // Account values have 36 decimal places because dydx likes to make sure
        // you're paying attention.
        return (supplyValue_.value / 1e18, borrowValue_.value / 1e18);
    }

    /// @dev Get the amount of an ERC20 token held by `owner` that can be transferred
    ///      by `spender`.
    /// @param tokenAddress The address of the ERC20 token.
    /// @param owner The address of the token holder.
    /// @param spender The address of the token spender.
    function _getTransferabeTokenAmount(
        address tokenAddress,
        address owner,
        address spender
    )
        private
        view
        returns (uint256 transferableAmount)
    {
        return LibSafeMath.min256(
            LibERC20Token.allowance(tokenAddress, owner, spender),
            LibERC20Token.balanceOf(tokenAddress, owner)
        );
    }
}
