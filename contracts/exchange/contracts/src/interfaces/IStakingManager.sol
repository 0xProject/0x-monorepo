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


contract IStakingManager {

    // The proxy id of the weth asset proxy.
    bytes internal constant WETH_ASSET_DATA = hex"f47261b0";

    // Logs updates to the protocol fee multiplier.
    event UpdatedProtocolFeeMultiplier(uint256 oldProtocolFeeMultiplier, uint256 updatedProtocolFeeMultiplier);

    // Logs updates to the staking address.
    event UpdatedStakingAddress(address oldStaking, address updatedStaking);

    // Logs updates to the weth address.
    event UpdatedWethAddress(address oldWeth, address updatedWeth);

    /// @dev Allows the owner to update the protocol fee multiplier.
    /// @param updatedProtocolFeeMultiplier The updated protocol fee multiplier.
    function updateProtocolFeeMultiplier(uint256 updatedProtocolFeeMultiplier)
        external;

    /// @dev Allows the owner to update the staking address.
    /// @param updatedStaking The updated staking contract address.
    function updateStakingAddress(address updatedStaking)
        external;

    /// @dev Allows the owner to update the WETH address.
    /// @param updatedWeth The updated WETH contract address.
    function updateWethAddress(address updatedWeth)
        external;
}
