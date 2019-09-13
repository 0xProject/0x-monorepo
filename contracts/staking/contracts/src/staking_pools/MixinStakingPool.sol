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
import "./MixinStakingPoolMakers.sol";


contract MixinStakingPool is
    MixinStorage,
    MixinStakingPoolMakers,
    MixinStakingPoolRewards
{
    using LibSafeMath for uint256;

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
        poolById[poolId] = pool;

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
    {
        // load pool and assert that we can decrease
        uint32 currentOperatorShare = poolById[poolId].operatorShare;
        _assertNewOperatorShare(
            poolId,
            currentOperatorShare,
            newOperatorShare
        );

        // decrease operator share
        poolById[poolId].operatorShare = newOperatorShare;
        emit OperatorShareDecreased(
            poolId,
            currentOperatorShare,
            newOperatorShare
        );
    }

    /// @dev Returns a staking pool
    /// @param poolId Unique id of pool.
    function getStakingPool(bytes32 poolId)
        public
        view
        returns (IStructs.Pool memory)
    {
        return poolById[poolId];
    }

    /// @dev Look up the operator of a pool.
    /// @param poolId The ID of the pool.
    /// @return operatorAddress The pool operator.
    function getPoolOperator(bytes32 poolId)
        public
        view
        returns (address operatorAddress)
    {
        return rewardVault.operatorOf(poolId);
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
        if (poolById[poolId].operator == NIL_ADDRESS) {
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
}
