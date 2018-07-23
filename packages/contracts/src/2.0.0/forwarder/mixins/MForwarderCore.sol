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

import "../../protocol/Exchange/libs/LibOrder.sol";
import "../../protocol/Exchange/libs/LibFillResults.sol";
import "../interfaces/IForwarderCore.sol";


contract MForwarderCore is
    IForwarderCore
{

    /// @dev Ensures that all ZRX fees have been repurchased and no extra WETH owned by this contract has been sold.
    /// @param orderFillResults Amounts filled and fees paid for primary orders.
    /// @param feeOrderFillResults Amounts filled and fees paid for fee orders.
    /// @param zrxBuyAmount The amount of ZRX that needed to be repurchased after filling primary orders.
    function assertValidFillResults(
        LibFillResults.FillResults memory orderFillResults,
        LibFillResults.FillResults memory feeOrderFillResults,
        uint256 zrxBuyAmount
    )
        internal
        view;
}
