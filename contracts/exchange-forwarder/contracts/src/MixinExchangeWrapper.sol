/*

  Copyright 2018 ZeroEx Intl.

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

import "./libs/LibConstants.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts/exchange/contracts/src/interfaces/IExchange.sol";


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
        returns (FillResults memory totalFillResults)
    {
        bytes memory makerAssetData = orders[0].makerAssetData;
        bytes memory wethAssetData = WETH_ASSET_DATA;

        uint256 ordersLength = orders.length;
        for (uint256 i = 0; i != ordersLength; i++) {

            // We assume that asset being bought by taker is the same for each order.
            // We assume that asset being sold by taker is WETH for each order.
            orders[i].makerAssetData = makerAssetData;
            orders[i].takerAssetData = wethAssetData;

            // Calculate the remaining amount of WETH to sell
            uint256 remainingTakerAssetFillAmount = _safeSub(wethSellAmount, totalFillResults.takerAssetFilledAmount);

            // Attempt to sell the remaining amount of WETH
            FillResults memory singleFillResults = _fillOrderNoThrow(
                orders[i],
                remainingTakerAssetFillAmount,
                signatures[i]
            );

            // Update amounts filled and fees paid by maker and taker
            _addFillResults(totalFillResults, singleFillResults);

            // Stop execution if the entire amount of takerAsset has been sold
            if (totalFillResults.takerAssetFilledAmount >= wethSellAmount) {
                break;
            }
        }
        return totalFillResults;
    }

    /// @dev Synchronously executes multiple fill orders in a single transaction until total amount is bought by taker.
    ///      Returns false if the transaction would otherwise revert.
    ///      The asset being sold by taker must always be WETH.
    /// @param orders Array of order specifications.
    /// @param makerAssetFillAmount Desired amount of makerAsset to buy.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return Amounts filled and fees paid by makers and taker.
    function _marketBuyExactAmountWithWeth(
        LibOrder.Order[] memory orders,
        uint256 makerAssetFillAmount,
        bytes[] memory signatures
    )
        internal
        returns (FillResults memory totalFillResults)
    {
        bytes memory makerAssetData = orders[0].makerAssetData;
        bytes memory wethAssetData = WETH_ASSET_DATA;

        uint256 ordersLength = orders.length;
        uint256 makerAssetFilledAmount = 0;
        for (uint256 i = 0; i != ordersLength; i++) {

            // We assume that asset being bought by taker is the same for each order.
            // We assume that asset being sold by taker is WETH for each order.
            orders[i].makerAssetData = makerAssetData;
            orders[i].takerAssetData = wethAssetData;

            // Calculate the remaining amount of makerAsset to buy
            uint256 remainingMakerAssetFillAmount = _safeSub(makerAssetFillAmount, totalFillResults.makerAssetFilledAmount);

            // Convert the remaining amount of makerAsset to buy into remaining amount
            // of takerAsset to sell, assuming entire amount can be sold in the current order.
            // We round up because the exchange rate computed by fillOrder rounds in favor
            // of the Maker. In this case we want to overestimate the amount of takerAsset.
            uint256 remainingTakerAssetFillAmount = _getPartialAmountCeil(
                orders[i].takerAssetAmount,
                orders[i].makerAssetAmount,
                remainingMakerAssetFillAmount
            );

            // Attempt to sell the remaining amount of takerAsset
            FillResults memory singleFillResults = _fillOrderNoThrow(
                orders[i],
                remainingTakerAssetFillAmount,
                signatures[i]
            );

            // Update amounts filled and fees paid by maker and taker
            _addFillResults(totalFillResults, singleFillResults);

            // Stop execution if the entire amount of makerAsset has been bought
            makerAssetFilledAmount = totalFillResults.makerAssetFilledAmount;
            if (makerAssetFilledAmount >= makerAssetFillAmount) {
                break;
            }
        }

        require(
            makerAssetFilledAmount >= makerAssetFillAmount,
            "COMPLETE_FILL_FAILED"
        );
        return totalFillResults;
    }

    /// @dev Buys zrxBuyAmount of ZRX fee tokens, taking into account ZRX fees for each order. This will guarantee
    ///      that at least zrxBuyAmount of ZRX is purchased (sometimes slightly over due to rounding issues).
    ///      It is possible that a request to buy 200 ZRX will require purchasing 202 ZRX
    ///      as 2 ZRX is required to purchase the 200 ZRX fee tokens. This guarantees at least 200 ZRX for future purchases.
    ///      The asset being sold by taker must always be WETH.
    /// @param orders Array of order specifications containing ZRX as makerAsset and WETH as takerAsset.
    /// @param zrxBuyAmount Desired amount of ZRX to buy.
    /// @param signatures Proofs that orders have been created by makers.
    /// @return totalFillResults Amounts filled and fees paid by maker and taker.
    function _marketBuyExactZrxWithWeth(
        LibOrder.Order[] memory orders,
        uint256 zrxBuyAmount,
        bytes[] memory signatures
    )
        internal
        returns (FillResults memory totalFillResults)
    {
        // Do nothing if zrxBuyAmount == 0
        if (zrxBuyAmount == 0) {
            return totalFillResults;
        }

        bytes memory zrxAssetData = ZRX_ASSET_DATA;
        bytes memory wethAssetData = WETH_ASSET_DATA;
        uint256 zrxPurchased = 0;

        uint256 ordersLength = orders.length;
        for (uint256 i = 0; i != ordersLength; i++) {

            // All of these are ZRX/WETH, so we can drop the respective assetData from calldata.
            orders[i].makerAssetData = zrxAssetData;
            orders[i].takerAssetData = wethAssetData;

            // Calculate the remaining amount of ZRX to buy.
            uint256 remainingZrxBuyAmount = _safeSub(zrxBuyAmount, zrxPurchased);

            // Convert the remaining amount of ZRX to buy into remaining amount
            // of WETH to sell, assuming entire amount can be sold in the current order.
            // We round up because the exchange rate computed by fillOrder rounds in favor
            // of the Maker. In this case we want to overestimate the amount of takerAsset.
            uint256 remainingWethSellAmount = _getPartialAmountCeil(
                orders[i].takerAssetAmount,
                _safeSub(orders[i].makerAssetAmount, orders[i].takerFee),  // our exchange rate after fees
                remainingZrxBuyAmount
            );

            // Attempt to sell the remaining amount of WETH.
            FillResults memory singleFillResult = _fillOrderNoThrow(
                orders[i],
                remainingWethSellAmount,
                signatures[i]
            );

            // Update amounts filled and fees paid by maker and taker.
            _addFillResults(totalFillResults, singleFillResult);
            zrxPurchased = _safeSub(totalFillResults.makerAssetFilledAmount, totalFillResults.takerFeePaid);

            // Stop execution if the entire amount of ZRX has been bought.
            if (zrxPurchased >= zrxBuyAmount) {
                break;
            }
        }

        require(
            zrxPurchased >= zrxBuyAmount,
            "COMPLETE_FILL_FAILED"
        );
        return totalFillResults;
    }
}
