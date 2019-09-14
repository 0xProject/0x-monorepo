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

import "../interfaces/IStructs.sol";


/// @dev Exposes some internal functions from various contracts to avoid
///      cyclical dependencies.
contract MixinAbstract {

    /// @dev Computes the reward owed to a pool during finalization.
    ///      Does nothing if the pool is already finalized.
    /// @param poolId The pool's ID.
    /// @return rewards Amount of rewards for this pool.
    function _getUnfinalizedPoolRewards(bytes32 poolId)
        internal
        view
        returns (IStructs.PoolRewards memory rewards);

    /// @dev Get an active pool from an epoch by its ID.
    /// @param epoch The epoch the pool was/will be active in.
    /// @param poolId The ID of the pool.
    /// @return pool The pool with ID `poolId` that was active in `epoch`.
    function _getActivePoolFromEpoch(
        uint256 epoch,
        bytes32 poolId
    )
        internal
        view
        returns (IStructs.ActivePool memory pool);

    /// @dev Get a mapping of active pools from an epoch.
    ///      This uses the formula `epoch % 2` as the epoch index in order
    ///      to reuse state, because we only need to remember, at most, two
    ///      epochs at once.
    /// @return activePools The pools that were active in `epoch`.
    function _getActivePoolsFromEpoch(
        uint256 epoch
    )
        internal
        view
        returns (mapping (bytes32 => IStructs.ActivePool) storage activePools);

    /// @dev Instantly finalizes a single pool that was active in the previous
    ///      epoch, crediting it rewards and sending those rewards to the reward
    ///      vault. This can be called by internal functions that need to
    ///      finalize a pool immediately. Does nothing if the pool is already
    ///      finalized.
    /// @param poolId The pool ID to finalize.
    /// @return rewards Rewards.
    /// @return rewards The rewards credited to the pool.
    function _finalizePool(bytes32 poolId)
        internal
        returns (IStructs.PoolRewards memory rewards);
}
