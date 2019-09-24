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
import "../interfaces/IStructs.sol";
import "./MixinStakingPoolRewards.sol";


contract MixinStakingPool is
    IStakingEvents,
    MixinAbstract,
    MixinConstants,
    Ownable,
    MixinStorage,
    MixinScheduler,
    MixinStakeStorage,
    MixinStakeBalances,
    MixinCumulativeRewards,
    MixinStakingPoolRewards
{
    using LibSafeMath for uint256;
    using LibSafeDowncast for uint256;

    /// @dev Asserts that the sender is the operator of the input pool or the input maker.
    /// @param poolId Pool sender must be operator of.
    modifier onlyStakingPoolOperatorOrMaker(bytes32 poolId) {
        _assertSenderIsPoolOperatorOrMaker(poolId);
        _;
    }

    /// @dev Create a new staking pool. The sender will be the operator of this pool.
    /// Note that an operator must be payable.
    /// @param operatorShare Portion of rewards owned by the operator, in ppm.
    /// @param addOperatorAsMaker Adds operator to the created pool as a maker for convenience iff true.
    /// @return poolId The unique pool id generated for this pool.
    function createStakingPool(uint32 operatorShare, bool addOperatorAsMaker)
        external
        returns (bytes32 poolId)
    {
        // note that an operator must be payable
        address payable operator = msg.sender;

        // assign pool id and generate next id
        poolId = nextPoolId;
        nextPoolId = _computeNextStakingPoolId(poolId);

        // sanity check on operator share
        _assertNewOperatorShare(
            poolId,
            PPM_DENOMINATOR,    // max operator share
            operatorShare
        );

        // create and store pool
        IStructs.Pool memory pool = IStructs.Pool({
            initialized: true,
            operator: operator,
            operatorShare: operatorShare,
            numberOfMakers: 0
        });
        _poolById[poolId] = pool;

        // initialize cumulative rewards for this pool;
        // this is used to track rewards earned by delegators.
        _initializeCumulativeRewards(poolId);

        // Staking pool has been created
        emit StakingPoolCreated(poolId, operator, operatorShare);

        if (addOperatorAsMaker) {
            _addMakerToStakingPool(poolId, operator);
        }

        return poolId;
    }

    /// @dev Decreases the operator share for the given pool (i.e. increases pool rewards for members).
    /// @param poolId Unique Id of pool.
    /// @param newOperatorShare The newly decreased percentage of any rewards owned by the operator.
    function decreaseStakingPoolOperatorShare(bytes32 poolId, uint32 newOperatorShare)
        external
        onlyStakingPoolOperatorOrMaker(poolId)
    {
        // load pool and assert that we can decrease
        uint32 currentOperatorShare = _poolById[poolId].operatorShare;
        _assertNewOperatorShare(
            poolId,
            currentOperatorShare,
            newOperatorShare
        );

        // decrease operator share
        _poolById[poolId].operatorShare = newOperatorShare;
        emit OperatorShareDecreased(
            poolId,
            currentOperatorShare,
            newOperatorShare
        );
    }

    /// @dev Allows caller to join a staking pool if already assigned.
    /// @param poolId Unique id of pool.
    function joinStakingPoolAsMaker(bytes32 poolId)
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
        onlyStakingPoolOperatorOrMaker(poolId)
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
        onlyStakingPoolOperatorOrMaker(poolId)
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
        _poolById[poolId].numberOfMakers = uint256(_poolById[poolId].numberOfMakers).safeSub(1).downcastToUint32();

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

    /// @dev Returns a staking pool
    /// @param poolId Unique id of pool.
    function getStakingPool(bytes32 poolId)
        public
        view
        returns (IStructs.Pool memory)
    {
        return _poolById[poolId];
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
        IStructs.Pool memory pool = _poolById[poolId];

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
        _poolById[poolId].numberOfMakers = uint256(pool.numberOfMakers).safeAdd(1).downcastToUint32();

        // Maker has been added to the pool
        emit MakerAddedToStakingPool(
            poolId,
            makerAddress
        );
    }

    /// @dev return the staking pool operator
    /// @param poolId Unique id of pool.
    function _getStakingPoolOperator(bytes32 poolId)
        internal
        view
        returns (address operator)
    {
        operator = _poolById[poolId].operator;
        return operator;
    }

    /// @dev Computes the unique id that comes after the input pool id.
    /// @param poolId Unique id of pool.
    /// @return Next pool id after input pool.
    function _computeNextStakingPoolId(bytes32 poolId)
        internal
        pure
        returns (bytes32)
    {
        return bytes32(uint256(poolId).safeAdd(POOL_ID_INCREMENT_AMOUNT));
    }

    /// @dev Reverts iff a staking pool does not exist.
    /// @param poolId Unique id of pool.
    function _assertStakingPoolExists(bytes32 poolId)
        internal
        view
        returns (bool)
    {
        if (_getStakingPoolOperator(poolId) == NIL_ADDRESS) {
            // we use the pool's operator as a proxy for its existence
            LibRichErrors.rrevert(
                LibStakingRichErrors.PoolExistenceError(
                    poolId,
                    false
                )
            );
        }
    }

    /// @dev Reverts iff the new operator share is invalid.
    /// @param poolId Unique id of pool.
    /// @param currentOperatorShare Current operator share.
    /// @param newOperatorShare New operator share.
    function _assertNewOperatorShare(
        bytes32 poolId,
        uint32 currentOperatorShare,
        uint32 newOperatorShare
    )
        private
        pure
    {
        // sanity checks
        if (newOperatorShare > PPM_DENOMINATOR) {
            // operator share must be a valid fraction
            LibRichErrors.rrevert(LibStakingRichErrors.OperatorShareError(
                LibStakingRichErrors.OperatorShareErrorCodes.OperatorShareTooLarge,
                poolId,
                newOperatorShare
            ));
        } else if (newOperatorShare >= currentOperatorShare) {
            // new share must be less than the current share
            LibRichErrors.rrevert(LibStakingRichErrors.OperatorShareError(
                LibStakingRichErrors.OperatorShareErrorCodes.CanOnlyDecreaseOperatorShare,
                poolId,
                newOperatorShare
            ));
        }
    }

    /// @dev Asserts that the sender is the operator of the input pool or the input maker.
    /// @param poolId Pool sender must be operator of.
    function _assertSenderIsPoolOperatorOrMaker(bytes32 poolId)
        private
        view
    {
        address operator = _getStakingPoolOperator(poolId);
        if (
            msg.sender != operator &&
            getStakingPoolIdOfMaker(msg.sender) != poolId
        ) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.OnlyCallableByPoolOperatorOrMakerError(
                    msg.sender,
                    operator
                )
            );
        }
    }
}
