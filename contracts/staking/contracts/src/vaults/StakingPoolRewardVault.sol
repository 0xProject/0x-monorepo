/*

  Copyright 2019 ZeroEx Intl.

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
pragma experimental ABIEncoderV2;

import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "../libs/LibStakingRichErrors.sol";
import "../libs/LibSafeDowncast.sol";
import "./MixinVaultCore.sol";
import "../interfaces/IStakingPoolRewardVault.sol";
import "../interfaces/IEthVault.sol";
import "../immutable/MixinConstants.sol";


/// @dev This vault manages staking pool rewards.
contract StakingPoolRewardVault is
    IStakingPoolRewardVault,
    MixinConstants,
    MixinVaultCore
{
    using LibSafeMath for uint256;

    // mapping from poolId to Pool metadata
    mapping (bytes32 => uint256) internal balanceByPoolId;

    // address of ether vault
    IEthVault internal _ethVault;

    /// @dev Sets the Eth Vault.
    /// Note that only the contract owner can call this.
    /// @param ethVaultAddress Address of the Eth Vault.
    function setEthVault(address ethVaultAddress)
        external
        onlyOwner
    {
        _ethVault = IEthVault(ethVaultAddress);
        emit EthVaultChanged(ethVaultAddress);
    }

    /// @dev Deposit an amount of ETH (`msg.value`) for `poolId` into the vault.
    /// Note that this is only callable by the staking contract.
    /// @param poolId that holds the ETH.
    function depositFor(bytes32 poolId)
        external
        payable
        onlyStakingContract
    {
        balanceByPoolId[poolId] = balanceByPoolId[poolId].safeAdd(msg.value);
        emit EthDepositedIntoVault(msg.sender, poolId, msg.value);
    }

    /// @dev Withdraw some amount in ETH of a pool member.
    /// Note that this is only callable by the staking contract.
    /// @param poolId Unique Id of pool.
    /// @param amount Amount in ETH to transfer.
    function transferToEthVault(
        bytes32 poolId,
        address member,
        uint256 amount
    )
        external
        onlyStakingProxy
    {
        // sanity check on eth vault
        if (address(_ethVault) == address(0)) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.EthVaultNotSetError()
            );
        }

        // perform transfer
        balanceByPoolId[poolId] = balanceByPoolId[poolId].safeSub(amount);
        _ethVault.depositFor.value(amount)(member);
        emit PoolRewardTransferredToEthVault(
            poolId,
            member,
            amount
        );
    }

    /// @dev Returns the balance in ETH of `poolId`
    /// @return Balance in ETH.
    function balanceOf(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return balanceByPoolId[poolId];
    }
}
