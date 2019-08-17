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
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "./libs/LibConstants.sol";
import "./libs/LibForwarderRichErrors.sol";



contract MixinExchangeWrapper is
    LibConstants,
    LibFillResults,
    LibMath
{
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
        returns (FillResults memory fillResults)
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
    ///      the amount already sold. Returns false if the transaction would otherwise revert.
    /// @param order A single order specification.
    /// @param signature Signature for the given order.
    /// @param wethSellAmount Total amount of WETH to sell.
    /// @param wethSpentAmount Amount of WETH already sold.
    /// @return Amounts filled and fees paid by maker and taker for this order.
    function _marketSellSingleOrder(
        LibOrder.Order memory order,
        bytes memory signature,
        uint256 wethSellAmount,
        uint256 wethSpentAmount
    )
        internal
        returns (FillResults memory singleFillResults)
    {
        // The remaining amount of WETH to sell
        uint256 remainingTakerAssetFillAmount = wethSellAmount.safeSub(wethSpentAmount);

        // Percentage fee
        if (order.makerAssetData.equals(order.takerFeeAssetData)) {
            // Attempt to sell the remaining amount of WETH
            singleFillResults = _fillOrderNoThrow(
                order,
                remainingTakerAssetFillAmount,
                signature
            );
        // WETH fee
        } else if (order.takerFeeAssetData.equals(order.takerAssetData)) {
            // We will first sell WETH as the takerAsset, then use it to pay the takerFee.
            // This ensures that we reserve enough to pay the fee.
            uint256 takerAssetFillAmount = getPartialAmountCeil(
                order.takerAssetAmount,
                order.takerAssetAmount.safeAdd(order.takerFee),
                remainingTakerAssetFillAmount
            );

            singleFillResults = _fillOrderNoThrow(
                order,
                takerAssetFillAmount,
                signature
            );
        } else {
            LibRichErrors.rrevert(LibForwarderRichErrors.UnsupportedFeeError(order.takerFeeAssetData));
        }
    }

    /// @dev Synchronously executes multiple calls of fillOrder until total amount of WETH has been sold by taker.
    ///      Returns false if the transaction would otherwise revert.
    /// @param orders Array of order specifications.
    /// @param wethSellAmount Desired amount of WETH to sell.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return Amounts of WETH spent and makerAsset acquired by the taker.
    function _marketSellWeth(
        LibOrder.Order[] memory orders,
        uint256 wethSellAmount,
        bytes[] memory signatures
    )
        internal
        returns (
            uint256 wethSpentAmount,
            uint256 makerAssetAcquiredAmount
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

            FillResults memory singleFillResults = _marketSellSingleOrder(
                orders[i],
                signatures[i],
                wethSellAmount,
                wethSpentAmount
            );

            // Percentage fee
            if (orders[i].takerFeeAssetData.equals(orders[i].makerAssetData)) {
                // Subtract fee from makerAssetFilledAmount for the net amount acquired.
                makerAssetAcquiredAmount = makerAssetAcquiredAmount.safeAdd(
                    singleFillResults.makerAssetFilledAmount
                ).safeSub(singleFillResults.takerFeePaid);

                wethSpentAmount = wethSpentAmount.safeAdd(singleFillResults.takerAssetFilledAmount);
            // WETH fee
            } else {
                // WETH is also spent on the taker fee, so we add it here.
                wethSpentAmount = wethSpentAmount.safeAdd(
                    singleFillResults.takerAssetFilledAmount
                ).safeAdd(singleFillResults.takerFeePaid);

                makerAssetAcquiredAmount = makerAssetAcquiredAmount.safeAdd(
                    singleFillResults.makerAssetFilledAmount
                );
            }

            // Stop execution if the entire amount of WETH has been sold
            if (wethSpentAmount >= wethSellAmount) {
                break;
            }
        }
        return (wethSpentAmount, makerAssetAcquiredAmount);
    }

    /// @dev Executes a single call of fillOrder according to the makerAssetBuyAmount and
    ///      the amount already bought. Returns false if the transaction would otherwise revert.
    /// @param order A single order specification.
    /// @param signature Signature for the given order.
    /// @param makerAssetBuyAmount Total amount of maker asset to buy.
    /// @param makerAssetAcquiredAmount Amount of maker asset already bought.
    /// @return Amounts filled and fees paid by maker and taker for this order.
    function _marketBuySingleOrder(
        LibOrder.Order memory order,
        bytes memory signature,
        uint256 makerAssetBuyAmount,
        uint256 makerAssetAcquiredAmount
    )
        internal
        returns (FillResults memory singleFillResults)
    {
        // Percentage fee
        if (order.takerFeeAssetData.equals(order.makerAssetData)) {
            // Calculate the remaining amount of takerAsset to sell
            uint256 remainingTakerAssetFillAmount = getPartialAmountCeil(
                order.takerAssetAmount,
                order.makerAssetAmount.safeSub(order.takerFee),
                makerAssetBuyAmount.safeSub(makerAssetAcquiredAmount)
            );

            // Attempt to sell the remaining amount of takerAsset
            singleFillResults = _fillOrderNoThrow(
                order,
                remainingTakerAssetFillAmount,
                signature
            );
        // WETH fee
        } else if (order.takerFeeAssetData.equals(order.takerAssetData)) {
            // Calculate the remaining amount of takerAsset to sell
            uint256 remainingTakerAssetFillAmount = getPartialAmountCeil(
                order.takerAssetAmount,
                order.makerAssetAmount,
                makerAssetBuyAmount.safeSub(makerAssetAcquiredAmount)
            );

            // Attempt to sell the remaining amount of takerAsset
            singleFillResults = _fillOrderNoThrow(
                order,
                remainingTakerAssetFillAmount,
                signature
            );
        } else {
            LibRichErrors.rrevert(LibForwarderRichErrors.UnsupportedFeeError(order.takerFeeAssetData));
        }
    }

    /// @dev Synchronously executes multiple fill orders in a single transaction until total amount is acquired.
    ///      Note that the Forwarder may fill more than the makerAssetBuyAmount so that, after percentage fees
    ///      are paid, the net amount acquired after fees is equal to makerAssetBuyAmount (modulo rounding).
    ///      The asset being sold by taker must always be WETH.
    /// @param orders Array of order specifications.
    /// @param makerAssetBuyAmount Desired amount of makerAsset to fill.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return Amounts of WETH spent and makerAsset acquired by the taker.
    function _marketBuyExactAmountWithWeth(
        LibOrder.Order[] memory orders,
        uint256 makerAssetBuyAmount,
        bytes[] memory signatures
    )
        internal
        returns (
            uint256 wethSpentAmount,
            uint256 makerAssetAcquiredAmount
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

            FillResults memory singleFillResults = _marketBuySingleOrder(
                orders[i],
                signatures[i],
                makerAssetBuyAmount,
                makerAssetAcquiredAmount
            );

            // Percentage fee
            if (orders[i].takerFeeAssetData.equals(orders[i].makerAssetData)) {
                // Subtract fee from makerAssetFilledAmount for the net amount acquired.
                makerAssetAcquiredAmount = makerAssetAcquiredAmount.safeAdd(
                    singleFillResults.makerAssetFilledAmount
                ).safeSub(singleFillResults.takerFeePaid);

                wethSpentAmount = wethSpentAmount.safeAdd(
                    singleFillResults.takerAssetFilledAmount
                );
            // WETH fee
            } else {
                makerAssetAcquiredAmount = makerAssetAcquiredAmount.safeAdd(
                    singleFillResults.makerAssetFilledAmount
                );

                // WETH is also spent on the taker fee, so we add it here.
                wethSpentAmount = wethSpentAmount.safeAdd(
                    singleFillResults.takerAssetFilledAmount
                ).safeAdd(singleFillResults.takerFeePaid);
            }

            // Stop execution if the entire amount of makerAsset has been bought
            if (makerAssetAcquiredAmount >= makerAssetBuyAmount) {
                break;
            }
        }

        if (makerAssetAcquiredAmount < makerAssetBuyAmount) {
            LibRichErrors.rrevert(LibForwarderRichErrors.CompleteFillFailedError());
        }

        return (wethSpentAmount, makerAssetAcquiredAmount);
    }
}
