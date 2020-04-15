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
import "../features/SimpleFunctionRegistry.sol";
import "../features/Ownable.sol";
import "../interfaces/IOwnable.sol";
import "../interfaces/IZeroExBootstrapper.sol";
import "../interfaces/ISimpleFunctionRegistry.sol";


/// @dev A contract for deploying and configuring a minimal ZeroEx contract.
contract BasicMigration {

    /// @dev Deploy the `ZeroEx` contract with the minimum feature set.
    /// @param owner The owner of the contract.
    /// @return zeroEx The deployed and configured `ZeroEx` contract.
    function migrate(address owner) external returns (ZeroEx zeroEx) {
        // Deploy the ZeroEx contract.
        zeroEx = new ZeroEx();

        // Bootstrap the initial feature set.
        zeroEx.bootstrap(_createBootstrappers());

        // Disable the `extendSelf()` function by rolling it back to zero.
        ISimpleFunctionRegistry(address(zeroEx))
            .rollback(ISimpleFunctionRegistry.extendSelf.selector, address(0));

        // Call the _postInitialize hook.
        _postInitialize(zeroEx);

        // Transfer ownership.
        if (owner != address(this)) {
            IOwnable(address(zeroEx)).transferOwnership(owner);
        }
    }

    function _createBootstrappers()
        internal
        virtual
        returns (IZeroExBootstrapper[] memory bootstrappers)
    {
        bootstrappers = new IZeroExBootstrapper[](2);
        bootstrappers[0] = IZeroExBootstrapper(address(new SimpleFunctionRegistry()));
        bootstrappers[1] = IZeroExBootstrapper(address(new Ownable()));
    }

    // solhint-disable no-empty-blocks
    function _postInitialize(ZeroEx zeroEx) internal virtual {
        // Override me.
    }
}
