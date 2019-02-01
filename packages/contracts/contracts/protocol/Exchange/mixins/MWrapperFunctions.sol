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

import "../libs/LibOrder.sol";
import "../libs/LibFillResults.sol";
import "../interfaces/IWrapperFunctions.sol";


contract MWrapperFunctions is 
    IWrapperFunctions
{
    /// @dev Fills the input order. Reverts if exact takerAssetFillAmount not filled.
    /// @param order LibOrder.Order struct containing order specifications.
    /// @param takerAssetFillAmount Desired amount of takerAsset to sell.
    /// @param signature Proof that order has been created by maker.
    function fillOrKillOrderInternal(
        LibOrder.Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature
    )
        internal
        returns (LibFillResults.FillResults memory fillResults);
}
