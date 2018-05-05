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

pragma solidity ^0.4.23;

import "../lib/LibOrder.sol";

contract MSettlement {

    /// @dev Settles an order by transfering assets between counterparties.
    /// @param order Order struct containing order specifications.
    /// @param takerAddress Address selling takerAsset and buying makerAsset.
    /// @param takerAssetFilledAmount The amount of takerAsset that will be transfered to the order's maker.
    /// @return Amount filled by maker and fees paid by maker/taker.
    function settleOrder(
        LibOrder.Order memory order,
        address takerAddress,
        uint256 takerAssetFilledAmount)
        internal
        returns (
            uint256 makerAssetFilledAmount,
            uint256 makerFeePaid,
            uint256 takerFeePaid
        );
}

