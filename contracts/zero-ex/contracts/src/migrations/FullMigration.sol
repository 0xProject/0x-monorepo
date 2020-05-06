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
import "../features/PuppetPool.sol";
import "../features/TransformERC20.sol";
import "../puppets/TokenSpenderPuppet.sol";
import "./InitialMigration.sol";


/// @dev A contract for deploying and configuring the full ZeroEx contract.
contract FullMigration is
    InitialMigration
{
    // solhint-disable no-empty-blocks,indent

    /// @dev Features to add the the proxy contract.
    struct Features {
        TokenSpender tokenSpender;
        PuppetPool puppetPool;
        TransformERC20 transformERC20;
    }

    Features public features;

    /// @dev Instantiate this contract and set the allowed caller of `deploy()`
    ///      to `deployer`.
    /// @param deployer The allowed caller of `deploy()`.
    /// @param features_ Deployed addresses of the features to register.
    constructor(
        address payable deployer,
        Features memory features_
    )
        public
        InitialMigration(deployer)
    {
        features = features_;
    }

    /// @dev Deploy the `ZeroEx` contract with the full feature set,
    ///      transfer ownership to `owner`, then self-destruct.
    /// @param owner The owner of the contract.
    /// @return zeroEx The deployed and configured `ZeroEx` contract.
    function deploy(address payable owner) public override returns (ZeroEx zeroEx) {
        // Perform the initial migration with the owner set to this contract.
        zeroEx = InitialMigration.deploy(address(uint160(address(this))));

        // Add features.
        _addFeatures(zeroEx, owner);

        // Transfer ownership to the real owner.
        IOwnable(address(zeroEx)).transferOwnership(owner);
    }

    /// @dev Deploy and register features to the ZeroEx contract.
    /// @param zeroEx The bootstrapped ZeroEx contract.
    /// @param owner The ultimate owner of the ZeroEx contract.
    function _addFeatures(ZeroEx zeroEx, address owner) private {
        IOwnable ownable = IOwnable(address(zeroEx));
        // TokenSpender
        {
            // Create the puppet spender.
            TokenSpenderPuppet spenderPuppet = new TokenSpenderPuppet();
            // Let the ZeroEx contract use the puppet.
            spenderPuppet.addAuthorizedAddress(address(zeroEx));
            // Transfer ownership of the puppet to the (real) owner.
            spenderPuppet.transferOwnership(owner);
            // Register the feature.
            ownable.migrate(
                address(features.tokenSpender),
                abi.encodeWithSelector(
                    TokenSpender.migrate.selector,
                    spenderPuppet
                ),
                address(this)
            );
        }
        // PuppetPool
        {
            // Register the feature.
            ownable.migrate(
                address(features.puppetPool),
                abi.encodeWithSelector(
                    PuppetPool.migrate.selector
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
                    TransformERC20.migrate.selector
                ),
                address(this)
            );
        }
    }
}
