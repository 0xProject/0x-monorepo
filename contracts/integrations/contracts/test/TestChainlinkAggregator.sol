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

import "../src/interfaces/IChainlinkAggregator.sol";


contract TestChainlinkAggregator is
    IChainlinkAggregator
{
    int256 internal _price;
    uint256 internal _timestampDelta;

    function setPrice(int256 price_)
        external
    {
        _price = price_;
    }

    function setTimestampDelta(uint256 delta)
        external
    {
        _timestampDelta = delta;
    }

    function latestAnswer()
        external
        view
        returns (int256)
    {
        return _price;
    }

    function latestTimestamp()
        external
        view
        returns (uint256)
    {
        // solhint-disable-next-line not-rely-on-time
        return now - _timestampDelta;
    }
}
