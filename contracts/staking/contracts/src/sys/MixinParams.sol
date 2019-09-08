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
import "@0x/contracts-utils/contracts/src/Ownable.sol";
import "../immutable/MixinConstants.sol";
import "../immutable/MixinStorage.sol";
import "../interfaces/IStakingEvents.sol";
import "../libs/LibStakingRichErrors.sol";


contract MixinParams is
    IStakingEvents,
    MixinConstants,
    Ownable,
    MixinStorage
{
    /// @dev Set all configurable parameters at once.
    /// @param _epochDurationInSeconds Minimum seconds between epochs.
    /// @param _rewardDelegatedStakeWeight How much delegated stake is weighted vs operator stake, in ppm.
    /// @param _minimumPoolStake Minimum amount of stake required in a pool to collect rewards.
    /// @param _maximumMakersInPool Maximum number of maker addresses allowed to be registered to a pool.
    /// @param _cobbDouglasAlphaNumerator Numerator for cobb douglas alpha factor.
    /// @param _cobbDouglasAlphaDenomintor Denominator for cobb douglas alpha factor.
    function setParams(
        uint256 _epochDurationInSeconds,
        uint32 _rewardDelegatedStakeWeight,
        uint256 _minimumPoolStake,
        uint256 _maximumMakersInPool,
        uint32 _cobbDouglasAlphaNumerator,
        uint32 _cobbDouglasAlphaDenomintor
    )
        external
        onlyOwner
    {
        _assertValidRewardDelegatedStakeWeight(_rewardDelegatedStakeWeight);
        _assertValidMaximumMakersInPool(_maximumMakersInPool);
        _assertValidCobbDouglasAlpha(
            _cobbDouglasAlphaNumerator,
            _cobbDouglasAlphaDenomintor
        );

        epochDurationInSeconds = _epochDurationInSeconds;
        rewardDelegatedStakeWeight = _rewardDelegatedStakeWeight;
        minimumPoolStake = _minimumPoolStake;
        maximumMakersInPool = _maximumMakersInPool;
        cobbDouglasAlphaNumerator = _cobbDouglasAlphaNumerator;
        cobbDouglasAlphaDenomintor = _cobbDouglasAlphaDenomintor;

        emit Tuned(
            epochDurationInSeconds,
            rewardDelegatedStakeWeight,
            minimumPoolStake,
            maximumMakersInPool,
            cobbDouglasAlphaNumerator,
            cobbDouglasAlphaDenomintor
        );
    }

    /// @dev Retrives all configurable parameter values.
    /// @return _epochDurationInSeconds Minimum seconds between epochs.
    /// @return _rewardDelegatedStakeWeight How much delegated stake is weighted vs operator stake, in ppm.
    /// @return _minimumPoolStake Minimum amount of stake required in a pool to collect rewards.
    /// @return _maximumMakersInPool Maximum number of maker addresses allowed to be registered to a pool.
    /// @return _cobbDouglasAlphaNumerator Numerator for cobb douglas alpha factor.
    /// @return _cobbDouglasAlphaDenomintor Denominator for cobb douglas alpha factor.
    function getParams()
        external
        view
        returns (
            uint256 _epochDurationInSeconds,
            uint32 _rewardDelegatedStakeWeight,
            uint256 _minimumPoolStake,
            uint256 _maximumMakersInPool,
            uint32 _cobbDouglasAlphaNumerator,
            uint32 _cobbDouglasAlphaDenomintor
        )
    {
        _epochDurationInSeconds = epochDurationInSeconds;
        _rewardDelegatedStakeWeight = rewardDelegatedStakeWeight;
        _minimumPoolStake = minimumPoolStake;
        _maximumMakersInPool = maximumMakersInPool;
        _cobbDouglasAlphaNumerator = cobbDouglasAlphaNumerator;
        _cobbDouglasAlphaDenomintor = cobbDouglasAlphaDenomintor;
    }

    /// @dev Initialzize storage belonging to this mixin.
    function _initMixinParams() internal {
        // Ensure state is uninitialized.
        if (epochDurationInSeconds != 0 &&
            rewardDelegatedStakeWeight != 0 &&
            minimumPoolStake != 0 &&
            maximumMakersInPool != 0 &&
            cobbDouglasAlphaNumerator != 0 &&
            cobbDouglasAlphaDenomintor != 0
        ) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InitializationError(
                    LibStakingRichErrors.InitializationErrorCode.MixinParamsAlreadyInitialized
                )
            );
        }
        // Set up defaults.
        epochDurationInSeconds = 2 weeks;
        rewardDelegatedStakeWeight = (90 * PPM_DENOMINATOR) / 100; // 90%
        minimumPoolStake = 100 * MIN_TOKEN_VALUE; // 100 ZRX
        maximumMakersInPool = 10;
        cobbDouglasAlphaNumerator = 1;
        cobbDouglasAlphaDenomintor = 2;
    }

    /// @dev Asserts that cobb douglas alpha values are valid.
    /// @param numerator Numerator for cobb douglas alpha factor.
    /// @param denominator Denominator for cobb douglas alpha factor.
    function _assertValidCobbDouglasAlpha(
        uint32 numerator,
        uint32 denominator
    )
        private
        pure
    {
        // Alpha must be 0 < x < 1
        if (numerator > denominator || denominator == 0) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InvalidParamValue(
                    LibStakingRichErrors.InvalidParamValueErrorCode.InvalidCobbDouglasAlpha
            ));
        }
    }

    /// @dev Asserts that a stake weight is valid.
    /// @param weight How much delegated stake is weighted vs operator stake, in ppm.
    function _assertValidRewardDelegatedStakeWeight(
        uint32 weight
    )
        private
        pure
    {
        if (weight > PPM_DENOMINATOR) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InvalidParamValue(
                    LibStakingRichErrors.InvalidParamValueErrorCode.InvalidRewardDelegatedStakeWeight
            ));
        }
    }

    /// @dev Asserts that a maximum makers value is valid.
    /// @param amount Maximum number of maker addresses allowed to be registered to a pool.
    function _assertValidMaximumMakersInPool(
        uint256 amount
    )
        private
        pure
    {
        if (amount == 0) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InvalidParamValue(
                    LibStakingRichErrors.InvalidParamValueErrorCode.InvalidMaximumMakersInPool
            ));
        }
    }
}
