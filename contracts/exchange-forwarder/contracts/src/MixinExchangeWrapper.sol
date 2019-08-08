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
import "@0x/contracts/exchange/contracts/src/interfaces/IExchange.sol";
import "./libs/LibForwarderRichErrors.sol";


contract MixinExchangeWrapper is
    LibFillResults,
    LibMath,
    LibConstants
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

    /// @dev Synchronously executes multiple calls of fillOrder until total amount of WETH has been sold by taker.
    ///      Returns false if the transaction would otherwise revert.
    /// @param orders Array of order specifications.
    /// @param wethSellAmount Desired amount of WETH to sell.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return Amounts filled and fees paid by makers and taker.
    function _marketSellWeth(
        LibOrder.Order[] memory orders,
        uint256 wethSellAmount,
        bytes[] memory signatures
    )
        internal
        returns (
            FillResults memory totalFillResults,
            uint256 wethSpentAmount,
            uint256 makerAssetAcquiredAmount
        )
    {
        uint256 ordersLength = orders.length;

        for (uint256 i = 0; i != ordersLength; i++) {
            if (!orders[i].makerAssetData.equals(orders[0].makerAssetData)) {
                LibRichErrors._rrevert(LibForwarderRichErrors.MakerAssetMismatchError(
                    orders[0].makerAssetData,
                    orders[i].makerAssetData
                ));
            }

            // The remaining amount of WETH to sell
            uint256 remainingTakerAssetFillAmount = _safeSub(
                wethSellAmount,
                wethSpentAmount
            );
            FillResults memory singleFillResults;

            // Percentage fee
            if (orders[i].makerAssetData.equals(orders[i].takerFeeAssetData)) {
                // Attempt to sell the remaining amount of WETH
                singleFillResults = _fillOrderNoThrow(
                    orders[i],
                    remainingTakerAssetFillAmount,
                    signatures[i]
                );

                // Subtract fee from makerAssetFilledAmount for the net amount acquired.
                makerAssetAcquiredAmount = _safeAdd(
                    makerAssetAcquiredAmount,
                    _safeSub(singleFillResults.makerAssetFilledAmount, singleFillResults.takerFeePaid)
                );

                wethSpentAmount = _safeAdd(
                    wethSpentAmount,
                    singleFillResults.takerAssetFilledAmount
                );
            // WETH fee
            } else {
                // We will first sell WETH as the takerAsset, then use it to pay the takerFee.
                // This ensures that we reserve enough to pay the fee.
                uint256 takerAssetFillAmount = _getPartialAmountCeil(
                    orders[i].takerAssetAmount,
                    _safeAdd(orders[i].takerAssetAmount, orders[i].takerFee),
                    remainingTakerAssetFillAmount
                );

                singleFillResults = _fillOrderNoThrow(
                    orders[i],
                    takerAssetFillAmount,
                    signatures[i]
                );

                // WETH is also spent on the taker fee, so we add it here.
                wethSpentAmount = _safeAdd(
                    wethSpentAmount,
                    _safeAdd(singleFillResults.takerAssetFilledAmount, singleFillResults.takerFeePaid)
                );

                makerAssetAcquiredAmount = _safeAdd(
                    makerAssetAcquiredAmount,
                    singleFillResults.makerAssetFilledAmount
                );
            }

            _addFillResults(totalFillResults, singleFillResults);

            // Stop execution if the entire amount of WETH has been sold
            if (wethSpentAmount >= wethSellAmount) {
                break;
            }
        }
        return (totalFillResults, wethSpentAmount, makerAssetAcquiredAmount);
    }

    /// @dev Synchronously executes multiple fill orders in a single transaction until total amount is filled.
    ///      Note that as of v3.0.0, makerAssetFillAmount is the amount of makerAsset *filled* by the Forwarder,
    ///      some of which may be spent on order fees. The amount acquired after fees is makerAssetAcquiredAmount.
    ///      The asset being sold by taker must always be WETH.
    /// @param orders Array of order specifications.
    /// @param makerAssetFillAmount Desired amount of makerAsset to fill.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return Amounts filled and fees paid by makers and taker.
    function _marketBuyExactAmountWithWeth(
        LibOrder.Order[] memory orders,
        uint256 makerAssetFillAmount,
        bytes[] memory signatures
    )
        internal
        returns (
            FillResults memory totalFillResults,
            uint256 wethSpentAmount,
            uint256 makerAssetAcquiredAmount
        )
    {
        uint256 ordersLength = orders.length;
        for (uint256 i = 0; i != ordersLength; i++) {
            if (!orders[i].makerAssetData.equals(orders[0].makerAssetData)) {
                LibRichErrors._rrevert(LibForwarderRichErrors.MakerAssetMismatchError(
                    orders[0].makerAssetData,
                    orders[i].makerAssetData
                ));
            }

            // Calculate the remaining amount of takerAsset to sell
            uint256 remainingTakerAssetFillAmount = _getPartialAmountCeil(
                orders[i].takerAssetAmount,
                orders[i].makerAssetAmount,
                _safeSub(makerAssetFillAmount, makerAssetAcquiredAmount)
            );

            // Attempt to sell the remaining amount of takerAsset
            FillResults memory singleFillResults = _fillOrderNoThrow(
                orders[i],
                remainingTakerAssetFillAmount,
                signatures[i]
            );
            // Percentage fee
            if (orders[i].makerAssetData.equals(orders[i].takerFeeAssetData)) {
                // Subtract fee from makerAssetFilledAmount for the net amount acquired.
                makerAssetAcquiredAmount = _safeAdd(
                    makerAssetAcquiredAmount,
                    _safeSub(singleFillResults.makerAssetFilledAmount, singleFillResults.takerFeePaid)
                );

                wethSpentAmount = _safeAdd(
                    wethSpentAmount,
                    singleFillResults.takerAssetFilledAmount
                );
            // WETH fee
            } else {
                makerAssetAcquiredAmount = _safeAdd(
                    makerAssetAcquiredAmount,
                    singleFillResults.makerAssetFilledAmount
                );

                // WETH is also spent on the taker fee, so we add it here.
                wethSpentAmount = _safeAdd(
                    wethSpentAmount,
                    _safeAdd(singleFillResults.takerAssetFilledAmount, singleFillResults.takerFeePaid)
                );
            }
            _addFillResults(totalFillResults, singleFillResults);

            // Stop execution if the entire amount of makerAsset has been filled
            if (totalFillResults.makerAssetFilledAmount >= makerAssetFillAmount) {
                break;
            }
        }

        require(
            totalFillResults.makerAssetFilledAmount >= makerAssetFillAmount,
            "COMPLETE_FILL_FAILED"
        );
        return (totalFillResults, wethSpentAmount, makerAssetAcquiredAmount);
    }
}
