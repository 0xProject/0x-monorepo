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
import "../interfaces/IStakingEvents.sol";
import "../immutable/MixinConstants.sol";
import "../immutable/MixinStorage.sol";
import "./MixinStakingPoolRewards.sol";


contract MixinStakingPoolModifiers is
    IStakingEvents,
    MixinConstants,
    Ownable,
    MixinStorage,
    MixinZrxVault,
    MixinStakingPoolRewardVault,
    MixinScheduler,
    MixinStakeStorage,
    MixinStakeBalances,
    MixinStakingPoolRewards
{

    using LibSafeMath for uint256;

    /// @dev Asserts that the sender is the operator of the input pool.
    /// @param poolId Pool sender must be operator of.
    modifier onlyStakingPoolOperator(bytes32 poolId) {
        address poolOperator = poolById[poolId].operator;
        if (msg.sender != poolOperator) {
            LibRichErrors.rrevert(LibStakingRichErrors.OnlyCallableByPoolOperatorError(
                msg.sender,
                poolOperator
            ));
        }

        _;
    }

    /// @dev Asserts that the sender is the operator of the input pool or the input maker.
    /// @param poolId Pool sender must be operator of.
    /// @param makerAddress Address of a maker in the pool.
    modifier onlyStakingPoolOperatorOrMaker(bytes32 poolId, address makerAddress) {
        address poolOperator;
        if (
            msg.sender != makerAddress &&
            msg.sender != (poolOperator = poolById[poolId].operator)
        ) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.OnlyCallableByPoolOperatorOrMakerError(
                    msg.sender,
                    poolOperator,
                    makerAddress
                )
            );
        }

        _;
    }
}
