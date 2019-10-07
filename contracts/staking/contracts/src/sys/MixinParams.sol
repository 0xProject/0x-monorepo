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

import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "../immutable/MixinStorage.sol";
import "../interfaces/IStakingEvents.sol";
import "../libs/LibStakingRichErrors.sol";


contract MixinParams is
    IStakingEvents,
    MixinStorage
{
    /// @dev Set all configurable parameters at once.
    /// @param _epochDurationInSeconds Minimum seconds between epochs.
    /// @param _rewardDelegatedStakeWeight How much delegated stake is weighted vs operator stake, in ppm.
    /// @param _minimumPoolStake Minimum amount of stake required in a pool to collect rewards.
    /// @param _cobbDouglasAlphaNumerator Numerator for cobb douglas alpha factor.
    /// @param _cobbDouglasAlphaDenominator Denominator for cobb douglas alpha factor.
    function setParams(
        uint256 _epochDurationInSeconds,
        uint32 _rewardDelegatedStakeWeight,
        uint256 _minimumPoolStake,
        uint32 _cobbDouglasAlphaNumerator,
        uint32 _cobbDouglasAlphaDenominator
    )
        external
        onlyAuthorized
    {
        _setParams(
            _epochDurationInSeconds,
            _rewardDelegatedStakeWeight,
            _minimumPoolStake,
            _cobbDouglasAlphaNumerator,
            _cobbDouglasAlphaDenominator
        );
    }

    /// @dev Retrieves all configurable parameter values.
    /// @return _epochDurationInSeconds Minimum seconds between epochs.
    /// @return _rewardDelegatedStakeWeight How much delegated stake is weighted vs operator stake, in ppm.
    /// @return _minimumPoolStake Minimum amount of stake required in a pool to collect rewards.
    /// @return _cobbDouglasAlphaNumerator Numerator for cobb douglas alpha factor.
    /// @return _cobbDouglasAlphaDenominator Denominator for cobb douglas alpha factor.
    function getParams()
        external
        view
        returns (
            uint256 _epochDurationInSeconds,
            uint32 _rewardDelegatedStakeWeight,
            uint256 _minimumPoolStake,
            uint32 _cobbDouglasAlphaNumerator,
            uint32 _cobbDouglasAlphaDenominator
        )
    {
        _epochDurationInSeconds = epochDurationInSeconds;
        _rewardDelegatedStakeWeight = rewardDelegatedStakeWeight;
        _minimumPoolStake = minimumPoolStake;
        _cobbDouglasAlphaNumerator = cobbDouglasAlphaNumerator;
        _cobbDouglasAlphaDenominator = cobbDouglasAlphaDenominator;
    }

    /// @dev Initialize storage belonging to this mixin.
    function _initMixinParams()
        internal
    {
        // Ensure state is uninitialized.
        _assertParamsNotInitialized();

        // Set up defaults.
        // These cannot be set to variables, or we go over the stack variable limit.
        _setParams(
            10 days,                       // epochDurationInSeconds
            (90 * PPM_DENOMINATOR) / 100,  // rewardDelegatedStakeWeight
            100 * MIN_TOKEN_VALUE,         // minimumPoolStake
            1,                             // cobbDouglasAlphaNumerator
            2                              // cobbDouglasAlphaDenominator
        );
    }

    /// @dev Asserts that upgradable storage has not yet been initialized.
    function _assertParamsNotInitialized()
        internal
        view
    {
        if (epochDurationInSeconds != 0 &&
            rewardDelegatedStakeWeight != 0 &&
            minimumPoolStake != 0 &&
            cobbDouglasAlphaNumerator != 0 &&
            cobbDouglasAlphaDenominator != 0
        ) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InitializationError(
                    LibStakingRichErrors.InitializationErrorCodes.MixinParamsAlreadyInitialized
                )
            );
        }
    }

    /// @dev Set all configurable parameters at once.
    /// @param _epochDurationInSeconds Minimum seconds between epochs.
    /// @param _rewardDelegatedStakeWeight How much delegated stake is weighted vs operator stake, in ppm.
    /// @param _minimumPoolStake Minimum amount of stake required in a pool to collect rewards.
    /// @param _cobbDouglasAlphaNumerator Numerator for cobb douglas alpha factor.
    /// @param _cobbDouglasAlphaDenominator Denominator for cobb douglas alpha factor.
    function _setParams(
        uint256 _epochDurationInSeconds,
        uint32 _rewardDelegatedStakeWeight,
        uint256 _minimumPoolStake,
        uint32 _cobbDouglasAlphaNumerator,
        uint32 _cobbDouglasAlphaDenominator
    )
        private
    {
        epochDurationInSeconds = _epochDurationInSeconds;
        rewardDelegatedStakeWeight = _rewardDelegatedStakeWeight;
        minimumPoolStake = _minimumPoolStake;
        cobbDouglasAlphaNumerator = _cobbDouglasAlphaNumerator;
        cobbDouglasAlphaDenominator = _cobbDouglasAlphaDenominator;

        emit ParamsSet(
            _epochDurationInSeconds,
            _rewardDelegatedStakeWeight,
            _minimumPoolStake,
            _cobbDouglasAlphaNumerator,
            _cobbDouglasAlphaDenominator
        );
    }
}
