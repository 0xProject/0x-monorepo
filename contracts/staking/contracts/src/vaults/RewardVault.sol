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

pragma solidity ^0.5.5;

import "../interfaces/IVault.sol";
import "@0x/contracts-utils/contracts/src/SafeMath.sol";
import "./MixinVaultCore.sol";
import "../interfaces/IRewardVault.sol";
import "../immutable/MixinConstants.sol";


contract RewardVault is
    IRewardVault,
    SafeMath,
    MixinConstants,
    MixinVaultCore
{

    // designed in such a way that it contains minimal logic (it is not upgradeable)
    // but has all the necessary information to compute withdrawals in the event of
    // a catastrophic failure

    // mapping from Pool to Rebate Balance in ETH
    mapping (bytes32 => uint256) internal balancesByPoolId;

    // mapping from owner to pool id
    mapping (bytes32 => address payable) internal ownerByPoolId;

    constructor()
        public
    {}

    function depositFor(bytes32 poolId)
        external
        payable
        onlyStakingContract
    {
        balancesByPoolId[poolId] = _safeAdd(balancesByPoolId[poolId], msg.value);
    }

    function withdrawFor(bytes32 poolId, uint256 amount)
        external
        onlyStakingContract
    {
        require(
            amount <= balancesByPoolId[poolId],
            "AMOUNT_EXCEEDS_BALANCE_OF_POOL"
        );
        balancesByPoolId[poolId] = _safeSub(balancesByPoolId[poolId], amount);
        stakingContractAddress.transfer(amount);
    }

    function withdrawAllFrom(bytes32 poolId)
        external
        onlyInCatostrophicFailure
        returns (uint256)
    {
        address payable owner = ownerByPoolId[poolId];
        require(
            owner != NIL_ADDRESS,
            "INVALID_OWNER"
        );
        uint256 balanceInPool = balancesByPoolId[poolId];
        require(
            balanceInPool > 0,
            "POOL_BALANCE_IS_ZERO"
        );

        balancesByPoolId[poolId] = 0;
        owner.transfer(balancesByPoolId[poolId]);
    }

    function balanceOf(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return balancesByPoolId[poolId];
    }
}
