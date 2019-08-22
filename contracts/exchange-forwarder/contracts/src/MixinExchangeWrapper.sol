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

import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "./libs/LibConstants.sol";
import "./libs/LibForwarderRichErrors.sol";


contract MixinExchangeWrapper is
    LibConstants
{
    using LibSafeMath for uint256;

    /// @dev Fills the input order.
    ///      Returns false if the transaction would otherwise revert.
    /// @param order Order struct containing order specifications.
    /// @param takerAssetFillAmount Desired amount of takerAsset to sell.
    /// @param signature Proof that order has been created by maker.
    /// @return Amounts filled and fees paid by maker and taker.
    function _fillOrderNoThrow(
        LibOrder.Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature
    )
        internal
        returns (LibFillResults.FillResults memory fillResults)
    {
        // ABI encode calldata for `fillOrder`
        bytes memory fillOrderCalldata = abi.encodeWithSelector(
            IExchange(address(0)).fillOrder.selector,
            order,
            takerAssetFillAmount,
            signature
        );

        address exchange = address(EXCHANGE);

        // Call `fillOrder` and handle any exceptions gracefully
        assembly {
            let success := call(
                gas,                                // forward all gas
                exchange,                           // call address of Exchange contract
                0,                                  // transfer 0 wei
                add(fillOrderCalldata, 32),         // pointer to start of input (skip array length in first 32 bytes)
                mload(fillOrderCalldata),           // length of input
                fillOrderCalldata,                  // write output over input
                128                                 // output size is 128 bytes
            )
            if success {
                mstore(fillResults, mload(fillOrderCalldata))
                mstore(add(fillResults, 32), mload(add(fillOrderCalldata, 32)))
                mstore(add(fillResults, 64), mload(add(fillOrderCalldata, 64)))
                mstore(add(fillResults, 96), mload(add(fillOrderCalldata, 96)))
            }
        }
        // fillResults values will be 0 by default if call was unsuccessful
        return fillResults;
    }

    /// @dev Executes a single call of fillOrder according to the wethSellAmount and
    ///      the amount already sold.
    /// @param order A single order specification.
    /// @param signature Signature for the given order.
    /// @param remainingTakerAssetFillAmount Remaining amount of WETH to sell.
    /// @return wethSpentAmount Amount of WETH spent on the given order.
    /// @return makerAssetAcquiredAmount Amount of maker asset acquired from the given order.
    function _marketSellSingleOrder(
        LibOrder.Order memory order,
        bytes memory signature,
        uint256 remainingTakerAssetFillAmount
    )
        internal
        returns (
            uint256 wethSpentAmount,
            uint256 makerAssetAcquiredAmount
        )
    {
        // No fee or percentage fee
        if (order.takerFee == 0 || order.takerFeeAssetData.equals(order.makerAssetData)) {
            // Attempt to sell the remaining amount of WETH
            LibFillResults.FillResults memory singleFillResults = _fillOrderNoThrow(
                order,
                remainingTakerAssetFillAmount,
                signature
            );

            wethSpentAmount = singleFillResults.takerAssetFilledAmount;

            // Subtract fee from makerAssetFilledAmount for the net amount acquired.
            makerAssetAcquiredAmount = singleFillResults.makerAssetFilledAmount.safeSub(
                singleFillResults.takerFeePaid
            );
        // WETH fee
        } else if (order.takerFeeAssetData.equals(order.takerAssetData)) {
            // We will first sell WETH as the takerAsset, then use it to pay the takerFee.
            // This ensures that we reserve enough to pay the fee.
            uint256 takerAssetFillAmount = LibMath.getPartialAmountCeil(
                order.takerAssetAmount,
                order.takerAssetAmount.safeAdd(order.takerFee),
                remainingTakerAssetFillAmount
            );

            LibFillResults.FillResults memory singleFillResults = _fillOrderNoThrow(
                order,
                takerAssetFillAmount,
                signature
            );

            // WETH is also spent on the taker fee, so we add it here.
            wethSpentAmount = singleFillResults.takerAssetFilledAmount.safeAdd(
                singleFillResults.takerFeePaid
            );

            makerAssetAcquiredAmount = singleFillResults.makerAssetFilledAmount;
        // Unsupported fee
        } else {
            LibRichErrors.rrevert(LibForwarderRichErrors.UnsupportedFeeError(order.takerFeeAssetData));
        }

        return (wethSpentAmount, makerAssetAcquiredAmount);
    }

    /// @dev Synchronously executes multiple calls of fillOrder until total amount of WETH has been sold by taker.
    /// @param orders Array of order specifications.
    /// @param wethSellAmount Desired amount of WETH to sell.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return totalWethSpentAmount Total amount of WETH spent on the given orders.
    /// @return totalMakerAssetAcquiredAmount Total amount of maker asset acquired from the given orders.
    function _marketSellWeth(
        LibOrder.Order[] memory orders,
        uint256 wethSellAmount,
        bytes[] memory signatures
    )
        internal
        returns (
            uint256 totalWethSpentAmount,
            uint256 totalMakerAssetAcquiredAmount
        )
    {
        uint256 ordersLength = orders.length;

        for (uint256 i = 0; i != ordersLength; i++) {
            if (!orders[i].makerAssetData.equals(orders[0].makerAssetData)) {
                LibRichErrors.rrevert(LibForwarderRichErrors.MakerAssetMismatchError(
                    orders[0].makerAssetData,
                    orders[i].makerAssetData
                ));
            }

            // Preemptively skip to avoid division by zero in _marketSellSingleOrder
            if (orders[i].makerAssetAmount == 0 || orders[i].takerAssetAmount == 0) {
                continue;
            }

            // The remaining amount of WETH to sell
            uint256 remainingTakerAssetFillAmount = wethSellAmount.safeSub(totalWethSpentAmount);

            (
                uint256 wethSpentAmount,
                uint256 makerAssetAcquiredAmount
            ) = _marketSellSingleOrder(
                orders[i],
                signatures[i],
                remainingTakerAssetFillAmount
            );

            totalWethSpentAmount = totalWethSpentAmount.safeAdd(wethSpentAmount);
            totalMakerAssetAcquiredAmount = totalMakerAssetAcquiredAmount.safeAdd(makerAssetAcquiredAmount);

            // Stop execution if the entire amount of WETH has been sold
            if (totalWethSpentAmount >= wethSellAmount) {
                break;
            }
        }
    }

    /// @dev Executes a single call of fillOrder according to the makerAssetBuyAmount and
    ///      the amount already bought.
    /// @param order A single order specification.
    /// @param signature Signature for the given order.
    /// @param remainingMakerAssetFillAmount Remaining amount of maker asset to buy.
    /// @return wethSpentAmount Amount of WETH spent on the given order.
    /// @return makerAssetAcquiredAmount Amount of maker asset acquired from the given order.
    function _marketBuySingleOrder(
        LibOrder.Order memory order,
        bytes memory signature,
        uint256 remainingMakerAssetFillAmount
    )
        internal
        returns (
            uint256 wethSpentAmount,
            uint256 makerAssetAcquiredAmount
        )
    {
        // No fee or WETH fee
        if (order.takerFee == 0 || order.takerFeeAssetData.equals(order.takerAssetData)) {
            // Calculate the remaining amount of takerAsset to sell
            uint256 remainingTakerAssetFillAmount = LibMath.getPartialAmountCeil(
                order.takerAssetAmount,
                order.makerAssetAmount,
                remainingMakerAssetFillAmount
            );

            // Attempt to sell the remaining amount of takerAsset
            LibFillResults.FillResults memory singleFillResults = _fillOrderNoThrow(
                order,
                remainingTakerAssetFillAmount,
                signature
            );

            // WETH is also spent on the taker fee, so we add it here.
            wethSpentAmount = singleFillResults.takerAssetFilledAmount.safeAdd(
                singleFillResults.takerFeePaid
            );

            makerAssetAcquiredAmount = singleFillResults.makerAssetFilledAmount;
        // Percentage fee
        } else if (order.takerFeeAssetData.equals(order.makerAssetData)) {
            // Calculate the remaining amount of takerAsset to sell
            uint256 remainingTakerAssetFillAmount = LibMath.getPartialAmountCeil(
                order.takerAssetAmount,
                order.makerAssetAmount.safeSub(order.takerFee),
                remainingMakerAssetFillAmount
            );

            // Attempt to sell the remaining amount of takerAsset
            LibFillResults.FillResults memory singleFillResults = _fillOrderNoThrow(
                order,
                remainingTakerAssetFillAmount,
                signature
            );

            wethSpentAmount = singleFillResults.takerAssetFilledAmount;

            // Subtract fee from makerAssetFilledAmount for the net amount acquired.
            makerAssetAcquiredAmount = singleFillResults.makerAssetFilledAmount.safeSub(
                singleFillResults.takerFeePaid
            );
        // Unsupported fee
        } else {
            LibRichErrors.rrevert(LibForwarderRichErrors.UnsupportedFeeError(order.takerFeeAssetData));
        }

        return (wethSpentAmount, makerAssetAcquiredAmount);
    }

    /// @dev Synchronously executes multiple fill orders in a single transaction until total amount is acquired.
    ///      Note that the Forwarder may fill more than the makerAssetBuyAmount so that, after percentage fees
    ///      are paid, the net amount acquired after fees is equal to makerAssetBuyAmount (modulo rounding).
    ///      The asset being sold by taker must always be WETH.
    /// @param orders Array of order specifications.
    /// @param makerAssetBuyAmount Desired amount of makerAsset to fill.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return totalWethSpentAmount Total amount of WETH spent on the given orders.
    /// @return totalMakerAssetAcquiredAmount Total amount of maker asset acquired from the given orders.
    function _marketBuyExactAmountWithWeth(
        LibOrder.Order[] memory orders,
        uint256 makerAssetBuyAmount,
        bytes[] memory signatures
    )
        internal
        returns (
            uint256 totalWethSpentAmount,
            uint256 totalMakerAssetAcquiredAmount
        )
    {
        uint256 ordersLength = orders.length;
        for (uint256 i = 0; i != ordersLength; i++) {
            if (!orders[i].makerAssetData.equals(orders[0].makerAssetData)) {
                LibRichErrors.rrevert(LibForwarderRichErrors.MakerAssetMismatchError(
                    orders[0].makerAssetData,
                    orders[i].makerAssetData
                ));
            }

            // Preemptively skip to avoid division by zero in _marketBuySingleOrder
            if (orders[i].makerAssetAmount == 0 || orders[i].takerAssetAmount == 0) {
                continue;
            }

            uint256 remainingMakerAssetFillAmount = makerAssetBuyAmount.safeSub(totalMakerAssetAcquiredAmount);

            (
                uint256 wethSpentAmount,
                uint256 makerAssetAcquiredAmount
            ) = _marketBuySingleOrder(
                orders[i],
                signatures[i],
                remainingMakerAssetFillAmount
            );

            totalWethSpentAmount = totalWethSpentAmount.safeAdd(wethSpentAmount);
            totalMakerAssetAcquiredAmount = totalMakerAssetAcquiredAmount.safeAdd(makerAssetAcquiredAmount);

            // Stop execution if the entire amount of makerAsset has been bought
            if (totalMakerAssetAcquiredAmount >= makerAssetBuyAmount) {
                break;
            }
        }

        if (totalMakerAssetAcquiredAmount < makerAssetBuyAmount) {
            LibRichErrors.rrevert(LibForwarderRichErrors.CompleteBuyFailedError(
                makerAssetBuyAmount,
                totalMakerAssetAcquiredAmount
            ));
        }
    }
}
