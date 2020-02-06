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


// A subset of https://github.com/smartcontractkit/chainlink/blob/master/evm/contracts/interfaces/AggregatorInterface.sol
interface IChainlinkAggregator {

    /// @dev Returns the latest data value recorded by the contract.
    /// @return answer The latest data value recorded. For a price oracle aggregator, this will be
    ///         the price of the given asset in USD, multipled by 10^8
    function latestAnswer() external view returns (int256 answer);
}
