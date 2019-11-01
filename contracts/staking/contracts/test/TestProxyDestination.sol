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

import "../src/Staking.sol";


contract TestProxyDestination is
    Staking
{
    // Init will revert if this flag is set to `true`
    bool public initFailFlag;

    /// @dev Emitted when `init` is called
    event InitCalled(
        bool initCalled
    );

    /// @dev returns the input string
    function echo(string calldata val)
        external
        returns (string memory)
    {
        return val;
    }

    /// @dev Just a function that'll do some math on input
    function doMath(uint256 a, uint256 b)
        external
        returns (uint256 sum, uint256 difference)
    {
        return (
            a + b,
            a - b
        );
    }

    /// @dev reverts with "Goodbye, World!"
    function die()
        external
    {
        revert("Goodbye, World!");
    }

    /// @dev Called when attached to the StakingProxy.
    ///      Reverts if `initFailFlag` is set, otherwise
    ///      sets storage params and emits `InitCalled`.
    function init()
        public
    {
        if (initFailFlag) {
            revert("INIT_FAIL_FLAG_SET");
        }

        // Set params such that they'll pass `StakingProxy.assertValidStorageParams`
        epochDurationInSeconds = 5 days;
        cobbDouglasAlphaNumerator = 1;
        cobbDouglasAlphaDenominator = 1;
        rewardDelegatedStakeWeight = PPM_DENOMINATOR;
        minimumPoolStake = 100;

        // Emit event to notify that `init` was called
        emit InitCalled(true);
    }
}