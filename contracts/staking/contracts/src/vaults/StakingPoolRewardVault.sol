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

import "@0x/contracts-erc20/contracts/src/interfaces/IEtherToken.sol";
import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "../libs/LibStakingRichErrors.sol";
import "../libs/LibSafeDowncast.sol";
import "./MixinVaultCore.sol";
import "../interfaces/IStakingPoolRewardVault.sol";
import "../immutable/MixinDeploymentConstants.sol";


/// @dev This vault manages staking pool rewards.
contract StakingPoolRewardVault is
    IStakingPoolRewardVault,
    IVaultCore,
    MixinDeploymentConstants,
    Ownable,
    MixinVaultCore
{
    using LibSafeMath for uint256;

    // mapping from poolId to Pool metadata
    mapping (bytes32 => uint256) internal _balanceByPoolId;

    /// @dev Deposit an amount of WETH for `poolId` into the vault.
    ///      The staking contract should have granted the vault an allowance
    ///      because it will pull the WETH via `transferFrom()`.
    ///      Note that this is only callable by the staking contract.
    /// @param poolId Pool that holds the WETH.
    /// @param amount Amount of deposit.
    function depositFor(bytes32 poolId, uint256 amount)
        external
        onlyStakingProxy
    {
        // Transfer WETH from the staking contract into this contract.
        IEtherToken(_getWETHAddress()).transferFrom(msg.sender, address(this), amount);
        // Credit the pool.
        _balanceByPoolId[poolId] = _balanceByPoolId[poolId].safeAdd(amount);
        emit EthDepositedIntoVault(msg.sender, poolId, amount);
    }

    /// @dev Withdraw some amount in WETH from a pool.
    ///      Note that this is only callable by the staking contract.
    /// @param poolId Unique Id of pool.
    /// @param to Address to send funds to.
    /// @param amount Amount of WETH to transfer.
    function transfer(
        bytes32 poolId,
        address payable to,
        uint256 amount
    )
        external
        onlyStakingProxy
    {
        _balanceByPoolId[poolId] = _balanceByPoolId[poolId].safeSub(amount);
        IEtherToken(_getWETHAddress()).transfer(to, amount);
        emit PoolRewardTransferred(
            poolId,
            to,
            amount
        );
    }

    /// @dev Returns the balance in WETH of `poolId`
    /// @return Balance in WETH.
    function balanceOf(bytes32 poolId)
        external
        view
        returns (uint256 balance)
    {
        return _balanceByPoolId[poolId];
    }
}
