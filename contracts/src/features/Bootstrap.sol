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
import "../migrations/LibBootstrap.sol";
import "../storage/LibProxyStorage.sol";
import "./IBootstrap.sol";


/// @dev Detachable `bootstrap()` feature.
contract Bootstrap is
    IBootstrap
{
    // solhint-disable state-visibility,indent
    /// @dev The ZeroEx contract.
    ///      This has to be immutable to persist across delegatecalls.
    address immutable private _deployer;
    /// @dev The implementation address of this contract.
    ///      This has to be immutable to persist across delegatecalls.
    address immutable private _implementation;
    /// @dev The deployer.
    ///      This has to be immutable to persist across delegatecalls.
    address immutable private _bootstrapCaller;
    // solhint-enable state-visibility,indent

    using LibRichErrorsV06 for bytes;

    /// @dev Construct this contract and set the bootstrap migration contract.
    ///      After constructing this contract, `bootstrap()` should be called
    ///      to seed the initial feature set.
    /// @param bootstrapCaller The allowed caller of `bootstrap()`.
    constructor(address bootstrapCaller) public {
        _deployer = msg.sender;
        _implementation = address(this);
        _bootstrapCaller = bootstrapCaller;
    }

    /// @dev Bootstrap the initial feature set of this contract by delegatecalling
    ///      into `target`. Before exiting the `bootstrap()` function will
    ///      deregister itself from the proxy to prevent being called again.
    /// @param target The bootstrapper contract address.
    /// @param callData The call data to execute on `target`.
    function bootstrap(address target, bytes calldata callData) external override {
        // Only the bootstrap caller can call this function.
        if (msg.sender != _bootstrapCaller) {
            LibProxyRichErrors.InvalidBootstrapCallerError(
                msg.sender,
                _bootstrapCaller
            ).rrevert();
        }
        // Deregister.
        LibProxyStorage.getStorage().impls[this.bootstrap.selector] = address(0);
        // Self-destruct.
        Bootstrap(_implementation).die();
        // Call the bootstrapper.
        LibBootstrap.delegatecallBootstrapFunction(target, callData);
    }

    /// @dev Self-destructs this contract.
    ///      Can only be called by the deployer.
    function die() external {
        if (msg.sender != _deployer) {
            LibProxyRichErrors.InvalidDieCallerError(msg.sender, _deployer).rrevert();
        }
        selfdestruct(msg.sender);
    }
}
