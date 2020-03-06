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

pragma solidity ^0.5.16;


contract MaximumGasPrice {
    // 20 Gwei
    uint256 constant private DEFAULT_MAX_GAS_PRICE = 20 * (10 ** 9);

    /// @dev Checks that the current transaction's gas price is less than
    ///      the default maximum value of 20 Gwei.
    function checkGasPrice()
        external
        view
    {
        require(
            tx.gasprice <= DEFAULT_MAX_GAS_PRICE,
            "MaximumGasPrice/GAS_PRICE_EXCEEDS_20_GWEI"
        );
    }

    /// @dev Checks that the current transaction's gas price is less than
    ///      the specified maximum value.
    /// @param maxGasPrice The maximum gas price allowed for the current transaction.
    function checkGasPrice(uint256 maxGasPrice)
        external
        view
    {
        require(
            tx.gasprice <= maxGasPrice,
            "MaximumGasPrice/GAS_PRICE_EXCEEDS_MAXIMUM"
        );
    }
}
