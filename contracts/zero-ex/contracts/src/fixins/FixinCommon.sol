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
import "../errors/LibOwnableRichErrors.sol";
import "../features/IOwnable.sol";


/// @dev Common feature utilities.
contract FixinCommon {

    using LibRichErrorsV06 for bytes;

    /// @dev The caller must be this contract.
    modifier onlySelf() virtual {
        if (msg.sender != address(this)) {
            LibCommonRichErrors.OnlyCallableBySelfError(msg.sender).rrevert();
        }
        _;
    }

    /// @dev The caller of this function must be the owner.
    modifier onlyOwner() virtual {
        {
            address owner = IOwnable(address(this)).owner();
            if (msg.sender != owner) {
                LibOwnableRichErrors.OnlyOwnerError(
                    msg.sender,
                    owner
                ).rrevert();
            }
        }
        _;
    }

    /// @dev Encode a feature version as a `uint256`.
    /// @param major The major version number of the feature.
    /// @param minor The minor version number of the feature.
    /// @param revision The revision number of the feature.
    /// @return encodedVersion The encoded version number.
    function _encodeVersion(uint32 major, uint32 minor, uint32 revision)
        internal
        pure
        returns (uint256 encodedVersion)
    {
        return (major << 64) | (minor << 32) | revision;
    }
}
