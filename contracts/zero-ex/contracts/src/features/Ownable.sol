/*

  Copyright 2020 ZeroEx Intl.

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

pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "../fixins/FixinOwnable.sol";
import "../interfaces/IFeature.sol";
import "../interfaces/IOwnable.sol";
import "../interfaces/ISimpleFunctionRegistry.sol";
import "../interfaces/IZeroExBootstrapper.sol";
import "../errors/LibOwnableRichErrors.sol";
import "../storage/LibOwnableStorage.sol";


/// @dev Owner management features.
contract Ownable is
    IFeature,
    IOwnable,
    IZeroExBootstrapper,
    FixinOwnable
{
    // solhint-disable const-name-snakecase

    /// @dev Name of this feature.
    string constant public override FEATURE_NAME = "Ownable";
    /// @dev Version of this feature.
    uint256 constant public override FEATURE_VERSION = (1 << 64) | (0 << 32) | (0);

    /// @dev Initializes the authority feature.
    /// @param impl The actual address of this feature contract.
    function bootstrap(address impl) external override {
        // Set the owner.
        LibOwnableStorage.getStorage().owner = msg.sender;

        // Register feature functions.
        ISimpleFunctionRegistry(address(this)).extendSelf(this.transferOwnership.selector, impl);
        ISimpleFunctionRegistry(address(this)).extendSelf(this.getOwner.selector, impl);
    }

    /// @dev Change the owner of this contract.
    ///      Only directly callable by the owner.
    /// @param newOwner New owner address.
    function transferOwnership(address newOwner)
        external
        override
        onlyOwner
    {
        LibOwnableStorage.Storage storage proxyStor = LibOwnableStorage.getStorage();

        if (newOwner == address(0)) {
            _rrevert(LibOwnableRichErrors.TransferOwnerToZeroError());
        } else {
            proxyStor.owner = newOwner;
            emit OwnershipTransferred(msg.sender, newOwner);
        }
    }

    /// @dev Get the owner of this contract.
    /// @return owner_ The owner of this contract.
    function getOwner() external override view returns (address owner_) {
        return LibOwnableStorage.getStorage().owner;
    }
}
