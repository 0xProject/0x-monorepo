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

import "@0x/contracts-utils/contracts/src/v06/errors/LibRichErrorsV06.sol";
import "@0x/contracts-utils/contracts/src/v06/LibSafeMathV06.sol";
import "../errors/LibPuppetRichErrors.sol";
import "../fixins/FixinCommon.sol";
import "../migrations/LibMigrate.sol";
import "../puppets/IPuppet.sol";
import "../puppets/Puppet.sol";
import "../storage/LibPuppetPoolStorage.sol";
import "./ISimpleFunctionRegistry.sol";
import "./IPuppetPool.sol";
import "./IFeature.sol";


/// @dev Feature to manage a pool of puppet workers.
contract PuppetPool is
    IFeature,
    IPuppetPool,
    FixinCommon
{
    // solhint-disable const-name-snakecase
    /// @dev Name of this feature.
    string constant public override FEATURE_NAME = "PuppetPool";
    /// @dev Version of this feature.
    uint256 constant public override FEATURE_VERSION = (1 << 64) | (0 << 32) | (0);
    // solhint-enable const-name-snakecase

    /// @dev The implementation address of this feature.
    address private immutable _impl;

    using LibSafeMathV06 for uint256;
    using LibRichErrorsV06 for bytes;

    constructor() public {
        _impl = address(this);
    }

    /// @dev Initialize and register this feature. Should be delegatecalled
    ///      into during a `Migrate.migrate()`.
    function migrate() external returns (bytes4 success) {
        // Register this feature's functions.
        ISimpleFunctionRegistry(address(this))
            .extend(this.createFreePuppet.selector, _impl);
        ISimpleFunctionRegistry(address(this))
            .extend(this._acquirePuppet.selector, _impl);
        ISimpleFunctionRegistry(address(this))
            .extend(this._releasePuppet.selector, _impl);
        ISimpleFunctionRegistry(address(this))
            .extend(this.getFreePuppetsCount.selector, _impl);
        ISimpleFunctionRegistry(address(this))
            .extend(this.isPuppet.selector, _impl);
        return LibMigrate.MIGRATE_SUCCESS;
    }

    /// @dev Create a new, free puppet to add to the pool. Anyone can call this.
    /// @return puppet The new puppet's address.
    function createFreePuppet()
        external
        override
        returns (address puppet)
    {
        return address(_createPuppet(LibPuppetPoolStorage.PuppetState.Free));
    }

    /// @dev Acquire a new puppet instance. This removes the puppet from the
    ///      pool. If one is not available, a new one will be deployed.
    ///      Only callable from within.
    /// @return puppet The acquired puppet.
    function _acquirePuppet()
        external
        override
        onlySelf
        returns (IPuppet puppet)
    {
        LibPuppetPoolStorage.Storage storage stor = LibPuppetPoolStorage.getStorage();
        uint256 numFreePuppets = stor.freePuppets.length;
        if (numFreePuppets == 0) {
            puppet = _createPuppet(LibPuppetPoolStorage.PuppetState.Acquired);
        } else {
            puppet = stor.freePuppets[numFreePuppets - 1];
            stor.puppetState[address(puppet)] = LibPuppetPoolStorage.PuppetState.Acquired;
            stor.freePuppets.pop();
        }
    }

    /// @dev Release an acquired puppet instance back into the pool.
    ///      Only callable from within.
    /// @param puppet The puppet to return to the pool.
    function _releasePuppet(IPuppet puppet)
        external
        override
        onlySelf
    {
        LibPuppetPoolStorage.Storage storage stor = LibPuppetPoolStorage.getStorage();
        // Validate puppet state.
        LibPuppetPoolStorage.PuppetState state = stor.puppetState[address(puppet)];
        if (state == LibPuppetPoolStorage.PuppetState.Invalid) {
            LibPuppetRichErrors.InvalidPuppetInstanceError(address(puppet)).rrevert();
        } else if (state == LibPuppetPoolStorage.PuppetState.Free) {
            LibPuppetRichErrors.PuppetNotAcquiredError(address(puppet)).rrevert();
        }
        // Return the puppet to the pool.
        stor.puppetState[address(puppet)] = LibPuppetPoolStorage.PuppetState.Free;
        stor.freePuppets.push(Puppet(address(uint160(address(puppet)))));
    }

    /// @dev Gets the number of free puppets in the pool.
    /// @return count The number of free puppets in the pool.
    function getFreePuppetsCount()
        external
        override
        view
        returns (uint256 count)
    {
        return LibPuppetPoolStorage.getStorage().freePuppets.length;
    }

    /// @dev Check if an address is a puppet instance.
    /// @param puppet The address to check.
    /// @return isPuppet_ `true` if `puppet` is a puppet instance.
    function isPuppet(address puppet)
        external
        override
        view
        returns (bool isPuppet_)
    {
        LibPuppetPoolStorage.PuppetState state =
            LibPuppetPoolStorage.getStorage().puppetState[address(puppet)];
        return state != LibPuppetPoolStorage.PuppetState.Invalid;
    }

    /// @dev Deploy a new puppet instance with the provided state.
    ///      If `state` is `Free`, this will also add it to the free puppets pool.
    /// @param state The state of the puppet.
    /// @return puppet The new puppet instance.
    function _createPuppet(LibPuppetPoolStorage.PuppetState state)
        private
        returns (Puppet puppet)
    {
        LibPuppetPoolStorage.Storage storage stor = LibPuppetPoolStorage.getStorage();
        puppet = new Puppet();
        puppet.addAuthorizedAddress(address(this));
        stor.puppetState[address(puppet)] = state;
        if (state == LibPuppetPoolStorage.PuppetState.Free) {
            stor.freePuppets.push(puppet);
        }
        emit PuppetCreated(address(puppet));
    }
}
