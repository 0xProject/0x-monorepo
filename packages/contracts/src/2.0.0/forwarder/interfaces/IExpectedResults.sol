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

pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "../../protocol/Exchange/libs/LibFillResults.sol";
import "../../protocol/Exchange/libs/LibOrder.sol";


contract IExpectedResults {

    /// @dev Calculates a total FillResults for buying makerAssetFillAmount over all orders.
    ///      Including the fees required to be paid. 
    /// @param orders An array of Order struct containing order specifications.
    /// @param makerAssetFillAmount A number representing the amount of this order to fill.
    /// @return totalFillResults Amounts filled and fees paid by maker and taker.
    function calculateMarketBuyResults(
        LibOrder.Order[] memory orders,
        uint256 makerAssetFillAmount
    )
        public
        view
        returns (LibFillResults.FillResults memory totalFillResults);

    /// @dev Calculates a FillResults total for selling takerAssetFillAmount over all orders. 
    ///      Including the fees required to be paid. 
    /// @param orders An array of Order struct containing order specifications.
    /// @param takerAssetFillAmount A number representing the amount of this order to fill.
    /// @return totalFillResults Amounts filled and fees paid by maker and taker.
    function calculateMarketSellResults(
        LibOrder.Order[] memory orders,
        uint256 takerAssetFillAmount
    )
        public
        view
        returns (LibFillResults.FillResults memory totalFillResults);

    /// @dev Calculates fill results for buyFeeTokens. This handles fees on buying ZRX
    ///      so the end result is the expected amount of ZRX (not less after fees).
    /// @param orders An array of Order struct containing order specifications.
    /// @param zrxFillAmount A number representing the amount zrx to buy
    /// @return totalFillResults Expected fill result amounts from buying fees
    function calculateMarketBuyZrxResults(
        LibOrder.Order[] memory orders,
        uint256 zrxFillAmount
    )
        public
        view
        returns (LibFillResults.FillResults memory totalFillResults);
}