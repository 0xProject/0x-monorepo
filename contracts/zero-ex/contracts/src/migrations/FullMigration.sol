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
import "../features/IOwnable.sol";
import "../features/TokenSpender.sol";
import "../features/TransformERC20.sol";
import "../external/AllowanceTarget.sol";
import "./InitialMigration.sol";


/// @dev A contract for deploying and configuring the full ZeroEx contract.
contract FullMigration {

    // solhint-disable no-empty-blocks,indent

    /// @dev Features to add the the proxy contract.
    struct Features {
        SimpleFunctionRegistry registry;
        Ownable ownable;
        TokenSpender tokenSpender;
        TransformERC20 transformERC20;
    }

    /// @dev Parameters needed to initialize features.
    struct MigrateOpts {
        address transformerDeployer;
    }

    /// @dev The allowed caller of `deploy()`.
    address public immutable deployer;
    /// @dev The initial migration contract.
    InitialMigration private _initialMigration;

    /// @dev Instantiate this contract and set the allowed caller of `deploy()`
    ///      to `deployer`.
    /// @param deployer_ The allowed caller of `deploy()`.
    constructor(address payable deployer_)
        public
    {
        deployer = deployer_;
        // Create an initial migration contract with this contract set to the
        // allowed deployer.
        _initialMigration = new InitialMigration(address(this));
    }

    /// @dev Deploy the `ZeroEx` contract with the full feature set,
    ///      transfer ownership to `owner`, then self-destruct.
    /// @param owner The owner of the contract.
    /// @param features Features to add to the proxy.
    /// @return zeroEx The deployed and configured `ZeroEx` contract.
    /// @param migrateOpts Parameters needed to initialize features.
    function deploy(
        address payable owner,
        Features memory features,
        MigrateOpts memory migrateOpts
    )
        public
        returns (ZeroEx zeroEx)
    {
        require(msg.sender == deployer, "FullMigration/INVALID_SENDER");

        // Perform the initial migration with the owner set to this contract.
        zeroEx = _initialMigration.deploy(
            address(uint160(address(this))),
            InitialMigration.BootstrapFeatures({
                registry: features.registry,
                ownable: features.ownable
            })
        );

        // Add features.
        _addFeatures(zeroEx, owner, features, migrateOpts);

        // Transfer ownership to the real owner.
        IOwnable(address(zeroEx)).transferOwnership(owner);

        // Self-destruct.
        this.die(owner);
    }

    /// @dev Destroy this contract. Only callable from ourselves (from `deploy()`).
    /// @param ethRecipient Receiver of any ETH in this contract.
    function die(address payable ethRecipient)
        external
        virtual
    {
        require(msg.sender == address(this), "FullMigration/INVALID_SENDER");
        // This contract should not hold any funds but we send
        // them to the ethRecipient just in case.
        selfdestruct(ethRecipient);
    }

    /// @dev Deploy and register features to the ZeroEx contract.
    /// @param zeroEx The bootstrapped ZeroEx contract.
    /// @param owner The ultimate owner of the ZeroEx contract.
    /// @param features Features to add to the proxy.
    /// @param migrateOpts Parameters needed to initialize features.
    function _addFeatures(
        ZeroEx zeroEx,
        address owner,
        Features memory features,
        MigrateOpts memory migrateOpts
    )
        private
    {
        IOwnable ownable = IOwnable(address(zeroEx));
        // TokenSpender
        {
            // Create the allowance target.
            AllowanceTarget allowanceTarget = new AllowanceTarget();
            // Let the ZeroEx contract use the allowance target.
            allowanceTarget.addAuthorizedAddress(address(zeroEx));
            // Transfer ownership of the allowance target to the (real) owner.
            allowanceTarget.transferOwnership(owner);
            // Register the feature.
            ownable.migrate(
                address(features.tokenSpender),
                abi.encodeWithSelector(
                    TokenSpender.migrate.selector,
                    allowanceTarget
                ),
                address(this)
            );
        }
        // TransformERC20
        {
            // Register the feature.
            ownable.migrate(
                address(features.transformERC20),
                abi.encodeWithSelector(
                    TransformERC20.migrate.selector,
                    migrateOpts.transformerDeployer
                ),
                address(this)
            );
        }
    }
}
