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

import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "./interfaces/IChainlinkAggregator.sol";


contract ChainlinkStopLimit {

    using LibSafeMath for uint256;

    /// @dev Checks that the price returned by the encoded Chainlink reference contract is
    ///      within the encoded price range, and the price was recorded recently enough.
    /// @param stopLimitData Encodes the address of the Chainlink reference contract, the
    ///        valid price range, and the requisite "freshness" of the oracle's price data.
    function checkStopLimit(bytes calldata stopLimitData)
        external
        view
    {
        (
            address oracle,
            int256 minPrice,
            int256 maxPrice,
            uint256 priceFreshness
        ) = abi.decode(
            stopLimitData,
            (address, int256, int256, uint256)
        );

        int256 latestPrice = IChainlinkAggregator(oracle).latestAnswer();
        require(
            latestPrice >= minPrice && latestPrice <= maxPrice,
            "ChainlinkStopLimitOracle/OUT_OF_PRICE_RANGE"
        );

        uint256 latestTimestamp = IChainlinkAggregator(oracle).latestTimestamp();
        require(
            block.timestamp.safeSub(latestTimestamp) <= priceFreshness, // solhint-disable-line not-rely-on-time
            "ChainlinkStopLimitOracle/PRICE_DATA_TOO_OLD"
        );
    }
}
