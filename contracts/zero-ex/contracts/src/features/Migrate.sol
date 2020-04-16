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
import "../errors/LibOwnableRichErrors.sol";
import "../storage/LibOwnableStorage.sol";
import "../storage/LibMigrateStorage.sol";
import "../migrations/LibMigrate.sol";
import "../migrations/LibBootstrap.sol";
import "./IFeature.sol";
import "./IMigrate.sol";
import "./ISimpleFunctionRegistry.sol";


/// @dev Migration features.
contract Migrate is
    IFeature,
    IMigrate,
    FixinOwnable
{
    // solhint-disable const-name-snakecase

    /// @dev Name of this feature.
    string constant public override FEATURE_NAME = "Migrate";
    /// @dev Version of this feature.
    uint256 constant public override FEATURE_VERSION = (1 << 64) | (0 << 32) | (0);

    /// @dev Initializes this feature.
    /// @param impl The actual address of this feature contract.
    /// @return success Magic bytes if successful.
    function bootstrap(address impl) external returns (bytes4 success) {
        // Register feature functions.
        ISimpleFunctionRegistry(address(this)).extend(this.migrate.selector, impl);
        ISimpleFunctionRegistry(address(this)).extend(this.getMigrationOwner.selector, impl);
        return LibBootstrap.BOOTSTRAP_SUCCESS;
    }

    /// @dev Execute a migration function in the context of the ZeroEx contract.
    ///      The result of the function being called should be the magic bytes
    ///      0x2c64c5ef. Only callable by the owner.
    ///      The owner will be temporarily set to `address(this)` inside the call.
    ///      The original owner can be retrieved through `getMigrationOwner()`.`
    /// @param target The migrator contract address.
    /// @param data The call data.
    function migrate(address target, bytes calldata data)
        external
        override
        onlyOwner
    {
        LibOwnableStorage.Storage storage ownableStor = LibOwnableStorage.getStorage();
        LibMigrateStorage.Storage storage stor = LibMigrateStorage.getStorage();
        address prevOwner = ownableStor.owner;
        if (prevOwner == address(this)) {
            // If the owner is already set to ourselves then we've reentered.
            _rrevert(LibMigrateRichErrors.AlreadyMigratingError());
        }
        // Temporarily set the owner to ourselves.
        ownableStor.owner = address(this);
        stor.migrationOwner = prevOwner;

        // Perform the migration.
        LibMigrate.delegatecallMigrateFunction(target, data);

        // Restore the owner.
        ownableStor.owner = prevOwner;
        stor.migrationOwner = address(0);

        emit Migrated(msg.sender, target);
    }

    /// @dev Get the true owner of this contract during a migration.
    /// @return owner The true owner of this contract.
    function getMigrationOwner() external override view returns (address owner) {
        return LibMigrateStorage.getStorage().migrationOwner;
    }
}
