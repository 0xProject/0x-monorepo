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
import "../interfaces/IStakingEvents.sol";
import "../libs/LibStakingRichErrors.sol";
import "./MixinConstants.sol";

contract MixinHyperParameters is
    IStakingEvents,
    Ownable,
    MixinConstants
{
    // Minimum seconds between epochs.
    uint256 internal epochDurationInSeconds = 2 weeks;
    // How much delegated stake is weighted vs operator stake, in ppm.
    uint32 internal rewardDelegatedStakeWeight = 0.9 * PPM_DENOMINATOR; // 90%
    // Minimum amount of stake required in a pool to collect rewards.
    uint256 internal minimumPoolStake = 100 * MIN_TOKEN_VALUE; // 100 ZRX
    // Numerator for cobb douglas alpha factor.
    uint256 internal cobbDouglasAlphaNumerator = 1;
    // Denominator for cobb douglas alpha factor.
    uint256 internal cobbDouglasAlphaDenomintor = 2;

    /// @dev Set all hyperparameters at once.
    /// @param _epochDurationInSeconds Minimum seconds between epochs.
    /// @param _rewardDelegatedStakeWeight How much delegated stake is weighted vs operator stake, in ppm.
    /// @param _minimumPoolStake Minimum amount of stake required in a pool to collect rewards.
    /// @param _cobbDouglasAlphaNumerator Numerator for cobb douglas alpha factor.
    /// @param _cobbDouglasAlphaDenomintor Denominator for cobb douglas alpha factor.
    function tune(
        uint256 _epochDurationInSeconds,
        uint32 _rewardDelegatedStakeWeight,
        uint256 _minimumPoolStake,
        uint256 _cobbDouglasAlphaNumerator,
        uint256 _cobbDouglasAlphaDenomintor
    )
        external
        onlyOwner
    {
        _assertValidCobbDouglasAlpha(
            _cobbDouglasAlphaNumerator,
            _cobbDouglasAlphaDenomintor
        );

        epochDurationInSeconds = _epochDurationInSeconds;
        rewardDelegatedStakeWeight = _rewardDelegatedStakeWeight;
        minimumPoolStake = _minimumPoolStake;
        cobbDouglasAlphaNumerator = _cobbDouglasAlphaNumerator;
        cobbDouglasAlphaDenomintor = _cobbDouglasAlphaDenomintor;

        emit Tuned(
            epochDurationInSeconds,
            rewardDelegatedStakeWeight,
            minimumPoolStake,
            cobbDouglasAlphaNumerator,
            cobbDouglasAlphaDenomintor
        );
    }

    /// @dev Asserts that cobb douglas alpha values are valid.
    function _assertValidCobbDouglasAlpha(
        uint256 numerator,
        uint256 denominator
    )
        private
    {
        if (int256(numerator) < 0
            || int256(denominator) <= 0
            || numerator > denominator
        ) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InvalidTuningValue(
                    LibStakingRichErrors.InvalidTuningValueErrorCode.InvalidCobbDouglasAlpha
            ));
        }
    }
}
