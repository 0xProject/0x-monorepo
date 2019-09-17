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

import "../immutable/MixinStorage.sol";


contract MixinStakingPoolModifiers is
    MixinStorage
{

    /// @dev Asserts that the sender is the operator of the input pool.
    /// @param poolId Pool sender must be operator of.
    modifier onlyStakingPoolOperator(bytes32 poolId) {
        address operator = poolById[poolId].operator;
        if (msg.sender != operator) {
            LibRichErrors.rrevert(LibStakingRichErrors.OnlyCallableByPoolOperatorError(
                msg.sender,
                operator
            ));
        }

        _;
    }

    /// @dev Asserts that the sender is the operator of the input pool or the input maker.
    /// @param poolId Pool sender must be operator of.
    /// @param makerAddress Address of a maker in the pool.
    modifier onlyStakingPoolOperatorOrMaker(bytes32 poolId, address makerAddress) {
        address operator;
        if (
            msg.sender != makerAddress &&
            msg.sender != (operator = poolById[poolId].operator)
        ) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.OnlyCallableByPoolOperatorOrMakerError(
                    msg.sender,
                    operator,
                    makerAddress
                )
            );
        }

        _;
    }
}
