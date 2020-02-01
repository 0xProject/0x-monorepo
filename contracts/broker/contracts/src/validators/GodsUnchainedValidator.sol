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

import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "../interfaces/IGodsUnchained.sol";
import "../interfaces/IPropertyValidator.sol";


contract GodsUnchainedValidator is
    IPropertyValidator
{
    IGodsUnchained internal GODS_UNCHAINED; // solhint-disable-line var-name-mixedcase

    using LibBytes for bytes;

    constructor(address _godsUnchained)
        public
    {
        GODS_UNCHAINED = IGodsUnchained(_godsUnchained);
    }

    /// @dev Checks that the given card (encoded as assetData) has the proto and quality encoded in `propertyData`.
    ///      Reverts if the card doesn't match the specified proto and quality.
    /// @param tokenId The ERC721 tokenId of the card to check.
    /// @param propertyData Encoded proto and quality that the card is expected to have.
    function checkBrokerAsset(
        uint256 tokenId,
        bytes calldata propertyData
    )
        external
        view
    {
        (uint16 expectedProto, uint8 expectedQuality) = abi.decode(
            propertyData,
            (uint16, uint8)
        );

        // Validate card properties.
        (uint16 proto, uint8 quality) = GODS_UNCHAINED.getDetails(tokenId);
        require(proto == expectedProto, "GodsUnchainedValidator/PROTO_MISMATCH");
        require(quality == expectedQuality, "GodsUnchainedValidator/QUALITY_MISMATCH");
    }
}
