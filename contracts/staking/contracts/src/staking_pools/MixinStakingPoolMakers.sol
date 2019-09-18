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

import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "../libs/LibStakingRichErrors.sol";
import "../libs/LibSafeDowncast.sol";
import "../interfaces/IStructs.sol";
import "../interfaces/IStakingEvents.sol";
import "../immutable/MixinStorage.sol";
import "./MixinStakingPoolModifiers.sol";


/// @dev This mixin contains logic for staking pools.
contract MixinStakingPoolMakers is
    IStakingEvents,
    MixinConstants,
    Ownable,
    MixinStorage,
    MixinStakingPoolModifiers
{

    using LibSafeMath for uint256;
    using LibSafeDowncast for uint256;

    /// @dev Allows caller to join a staking pool if already assigned.
    /// @param poolId Unique id of pool.
    function joinStakingPoolAsMaker(
        bytes32 poolId
    )
        external
    {
        // Is the maker already in a pool?
        address makerAddress = msg.sender;
        if (isMakerAssignedToStakingPool(makerAddress)) {
            LibRichErrors.rrevert(LibStakingRichErrors.MakerPoolAssignmentError(
                LibStakingRichErrors.MakerPoolAssignmentErrorCodes.MakerAddressAlreadyRegistered,
                makerAddress,
                getStakingPoolIdOfMaker(makerAddress)
            ));
        }

        IStructs.MakerPoolJoinStatus memory poolJoinStatus = IStructs.MakerPoolJoinStatus({
            poolId: poolId,
            confirmed: false
        });
        poolJoinedByMakerAddress[makerAddress] = poolJoinStatus;

        // Maker has joined to the pool, awaiting operator confirmation
        emit PendingAddMakerToPool(
            poolId,
            makerAddress
        );
    }

    /// @dev Adds a maker to a staking pool. Note that this is only callable by the pool operator.
    /// Note also that the maker must have previously called joinStakingPoolAsMaker.
    /// @param poolId Unique id of pool.
    /// @param makerAddress Address of maker.
    function addMakerToStakingPool(
        bytes32 poolId,
        address makerAddress
    )
        external
        onlyStakingPoolOperator(poolId)
    {
        _addMakerToStakingPool(poolId, makerAddress);
    }

    /// @dev Removes a maker from a staking pool. Note that this is only callable by the pool operator or maker.
    /// Note also that the maker does not have to *agree* to leave the pool; this action is
    /// at the sole discretion of the pool operator.
    /// @param poolId Unique id of pool.
    /// @param makerAddress Address of maker.
    function removeMakerFromStakingPool(
        bytes32 poolId,
        address makerAddress
    )
        external
        onlyStakingPoolOperatorOrMaker(poolId, makerAddress)
    {
        bytes32 makerPoolId = getStakingPoolIdOfMaker(makerAddress);
        if (makerPoolId != poolId) {
            LibRichErrors.rrevert(LibStakingRichErrors.MakerPoolAssignmentError(
                LibStakingRichErrors.MakerPoolAssignmentErrorCodes.MakerAddressNotRegistered,
                makerAddress,
                makerPoolId
            ));
        }

        // remove the pool and confirmation from the maker status
        IStructs.MakerPoolJoinStatus memory poolJoinStatus = IStructs.MakerPoolJoinStatus({
            poolId: NIL_POOL_ID,
            confirmed: false
        });
        poolJoinedByMakerAddress[makerAddress] = poolJoinStatus;
        poolById[poolId].numberOfMakers = uint256(poolById[poolId].numberOfMakers).safeSub(1).downcastToUint32();

        // Maker has been removed from the pool`
        emit MakerRemovedFromStakingPool(
            poolId,
            makerAddress
        );
    }

    /// @dev Returns the pool id of the input maker.
    /// @param makerAddress Address of maker
    /// @return Pool id, nil if maker is not yet assigned to a pool.
    function getStakingPoolIdOfMaker(address makerAddress)
        public
        view
        returns (bytes32)
    {
        if (isMakerAssignedToStakingPool(makerAddress)) {
            return poolJoinedByMakerAddress[makerAddress].poolId;
        } else {
            return NIL_POOL_ID;
        }
    }

    /// @dev Returns true iff the maker is assigned to a staking pool.
    /// @param makerAddress Address of maker
    /// @return True iff assigned.
    function isMakerAssignedToStakingPool(address makerAddress)
        public
        view
        returns (bool)
    {
        return poolJoinedByMakerAddress[makerAddress].confirmed;
    }

    /// @dev Adds a maker to a staking pool. Note that this is only callable by the pool operator.
    /// Note also that the maker must have previously called joinStakingPoolAsMaker.
    /// @param poolId Unique id of pool.
    /// @param makerAddress Address of maker.
    function _addMakerToStakingPool(
        bytes32 poolId,
        address makerAddress
    )
        internal
    {
        // cache pool for use throughout this function
        IStructs.Pool memory pool = poolById[poolId];

        // Is the maker already in a pool?
        if (isMakerAssignedToStakingPool(makerAddress)) {
            LibRichErrors.rrevert(LibStakingRichErrors.MakerPoolAssignmentError(
                LibStakingRichErrors.MakerPoolAssignmentErrorCodes.MakerAddressAlreadyRegistered,
                makerAddress,
                getStakingPoolIdOfMaker(makerAddress)
            ));
        }

        // Is the maker trying to join this pool; or are they the operator?
        bytes32 makerPendingPoolId = poolJoinedByMakerAddress[makerAddress].poolId;
        if (makerPendingPoolId != poolId && makerAddress != pool.operator) {
            LibRichErrors.rrevert(LibStakingRichErrors.MakerPoolAssignmentError(
                LibStakingRichErrors.MakerPoolAssignmentErrorCodes.MakerAddressNotPendingAdd,
                makerAddress,
                makerPendingPoolId
            ));
        }

        // Is the pool already full?
        // NOTE: If maximumMakersInPool is decreased below the number of makers currently in a pool,
        // the pool will no longer be able to add more makers.
        if (pool.numberOfMakers >= maximumMakersInPool) {
            LibRichErrors.rrevert(LibStakingRichErrors.MakerPoolAssignmentError(
                LibStakingRichErrors.MakerPoolAssignmentErrorCodes.PoolIsFull,
                makerAddress,
                poolId
            ));
        }

        // Add maker to pool
        IStructs.MakerPoolJoinStatus memory poolJoinStatus = IStructs.MakerPoolJoinStatus({
            poolId: poolId,
            confirmed: true
        });
        poolJoinedByMakerAddress[makerAddress] = poolJoinStatus;
        poolById[poolId].numberOfMakers = uint256(pool.numberOfMakers).safeAdd(1).downcastToUint32();

        // Maker has been added to the pool
        emit MakerAddedToStakingPool(
            poolId,
            makerAddress
        );
    }
}
