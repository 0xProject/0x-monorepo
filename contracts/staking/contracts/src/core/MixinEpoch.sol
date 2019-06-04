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

import "@0x/contracts-utils/contracts/src/SafeMath.sol";
import "./MixinStorage.sol";
import "../interfaces/IStructs.sol";

contract MixinEpoch is
    IStructs,
    MixinConstants,
    MixinStorage
{

    function _goToNextEpoch()
        internal
    {
        // get current timestamp
        require(
            block.timestamp <= MAX_UINT_64,
            "INVALID_BLOCK_TIMESTAMP"
        );
        uint64 currentBlockTimestamp = uint64(block.timestamp);

        // get current epoch
        uint64 _currentEpoch = currentEpoch;
        require(
            _currentEpoch + _getEpochPeriodInSeconds() >= currentBlockTimestamp,
            "INVALID_BLOCK_TIMESTAMP"
        );

        // incremment epoch
        currentEpoch = _currentEpoch + 1;
        currentEpochStartTimeInSeconds = currentBlockTimestamp;

        // increment timelock period, if needed
        uint64 _currentTimelockPeriod = currentTimelockPeriod;
        if (_currentEpoch >= _currentTimelockPeriod + _getTimelockPeriodInEpochs()) {
            currentTimelockPeriod = _currentTimelockPeriod + 1;
            currentTimelockPeriodStartEpoch = currentEpoch;
        }
    }

    function _getEpochPeriodInSeconds()
        internal
        view
        returns (uint64)
    {
        return EPOCH_PERIOD_IN_SECONDS;
    }

    function _getTimelockPeriodInEpochs()
        internal
        view
        returns (uint64)
    {
        return TIMELOCK_PERIOD_IN_EPOCHS;
    }

    function _getCurrentEpochStartTimeInSeconds()
        internal
        view
        returns (uint64)
    {
        return currentEpochStartTimeInSeconds;
    }

    function _getCurrentTimelockPeriodStartEpoch()
        internal
        view
        returns (uint64)
    {
        return currentTimelockPeriodStartEpoch;
    }

    function _getCurrentEpochEndTimeInSeconds()
        internal
        view
        returns (uint64)
    {
        return _getCurrentEpochStartTimeInSeconds() + _getEpochPeriodInSeconds();
    }

    function _getCurrentTimelockPeriodEndEpoch()
        internal
        view
        returns (uint64)
    {
        return _getCurrentTimelockPeriodStartEpoch() + _getTimelockPeriodInEpochs();
    }

    function _getCurrentEpoch()
        internal
        view
        returns (uint64)
    {
        return currentEpoch;
    }

    function _getCurrentTimelockPeriod()
        internal
        view
        returns (uint64)
    {
        return currentTimelockPeriod;
    }
}
