/*

  Copyright 2020 ZeroEx Intl.

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

pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "@0x/contracts-utils/contracts/src/v06/errors/LibRichErrorsV06.sol";
import "../errors/LibCommonRichErrors.sol";


/// @dev Common utilities.
contract FixinCommon {

    /// @dev The caller must be this contract.
    modifier onlySelf() {
        if (msg.sender != address(this)) {
            _rrevert(LibCommonRichErrors.OnlyCallableBySelfError(msg.sender));
        }
        _;
    }

    /// @dev Reverts with arbitrary data `errorData`.
    /// @param errorData ABI encoded error data.
    function _rrevert(bytes memory errorData) internal pure {
        LibRichErrorsV06.rrevert(errorData);
    }
}
