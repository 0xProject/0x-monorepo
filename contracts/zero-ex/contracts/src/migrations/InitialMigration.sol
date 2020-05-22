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

    /// @dev Features to bootstrap into the the proxy contract.
    struct BootstrapFeatures {
        SimpleFunctionRegistry registry;
        Ownable ownable;
    }

    /// @dev The allowed caller of `deploy()`. In production, this would be
    ///      the governor.
    address public immutable deployer;
    /// @dev The real address of this contract.
    address private immutable _implementation;

    /// @dev Instantiate this contract and set the allowed caller of `deploy()`
    ///      to `deployer_`.
    /// @param deployer_ The allowed caller of `deploy()`.
    constructor(address deployer_) public {
        deployer = deployer_;
        _implementation = address(this);
    }

    /// @dev Deploy the `ZeroEx` contract with the minimum feature set,
    ///      transfers ownership to `owner`, then self-destructs.
    ///      Only callable by `deployer` set in the contstructor.
    /// @param owner The owner of the contract.
    /// @param features Features to bootstrap into the proxy.
    /// @return zeroEx The deployed and configured `ZeroEx` contract.
    function deploy(address payable owner, BootstrapFeatures memory features)
        public
        virtual
        returns (ZeroEx zeroEx)
    {
        // Must be called by the allowed deployer.
        require(msg.sender == deployer, "InitialMigration/INVALID_SENDER");

        // Deploy the ZeroEx contract, setting ourselves as the bootstrapper.
        zeroEx = new ZeroEx();

        // Bootstrap the initial feature set.
        IBootstrap(address(zeroEx)).bootstrap(
            address(this),
            abi.encodeWithSelector(this.bootstrap.selector, owner, features)
        );

        // Self-destruct. This contract should not hold any funds but we send
        // them to the owner just in case.
        this.die(owner);
    }

    /// @dev Sets up the initial state of the `ZeroEx` contract.
    ///      The `ZeroEx` contract will delegatecall into this function.
    /// @param owner The new owner of the ZeroEx contract.
    /// @param features Features to bootstrap into the proxy.
    /// @return success Magic bytes if successful.
    function bootstrap(address owner, BootstrapFeatures memory features)
        public
        virtual
        returns (bytes4 success)
    {
        // Deploy and migrate the initial features.
        // Order matters here.

        // Initialize Registry.
        LibBootstrap.delegatecallBootstrapFunction(
            address(features.registry),
            abi.encodeWithSelector(
                SimpleFunctionRegistry.bootstrap.selector
            )
        );

        // Initialize Ownable.
        LibBootstrap.delegatecallBootstrapFunction(
            address(features.ownable),
            abi.encodeWithSelector(
                Ownable.bootstrap.selector
            )
        );

        // De-register `SimpleFunctionRegistry._extendSelf`.
        SimpleFunctionRegistry(address(this)).rollback(
            SimpleFunctionRegistry._extendSelf.selector,
            address(0)
        );

        // Transfer ownership to the real owner.
        Ownable(address(this)).transferOwnership(owner);

        success = LibBootstrap.BOOTSTRAP_SUCCESS;
    }

    /// @dev Self-destructs this contract. Only callable by this contract.
    /// @param ethRecipient Who to transfer outstanding ETH to.
    function die(address payable ethRecipient) public virtual {
        require(msg.sender == _implementation, "InitialMigration/INVALID_SENDER");
        selfdestruct(ethRecipient);
    }
}
