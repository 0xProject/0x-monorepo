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

import "@0x/contracts-utils/contracts/src/Ownable.sol";
import "./interfaces/IStakingManager.sol";


contract MixinStakingManager is
    IStakingManager,
    Ownable
{
    // The protocol fee multiplier -- the owner can update this field.
    uint256 public protocolFeeMultiplier;

    // The address of the registered staking contract -- the owner can update this field.
    address public staking;

    // The address of the wrapped ether contract -- the owner can update this field.
    address public weth;

    /// @dev Allows the owner to update the protocol fee multiplier.
    /// @param updatedProtocolFeeMultiplier The updated protocol fee multiplier.
    function updateProtocolFeeMultiplier(uint256 updatedProtocolFeeMultiplier)
        external
        onlyOwner()
    {
        emit UpdatedProtocolFeeMultiplier(protocolFeeMultiplier, updatedProtocolFeeMultiplier);
        protocolFeeMultiplier = updatedProtocolFeeMultiplier;
    }

    /// @dev Allows the owner to update the staking address.
    /// @param updatedStaking The updated staking contract address.
    function updateStakingAddress(address updatedStaking)
        external
        onlyOwner()
    {
        emit UpdatedStakingAddress(staking, updatedStaking);
        staking = updatedStaking;
    }

    /// @dev Allows the owner to update the WETH address.
    /// @param updatedWeth The updated WETH contract address.
    function updateWethAddress(address updatedWeth)
        external
        onlyOwner()
    {
        emit UpdatedWethAddress(weth, updatedWeth);
        weth = updatedWeth;
    }
}
