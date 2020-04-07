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

import "../interfaces/IFeature.sol";
import "../interfaces/ISimpleFunctionRegistry.sol";
import "../interfaces/IZeroExBootstrapper.sol";
import "../fixins/FixinOwnable.sol";
import "../storage/LibProxyStorage.sol";
import "../storage/LibSimpleFunctionRegistryStorage.sol";
import "../errors/LibSimpleFunctionRegistryRichErrors.sol";


/// @dev Basic registry management features.
contract SimpleFunctionRegistry is
    IFeature,
    ISimpleFunctionRegistry,
    IZeroExBootstrapper,
    FixinOwnable
{
    // solhint-disable const-name-snakecase

    /// @dev Name of this feature.
    string constant public override FEATURE_NAME = "SimpleFunctionRegistry";
    /// @dev Version of this feature.
    uint256 constant public override FEATURE_VERSION = (1 << 64) | (0 << 32) | (0);

    /// @dev Initializes the feature implementation registry.
    /// @param impl The actual address of this feature contract.
    function bootstrap(address impl) external override {
        // Register the registration functions (inception vibes).
        _extend(this.extend.selector, impl);
        _extend(this.extendSelf.selector, impl);
        // Register the rollback function.
        _extend(this.rollback.selector, impl);
    }

    /// @dev Roll back to the last implementation of a function.
    ///      Only directly callable by an authority.
    /// @param selector The function selector.
    function rollback(bytes4 selector)
        external
        override
        onlyOwner
    {
        (
            LibSimpleFunctionRegistryStorage.Storage storage stor,
            LibProxyStorage.Storage storage proxyStor
        ) = _getStorages();

        address[] storage history = stor.implHistory[selector];
        if (history.length == 0) {
            _rrevert(
                LibSimpleFunctionRegistryRichErrors.NoRollbackHistoryError(selector)
            );
        }
        address impl = history[history.length - 1];
        address oldImpl = proxyStor.impls[selector];
        proxyStor.impls[selector] = impl;
        history.pop();
        emit ProxyFunctionUpdated(selector, oldImpl, impl);
    }

    /// @dev Register or replace a function.
    ///      Only directly callable by an authority.
    /// @param selector The function selector.
    /// @param impl The implementation contract for the function.
    function extend(bytes4 selector, address impl)
        external
        override
        onlyOwner
    {
        _extend(selector, impl);
    }

    /// @dev Register or replace a function.
    ///      Only callable from within.
    /// @param selector The function selector.
    /// @param impl The implementation contract for the function.
    function extendSelf(bytes4 selector, address impl)
        external
        override
        onlySelf
    {
        _extend(selector, impl);
    }

    /// @dev Register or replace a function.
    /// @param selector The function selector.
    /// @param impl The implementation contract for the function.
    function _extend(bytes4 selector, address impl)
        private
    {
        (
            LibSimpleFunctionRegistryStorage.Storage storage stor,
            LibProxyStorage.Storage storage proxyStor
        ) = _getStorages();

        address oldImpl = proxyStor.impls[selector];
        address[] storage history = stor.implHistory[selector];
        history.push(oldImpl);
        proxyStor.impls[selector] = impl;
        emit ProxyFunctionUpdated(selector, oldImpl, impl);
    }

    /// @dev Get the storage buckets for this feature and the proxy.
    /// @return stor Storage bucket for this feature.
    /// @return proxyStor age bucket for the proxy.
    function _getStorages()
        private
        pure
        returns (
            LibSimpleFunctionRegistryStorage.Storage storage stor,
            LibProxyStorage.Storage storage proxyStor
        )
    {
        return (
            LibSimpleFunctionRegistryStorage.getStorage(),
            LibProxyStorage.getStorage()
        );
    }
}
