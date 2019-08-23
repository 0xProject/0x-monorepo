/*

  Copyright 2018 ZeroEx Intl.

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

pragma solidity ^0.5.9;

import "@0x/contracts-utils/contracts/src/Authorizable.sol";
import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "../libs/LibStakingRichErrors.sol";
import "../interfaces/IVaultCore.sol";


/// @dev This mixin contains core logic for vaults.
/// This includes management of the staking contract
/// and setting the vault to "Catastrophic Failure Mode".
/// It's up to the vault how they handle this failure mode; however,
/// all vaults should disable all functionality aside from withdrawals.
/// Vaults should only be set to Catastrophic Failure Mode iff there is
/// non-recoverable corruption of the staking contracts. If there is a
/// recoverable flaw/bug/vulnerability, simply detach the staking contract
/// by setting its address to `address(0)`. Once in Catastrophic Failure Mode,
/// a vault cannot be reset to normal mode; this prevents corruption of related
/// state in the staking contract.
contract MixinVaultCore is
    Authorizable,
    IVaultCore
{

    // Address of staking contract
    address payable internal stakingContractAddress;

    // True iff vault has been set to Catastrophic Failure Mode
    bool internal isInCatastrophicFailure;

    /// @dev Constructor.
    constructor() public {
        stakingContractAddress = 0x0000000000000000000000000000000000000000;
        isInCatastrophicFailure = false;
    }

    /// @dev Asserts that the sender (`msg.sender`) is the staking contract.
    modifier onlyStakingContract {
        if (msg.sender != stakingContractAddress) {
            LibRichErrors.rrevert(LibStakingRichErrors.OnlyCallableByStakingContractError(
                msg.sender
            ));
        }
        _;
    }

    /// @dev Asserts that this contract *is in* Catastrophic Failure Mode.
    modifier onlyInCatastrophicFailure {
        if (!isInCatastrophicFailure) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.OnlyCallableInCatastrophicFailureError()
            );
        }
        _;
    }

    /// @dev Asserts that this contract *is not in* Catastrophic Failure Mode.
    modifier onlyNotInCatastrophicFailure {
        if (isInCatastrophicFailure) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.OnlyCallableNotInCatastrophicFailureError()
            );
        }
        _;
    }

    /// @dev Sets the address of the Staking Contract.
    /// Note that only the contract owner can call this function.
    /// @param _stakingContractAddress Address of Staking contract.
    function setStakingContract(address payable _stakingContractAddress)
        external
        onlyOwner
    {
        stakingContractAddress = _stakingContractAddress;
        emit StakingContractChanged(stakingContractAddress);
    }

    /// @dev Vault enters into Catastrophic Failure Mode.
    /// *** WARNING - ONCE IN CATOSTROPHIC FAILURE MODE, YOU CAN NEVER GO BACK! ***
    /// Note that only the contract owner can call this function.
    function enterCatastrophicFailure()
        external
        onlyOwner
    {
        isInCatastrophicFailure = true;
        emit InCatastrophicFailureMode(msg.sender);
    }
}
