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

import "../src/interfaces/IStructs.sol";
import "../src/stake/MixinStakeStorage.sol";


contract TestMixinStakeStorage is
    MixinStakeStorage
{
    mapping (uint256 => IStructs.StoredBalance) public testBalances;

    function setCurrentEpoch(uint256 newEpoch)
        external
    {
        currentEpoch = newEpoch;
    }

    function moveStake(
        uint256 fromIndex,
        uint256 toIndex,
        uint256 amount
    )
        external
    {
        return _moveStake(
            testBalances[fromIndex],
            testBalances[toIndex],
            amount
        );
    }

    function increaseCurrentAndNextBalance(uint256 index, uint256 amount)
        external
    {
        return _increaseCurrentAndNextBalance(testBalances[index], amount);
    }

    function decreaseCurrentAndNextBalance(uint256 index, uint256 amount)
        external
    {
        _decreaseCurrentAndNextBalance(testBalances[index], amount);
    }

    function increaseNextBalance(uint256 index, uint256 amount)
        external
    {
        _increaseNextBalance(testBalances[index], amount);
    }

    function decreaseNextBalance(uint256 index, uint256 amount)
        external
    {
        _decreaseNextBalance(testBalances[index], amount);
    }

    function loadCurrentBalance(uint256 index)
        external
        returns (IStructs.StoredBalance memory balance)
    {
        return _loadCurrentBalance(testBalances[index]);
    }

    function loadStaleBalance(uint256 index)
        external
        view
        returns (IStructs.StoredBalance memory balance)
    {
        return testBalances[index];
    }

    function setStoredBalance(
        IStructs.StoredBalance memory balance,
        uint256 index
    )
        public
    {
        testBalances[index] = balance;
    }
}
