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

import "../src/sys/MixinParams.sol";


contract TestMixinParams is
    MixinParams
{
    bool public shouldFailAssertValidStorageParams;

    /// @dev Set `shouldFailAssertValidStorageParams`
    function setShouldFailAssertValidStorageParams(bool shouldFail)
        external
    {
        shouldFailAssertValidStorageParams = shouldFail;
    }

    /// @dev `IStakingProxy.assertValidStorageParams()` that reverts if
    ///      `shouldFailAssertValidStorageParams` is true.
    function assertValidStorageParams()
        public
        view
    {
        if (shouldFailAssertValidStorageParams) {
            revert("ASSERT_VALID_STORAGE_PARAMS_FAILED");
        }
    }
}
