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

import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "../libs/LibStakingRichErrors.sol";
import "../libs/LibSafeDowncast.sol";
import "./MixinVaultCore.sol";
import "../interfaces/IStakingPoolRewardVault.sol";
import "../interfaces/IEthVault.sol";
import "../immutable/MixinConstants.sol";


/// @dev This vault manages staking pool rewards.
/// Rewards can be deposited and withdrawn by the staking contract.
/// There is a "Catastrophic Failure Mode" that, when invoked, only
/// allows withdrawals to be made. Once this vault is in catastrophic
/// failure mode, it cannot be returned to normal mode; this prevents
/// corruption of related state in the staking contract.
///
/// When in Catastrophic Failure Mode, the Staking contract can still
/// perform withdrawals on behalf of its users.
contract StakingPoolRewardVault is
    Authorizable,
    IStakingPoolRewardVault,
    IVaultCore,
    MixinConstants,
    MixinVaultCore
{

    using LibSafeMath for uint256;
    using LibSafeDowncast for uint256;

    // mapping from poolId to Pool metadata
    mapping (bytes32 => Pool) internal poolById;

    // address of ether vault
    IEthVault internal ethVault;

    /// @dev Fallback function. This contract is payable, but only by the staking contract.
    function ()
        external
        payable
        onlyStakingContract
        onlyNotInCatastrophicFailure
    {
        emit RewardDeposited(UNKNOWN_STAKING_POOL_ID, msg.value);
    }

    /// @dev Sets the Eth Vault.
    /// Note that only the contract owner can call this.
    /// @param ethVaultAddress Address of the Eth Vault.
    function setEthVault(address ethVaultAddress)
        external
        onlyOwner
    {
        ethVault = IEthVault(ethVaultAddress);
        emit EthVaultChanged(ethVaultAddress);
    }

    /// @dev Record a deposit for a pool. This deposit should be in the same transaction,
    /// which is enforced by the staking contract. We do not enforce it here to save (a lot of) gas.
    /// Note that this is only callable by the staking contract, and when
    /// not in catastrophic failure mode.
    /// @param poolId Unique Id of pool.
    /// @param amount Amount in ETH to record.
    /// @param operatorOnly Only attribute amount to operator.
    /// @return operatorPortion Portion of amount attributed to the operator.
    /// @return membersPortion Portion of amount attributed to the pool.
    function recordDepositFor(
        bytes32 poolId,
        uint256 amount,
        bool operatorOnly
    )
        external
        onlyStakingContract
        returns (
            uint256 operatorPortion,
            uint256 membersPortion
        )
    {
        // update balance of pool
        (operatorPortion, membersPortion) = _incrementPoolBalances(poolById[poolId], amount, operatorOnly);
        return (operatorPortion, membersPortion);
    }

    /// @dev Withdraw some amount in ETH of an operator's reward.
    /// Note that this is only callable by the staking contract, and when
    /// not in catastrophic failure mode.
    /// @param poolId Unique Id of pool.
    function transferOperatorBalanceToEthVault(
        bytes32 poolId,
        address operator,
        uint256 amount
    )
        external
        onlyStakingContract
    {
        if (amount == 0) {
            return;
        }

        // sanity check - sufficient balance?
        uint256 operatorBalance = uint256(poolById[poolId].operatorBalance);
        if (amount > operatorBalance) {
            LibRichErrors.rrevert(LibStakingRichErrors.AmountExceedsBalanceOfPoolError(
                amount,
                poolById[poolId].operatorBalance
            ));
        }

        // update balance and transfer `amount` in ETH to staking contract
        poolById[poolId].operatorBalance = operatorBalance.safeSub(amount).downcastToUint96();
        _transferToEthVault(operator, amount);

        // notify
        emit RewardWithdrawnForOperator(poolId, amount);
    }

    /// @dev Withdraw some amount in ETH of a pool member.
    /// Note that this is only callable by the staking contract, and when
    /// not in catastrophic failure mode.
    /// @param poolId Unique Id of pool.
    /// @param amount Amount in ETH to transfer.
    function transferMemberBalanceToEthVault(
        bytes32 poolId,
        address member,
        uint256 amount
    )
        external
        onlyStakingContract
    {
        if (amount == 0) {
            return;
        }

        // sanity check - sufficient balance?
        uint256 membersBalance = uint256(poolById[poolId].membersBalance);
        if (amount > membersBalance) {
            LibRichErrors.rrevert(LibStakingRichErrors.AmountExceedsBalanceOfPoolError(
                amount,
                poolById[poolId].membersBalance
            ));
        }

        // update balance and transfer `amount` in ETH to staking contract
        poolById[poolId].membersBalance = membersBalance.safeSub(amount).downcastToUint96();
        _transferToEthVault(member, amount);

        // notify
        emit RewardWithdrawnForMember(poolId, amount);
    }

    /// @dev Register a new staking pool.
    /// Note that this is only callable by the staking contract, and when
    /// not in catastrophic failure mode.
    /// @param poolId Unique Id of pool.
    /// @param operatorShare Fraction of rewards given to the pool operator, in ppm.
    function registerStakingPool(
        bytes32 poolId,
        address payable operatorAddress,
        uint32 operatorShare
    )
        external
        onlyStakingContract
        onlyNotInCatastrophicFailure
    {
        // operator share must be a valid fraction
        if (operatorShare > PPM_DENOMINATOR) {
            LibRichErrors.rrevert(LibStakingRichErrors.OperatorShareError(
                LibStakingRichErrors.OperatorShareErrorCodes.OPERATOR_SHARE_MUST_BE_BETWEEN_0_AND_100,
                poolId,
                operatorShare
            ));
        }

        // pool must not exist
        Pool storage pool = poolById[poolId];
        if (pool.initialized) {
            LibRichErrors.rrevert(LibStakingRichErrors.PoolAlreadyExistsError(
                poolId
            ));
        }

        // initialize pool
        pool.initialized = true;
        pool.operatorAddress = operatorAddress;
        pool.operatorShare = operatorShare;

        // notify
        emit StakingPoolRegistered(poolId, operatorShare);
    }

    /// @dev Decreases the operator share for the given pool (i.e. increases pool rewards for members).
    /// Note that this is only callable by the staking contract, and will revert if the new operator
    /// share value is greater than the old value.
    /// @param poolId Unique Id of pool.
    /// @param newOperatorShare The newly decreased percentage of any rewards owned by the operator.
    function decreaseOperatorShare(bytes32 poolId, uint32 newOperatorShare)
        external
        onlyStakingContract
        onlyNotInCatastrophicFailure
    {
        uint32 oldOperatorShare = poolById[poolId].operatorShare;

        if (newOperatorShare >= oldOperatorShare) {
            LibRichErrors.rrevert(LibStakingRichErrors.OperatorShareError(
                LibStakingRichErrors.OperatorShareErrorCodes.CAN_ONLY_DECREASE_OPERATOR_SHARE,
                poolId,
                newOperatorShare
            ));
        } else {
            poolById[poolId].operatorShare = newOperatorShare;
            emit OperatorShareDecreased(poolId, oldOperatorShare, newOperatorShare);
        }
    }

    /// @dev Returns the address of the operator of a given pool
    /// @param poolId Unique id of pool
    /// @return operatorAddress Operator of the pool
    function operatorOf(bytes32 poolId)
        external
        view
        returns (address payable)
    {
        return poolById[poolId].operatorAddress;
    }

    /// @dev Returns the total balance of a pool.
    /// @param poolId Unique Id of pool.
    /// @return Balance in ETH.
    function balanceOf(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return poolById[poolId].operatorBalance + poolById[poolId].membersBalance;
    }

    /// @dev Returns the balance of a pool operator.
    /// @param poolId Unique Id of pool.
    /// @return Balance in ETH.
    function balanceOfOperator(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return poolById[poolId].operatorBalance;
    }

    /// @dev Returns the balance co-owned by members of a pool.
    /// @param poolId Unique Id of pool.
    /// @return Balance in ETH.
    function balanceOfMembers(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return poolById[poolId].membersBalance;
    }

    /// @dev Returns the operator share of a pool's balance.
    /// @param poolId Unique Id of pool.
    /// @return Operator share (integer out of 100)
    function getOperatorShare(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return poolById[poolId].operatorShare;
    }

    /// @dev Increments a balances in a Pool struct, splitting the input amount between the
    /// pool operator and members of the pool based on the pool operator's share.
    /// @param pool Pool struct with the balances to increment.
    /// @param amount Amount to add to balance.
    /// @param operatorOnly Only give this balance to the operator.
    /// @return portion of amount given to operator and delegators, respectively.
    function _incrementPoolBalances(Pool storage pool, uint256 amount, bool operatorOnly)
        private
        returns (uint256 operatorPortion, uint256 membersPortion)
    {
        // compute portions. One of the two must round down: the operator always receives the leftover from rounding.
        operatorPortion = operatorOnly
            ? amount
            : LibMath.getPartialAmountCeil(
                uint256(pool.operatorShare),
                PPM_DENOMINATOR,
                amount
            );

        membersPortion = amount.safeSub(operatorPortion);

        // compute new balances
        uint256 newOperatorBalance = uint256(pool.operatorBalance).safeAdd(operatorPortion);
        uint256 newMembersBalance = uint256(pool.membersBalance).safeAdd(membersPortion);

        // save new balances
        pool.operatorBalance = newOperatorBalance.downcastToUint96();
        pool.membersBalance = newMembersBalance.downcastToUint96();

        return (
            operatorPortion,
            membersPortion
        );
    }

    function _transferToEthVault(address from, uint256 amount)
        private
    {
        // sanity check on eth vault
        IEthVault _ethVault = ethVault;
        if (address(_ethVault) == address(0)) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.EthVaultNotSetError()
            );
        }

        // perform xfer
        _ethVault.depositFor.value(amount)(from);
    }
}
