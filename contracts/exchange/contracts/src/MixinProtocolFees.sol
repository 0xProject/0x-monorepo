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
import "./interfaces/IProtocolFees.sol";


contract MixinProtocolFees is
    IProtocolFees,
    Ownable
{
    // The protocol fee multiplier -- the owner can update this field.
    uint256 public protocolFeeMultiplier;

    // The address of the registered protocolFeeCollector contract -- the owner can update this field.
    address public protocolFeeCollector;

    /// @dev Allows the owner to update the protocol fee multiplier.
    /// @param updatedProtocolFeeMultiplier The updated protocol fee multiplier.
    function setProtocolFeeMultiplier(uint256 updatedProtocolFeeMultiplier)
        external
        onlyOwner
    {
        emit ProtocolFeeMultiplier(protocolFeeMultiplier, updatedProtocolFeeMultiplier);
        protocolFeeMultiplier = updatedProtocolFeeMultiplier;
    }

    /// @dev Allows the owner to update the protocolFeeCollector address.
    /// @param updatedProtocolFeeCollector The updated protocolFeeCollector contract address.
    function setProtocolFeeCollectorAddress(address updatedProtocolFeeCollector)
        external
        onlyOwner
    {
        emit ProtocolFeeCollectorAddress(protocolFeeCollector, updatedProtocolFeeCollector);
        protocolFeeCollector = updatedProtocolFeeCollector;
    }
}
