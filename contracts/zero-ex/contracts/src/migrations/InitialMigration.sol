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

import "../ZeroEx.sol";
import "../features/IBootstrap.sol";
import "../features/SimpleFunctionRegistry.sol";
import "../features/Ownable.sol";
import "./LibBootstrap.sol";


/// @dev A contract for deploying and configuring a minimal ZeroEx contract.
contract InitialMigration {
    /// @dev The deployed ZereEx instance.
    ZeroEx private _zeroEx;

    /// @dev Deploy the `ZeroEx` contract with the minimum feature set,
    ///      transfers ownership to `owner`, then self-destructs.
    /// @param owner The owner of the contract.
    /// @return zeroEx The deployed and configured `ZeroEx` contract.
    function deploy(address owner) public virtual returns (ZeroEx zeroEx) {
        // Must not have already been run.
        require(address(_zeroEx) == address(0), "InitialMigration/ALREADY_DEPLOYED");

        // Deploy the ZeroEx contract, setting ourselves as the bootstrapper.
        zeroEx = _zeroEx = new ZeroEx();

        // Bootstrap the initial feature set.
        IBootstrap(address(zeroEx)).bootstrap(
            address(this),
            abi.encodeWithSelector(this.bootstrap.selector, owner)
        );
    }

    /// @dev Sets up the initial state of the `ZeroEx` contract.
    ///      The `ZeroEx` contract will delegatecall into this function.
    /// @param owner The new owner of the ZeroEx contract.
    /// @return success Magic bytes if successful.
    function bootstrap(address owner) public virtual returns (bytes4 success) {
        // Deploy and migrate the initial features.
        // Order matters here.

        // Initialize Registry.
        SimpleFunctionRegistry registry = new SimpleFunctionRegistry();
        LibBootstrap.delegatecallBootstrapFunction(
            address(registry),
            abi.encodeWithSelector(registry.bootstrap.selector, address(registry))
        );

        // Initialize Ownable.
        Ownable ownable = new Ownable();
        LibBootstrap.delegatecallBootstrapFunction(
            address(ownable),
            abi.encodeWithSelector(ownable.bootstrap.selector, address(ownable))
        );

        // Transfer ownership to the real owner.
        Ownable(address(this)).transferOwnership(owner);

        success = LibBootstrap.BOOTSTRAP_SUCCESS;
    }
}
