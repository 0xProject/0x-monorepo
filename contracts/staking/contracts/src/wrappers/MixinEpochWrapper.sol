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

import "../core/MixinEpoch.sol";


contract MixinEpochWrapper is
    MixinEpoch
{
    // @TODO - MixinAuthorizable

    function getEpochPeriodInSeconds()
        external
        view
        returns (uint64)
    {
        return _getEpochPeriodInSeconds();
    }

    function getTimelockPeriodInEpochs()
        external
        view
        returns (uint64)
    {
        return _getTimelockPeriodInEpochs();
    }

    function getCurrentEpochStartTimeInSeconds()
        external
        view
        returns (uint64)
    {
        return _getCurrentEpochStartTimeInSeconds();
    }

    function getCurrentTimelockPeriodStartEpoch()
        external
        view
        returns (uint64)
    {
        return _getCurrentTimelockPeriodStartEpoch();
    }

    function getCurrentEpochEndTimeInSeconds()
        external
        view
        returns (uint64)
    {
        return _getCurrentEpochEndTimeInSeconds();
    }

    function getCurrentTimelockPeriodEndEpoch()
        external
        view
        returns (uint64)
    {
        return _getCurrentTimelockPeriodEndEpoch();
    }

    function getCurrentEpoch()
        external
        view
        returns (uint64)
    {
        return _getCurrentEpoch();
    }

    function getCurrentTimelockPeriod()
        external
        view
        returns (uint64)
    {
        return _getCurrentTimelockPeriod();
    }
}
