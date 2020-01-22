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
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-utils/contracts/src/LibFractions.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "./LibAssetData.sol";


// solhint-disable separate-by-one-line-in-contract
library LibDydxBalance {

    using LibBytes for bytes;
    using LibSafeMath for uint256;

    /// @dev Base units for dydx value quantities.
    uint256 private constant DYDX_UNITS_BASE = 10 ** 18;

    /// @dev A fraction/rate.
    struct Fraction {
        uint256 n;
        uint256 d;
    }

    /// @dev Structure that holds all pertinent info needed to perform a balance
    ///      check.
    struct BalanceCheckInfo {
        IDydx dydx;
        address bridgeAddress;
        address makerAddress;
        address makerTokenAddress;
        address takerTokenAddress;
        uint256 makerAssetAmount;
        uint256 takerAssetAmount;
        uint256[] accounts;
        IDydxBridge.BridgeAction[] actions;
    }

    /// @dev Get the maker asset balance of an order with a `DydxBridge` maker asset.
    /// @param order An order with a dydx maker asset.
    /// @param dydx The address of the dydx contract.
    /// @return balance The maker asset balance.
    function getDydxMakerBalance(LibOrder.Order memory order, address dydx)
        public
        returns (uint256 balance)
    {
        BalanceCheckInfo memory info = _getBalanceCheckInfo(order, dydx);
        // The Dydx bridge must be an operator for the maker.
        if (!info.dydx.getIsLocalOperator(info.makerAddress, address(info.dydx))) {
            return 0;
        }
        // Actions must be well-formed.
        if (!_areActionsWellFormed(info)) {
            return 0;
        }
        // If we withdraw maker tokens at rate < 1, the asset proxy will
        // throw because we will always transfer less maker tokens than required.
        if (_ltf(_getMakerTokenWithdrawRate(info), Fraction(1, 1))) {
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
            if (action.accountId >= info.accounts.length) {
                return false;
            }
        }
        // There must be exactly one withdraw action at the end.
        if (depositCount + 1 != info.actions.length) {
            return false;
        }
        IDydxBridge.BridgeAction memory withdraw = info.actions[depositCount + 1];
        if (withdraw.actionType != IDydxBridge.BridgeActionType.Withdraw) {
            return false;
        }
        // And it must be for the maker token.
        if (info.dydx.getMarketTokenAddress(withdraw.marketId) != info.makerTokenAddress) {
            return false;
        }
        // Check the account index.
        return withdraw.accountId < info.accounts.length;
    }

    /// @dev Returns the rate at which we withdraw maker tokens.
    /// @param info State from `_getBalanceCheckInfo()`.
    /// @return makerTokenWithdrawRate Maker token withdraw rate.
    function _getMakerTokenWithdrawRate(BalanceCheckInfo memory info)
        internal
        view
        returns (Fraction memory makerTokenWithdrawRate)
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
        depositableMakerAmount = info.makerAssetAmount;
        // The conversion rate from maker -> taker.
        Fraction memory makerToTakerRate = Fraction(
            info.takerAssetAmount,
            info.makerAssetAmount
        );
        // Take the minimum maker amount from all deposits.
        for (uint256 i = 0; i < info.actions.length; ++i) {
            IDydxBridge.BridgeAction memory action = info.actions[i];
            // Must be a deposit action.
            if (action.actionType != IDydxBridge.BridgeActionType.Deposit) {
                continue;
            }
            Fraction memory depositRate = _getActionRate(action);
            // Taker tokens will be transferred to the maker for every fill, so
            // we reduce the effective deposit rate if we're depositing the taker
            // token.
            address depositToken = info.dydx.getMarketTokenAddress(action.marketId);
            if (info.takerTokenAddress != address(0)) {
                if (depositToken == info.takerTokenAddress) {
                    // `depositRate = max(0, depositRate - makerToTakerRate)`
                    if (_ltf(makerToTakerRate, depositRate)) {
                        depositRate = _subf(depositRate, makerToTakerRate);
                    } else {
                        depositRate = Fraction(0, 1);
                    }
                }
            }
            // If the deposit rate is > 0, we are limited by the transferrable
            // token balance of the maker.
            if (_gtf(depositRate, Fraction(0, 1))) {
                uint256 supply = _getTransferabeTokenAmount(
                    depositToken,
                    info.makerAddress,
                    address(info.dydx)
                );
                depositableMakerAmount = LibSafeMath.min256(
                    depositableMakerAmount,
                    LibMath.getPartialAmountFloor(
                        depositRate.n,
                        depositRate.d,
                        supply
                    )
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
        solventMakerAmount = info.makerAssetAmount;
        IDydxBridge.BridgeAction memory withdraw = info.actions[info.actions.length - 1];
        Fraction memory minCr = _getMinimumCollateralizationRatio(info.dydx);
        require(_gtef(minCr, Fraction(1, 1)), "DevUtils/MIN_CR_MUST_BE_GTE_ONE");
        // Loop through the accounts.
        for (uint256 accountIdx = 0; accountIdx < info.accounts.length; ++accountIdx) {
            (uint256 supplyValue, uint256 borrowValue) =
                _getAccountValues(info, info.accounts[accountIdx]);
            // All accounts must currently be solvent.
            if (_ltf(Fraction(supplyValue, borrowValue), minCr)) {
                return 0;
            }
            // If this is the same account used to in the withdraw/borrow action,
            // compute the maker amount at which it will become insolvent.
            if (accountIdx != withdraw.accountId) {
                continue;
            }
            // Compute the deposit/collateralization rate, which is the rate at
            // which (USD) value is added to the account across all markets.
            Fraction memory dc = Fraction(0, 1);
            for (uint256 i = 0; i < info.actions.length - 1; ++i) {
                IDydxBridge.BridgeAction memory deposit = info.actions[i];
                if (deposit.accountId == accountIdx) {
                    dc = _addf(dc, _toQuoteValue(info.dydx, deposit.marketId, _getActionRate(deposit)));
                }
            }
            // Compute the borrow/withdraw rate, which is the rate at which
            // (USD) value is deducted from the account.
            Fraction memory db = _toQuoteValue(info.dydx, withdraw.marketId, _getActionRate(withdraw));
            // If the deposit to withdraw ratio is >= the minimum collateralization
            // rate, then we will never become insolvent (at current prices).
            if (_gtef(_divf(dc, db), minCr)) {
                continue;
            }
            // The collateralization ratio for this account, parameterized by
            // `t` (maker amount), is given by:
            //      `cr = (supplyValue + t * dc) / (borrowValue + t * db)`
            // Solving for `t` gives us:
            //      `t = (supplyValue - cr * borrowValue) / (cr * db - dc)`
            Fraction memory t = _divf(
                _subf(Fraction(supplyValue, 1), _mulf(minCr, Fraction(borrowValue, 1))),
                _subf(_mulf(minCr, db), dc)
            );
            // There should only be one withdraw action, so we only update this
            // amount once (no need to do a `min()`).
            solventMakerAmount = LibMath.getPartialAmountFloor(
                t.n,
                t.d,
                info.makerAssetAmount
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
        if (order.takerAssetData.readBytes4(0) == IAssetData(0).ERC20Token.selector) {
            (, info.takerTokenAddress) =
                LibAssetData.decodeERC20AssetData(order.takerAssetData);
        }
        info.makerAssetAmount = order.makerAssetAmount;
        info.takerAssetAmount = order.takerAssetAmount;
        (IDydxBridge.BridgeData memory bridgeData) =
            abi.decode(rawBridgeData, (IDydxBridge.BridgeData));
        info.accounts = bridgeData.accountNumbers;
        info.actions = bridgeData.actions;
    }

    /// @dev Returns the conversion rate for an action, treating infinites as 1.
    /// @param action A `BridgeAction`.
    function _getActionRate(IDydxBridge.BridgeAction memory action)
        private
        pure
        returns (Fraction memory rate)
    {
        rate = action.conversionRateDenominator == 0
            ? Fraction(1, 1)
            : _normalizef(
                Fraction(
                    action.conversionRateNumerator,
                    action.conversionRateDenominator
                )
            );
    }

    /// @dev Get the global minimum collateralization ratio required for
    ///      an account to be considered solvent.
    /// @param dydx The Dydx interface.
    function _getMinimumCollateralizationRatio(IDydx dydx)
        private
        view
        returns (Fraction memory ratio)
    {
        IDydx.RiskParams memory riskParams = dydx.getRiskParams();
        return _normalizef(
            Fraction(
                riskParams.marginRatio.value,
                DYDX_UNITS_BASE
            )
        );
    }

    /// @dev Get the quote (USD) value of a rate within a market.
    /// @param dydx The Dydx interface.
    /// @param marketId Dydx market ID.
    /// @param rate Rate to scale by price.
    function _toQuoteValue(IDydx dydx, uint256 marketId, Fraction memory rate)
        private
        view
        returns (Fraction memory quotedRate)
    {
        IDydx.Price memory price = dydx.getMarketPrice(marketId);
        return _mulf(
            Fraction(
                price.value,
                DYDX_UNITS_BASE
            ),
            rate
        );
    }

    /// @dev Get the total supply and borrow values for an account across all markets.
    /// @param info State from `_getBalanceCheckInfo()`.
    /// @param account The Dydx account identifier.
    function _getAccountValues(BalanceCheckInfo memory info, uint256 account)
        private
        view
        returns (uint256 supplyValue, uint256 borrowValue)
    {
        (IDydx.Value memory supplyValue, IDydx.Value memory borrowValue) =
            info.dydx.getAdjustedAccountValues(IDydx.AccountInfo(
                info.makerAddress,
                account
            ));
        return (supplyValue.value, borrowValue.value);
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

    /*** Fraction helpers ***/

    /// @dev Check if `a < b`.
    function _ltf(Fraction memory a, Fraction memory b)
        private
        pure
        returns (bool isLessThan)
    {
        return LibFractions.cmp(a.n, a.d, b.n, b.d) == -1;
    }

    /// @dev Check if `a > b`.
    function _gtf(Fraction memory a, Fraction memory b)
        private
        pure
        returns (bool isGreaterThan)
    {
        return LibFractions.cmp(a.n, a.d, b.n, b.d) == 1;
    }

    /// @dev Check if `a >= b`.
    function _gtef(Fraction memory a, Fraction memory b)
        private
        pure
        returns (bool isGreaterThanOrEqual)
    {
        return !_ltf(a, b);
    }

    /// @dev Compute `a + b`.
    function _addf(Fraction memory a, Fraction memory b)
        private
        pure
        returns (Fraction memory r)
    {
        (r.n, r.d) = LibFractions.add(a.n, a.d, b.n, b.d);
    }

    /// @dev Compute `a - b`.
    function _subf(Fraction memory a, Fraction memory b)
        private
        pure
        returns (Fraction memory r)
    {
        (r.n, r.d) = LibFractions.sub(a.n, a.d, b.n, b.d);
    }

    /// @dev Compute `a * b`.
    function _mulf(Fraction memory a, Fraction memory b)
        private
        pure
        returns (Fraction memory r)
    {
        (r.n, r.d) = LibFractions.mul(a.n, a.d, b.n, b.d);
    }

    /// @dev Compute `a / b`.
    function _divf(Fraction memory a, Fraction memory b)
        private
        pure
        returns (Fraction memory r)
    {
        (r.n, r.d) = LibFractions.mul(a.n, a.d, b.d, b.n);
    }

    /// @dev Normalize a fraction to prevent arithmetic overflows.
    function _normalizef(Fraction memory f)
        private
        pure
        returns (Fraction memory r)
    {
        (r.n, r.d) = LibFractions.normalize(f.n, f.d);
    }
}
