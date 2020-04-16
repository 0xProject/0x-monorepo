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


/// @dev Migration features.
interface IMigrate {

    /// @dev Emitted when `migrate()` is called.
    /// @param caller The caller of `migrate()`.
    /// @param migrator The migration contract.
    event Migrated(address caller, address migrator);

    /// @dev Execute a migration function in the context of the ZeroEx contract.
    ///      The result of the function being called should be the magic bytes
    ///      0x2c64c5ef. Only callable by the owner.
    ///      The owner will be temporarily set to `address(this)` inside the call.
    ///      The original owner can be retrieved through `getMigrationOwner()`.`
    /// @param target The migrator contract address.
    /// @param data The call data.
    function migrate(address target, bytes calldata data) external;

    /// @dev Get the true owner of this contract during a migration.
    /// @return owner The true owner of this contract.
    function getMigrationOwner() external view returns (address owner);
}
