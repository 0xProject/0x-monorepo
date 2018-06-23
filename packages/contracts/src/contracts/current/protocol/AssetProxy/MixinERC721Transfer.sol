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

pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "../../utils/LibBytes/LibBytes.sol";
import "../../tokens/ERC721Token/ERC721Token.sol";
import "./libs/LibTransferErrors.sol";

contract MixinERC721Transfer is
    LibTransferErrors
{
    using LibBytes for bytes;
     bytes4 constant SAFE_TRANSFER_FROM_SELECTOR = bytes4(keccak256("safeTransferFrom(address,address,uint256,bytes)"));
    /// @dev Internal version of `transferFrom`.
    /// @param assetData Encoded byte array.
    /// @param from Address to transfer asset from.
    /// @param to Address to transfer asset to.
    /// @param amount Amount of asset to transfer.
    function transferFromInternal(
        bytes memory assetData,
        address from,
        address to,
        uint256 amount
    )
        internal
    {
        // There exists only 1 of each token.
        require(
            amount == 1,
            INVALID_AMOUNT
        );
    
        // Decode asset data.
        (
            address token,
            uint256 tokenId,
            bytes memory receiverData
        ) = decodeERC721AssetData(assetData);

        // We construct calldata for the `token.safeTransferFrom` ABI.
        // The layout of this calldata is in the table below.
        // 
        // | Area     | Offset | Length  | Contents                                    |
        // | -------- |--------|---------|-------------------------------------------- |
        // | Header   | 0      | 4       | function selector                           |
        // | Params   |        | 4 * 32  | function parameters:                        |
        // |          | 4      |         |   1. from                                   |
        // |          | 36     |         |   2. to                                     |
        // |          | 68     |         |   3. tokenId                                |
        // |          | 100    |         |   4. offset to receiverData (*)             |
        // | Data     |        |         | receiverData:                               |
        // |          | 132    | 32      | receiverData Length                         |
        // |          | 164    | **      | receiverData Contents                       |

        bytes4 safeTransferFromSelector = SAFE_TRANSFER_FROM_SELECTOR;
        bool success;
        assembly {
            /////// Setup State ///////
            // `cdStart` is the start of the calldata for `token.safeTransferFrom` (equal to free memory ptr).
            let cdStart := mload(64)
            // `dataAreaLength` is the total number of words needed to store `receiverData`
            //  As-per the ABI spec, this value is padded up to the nearest multiple of 32,
            //  and includes 32-bytes for length.
            //  It's calculated as folows:
            //      - Unpadded length in bytes = `mload(receiverData) + 32`
            //      - Add 31 to this value then divide by 32 to get the length in words.
            //      - Multiply this value by 32 to get the padded length in bytes.
            let dataAreaLength := mul(div(add(mload(receiverData), 63), 32), 32)
            // `cdEnd` is the end of the calldata for `token.safeTransferFrom`.
            let cdEnd := add(cdStart, add(132, dataAreaLength))

            /////// Setup Header Area ///////
            // This area holds the 4-byte `transferFromSelector`.
            mstore(cdStart, safeTransferFromSelector)
            
            /////// Setup Params Area ///////
            // Each parameter is padded to 32-bytes. The entire Params Area is 128 bytes.
            // Notes:
            //   1. A 20-byte mask is applied to addresses to zero-out the unused bytes.
            //   2. The offset to `receiverData` is the length of the Params Area (128 bytes).
            mstore(add(cdStart, 4), and(from, 0xffffffffffffffffffffffffffffffffffffffff))
            mstore(add(cdStart, 36), and(to, 0xffffffffffffffffffffffffffffffffffffffff))
            mstore(add(cdStart, 68), tokenId)
            mstore(add(cdStart, 100), 128)

            /////// Setup Data Area ///////
            // This area holds `receiverData`.
            let dataArea := add(cdStart, 132)
            for {} lt(dataArea, cdEnd) {} {
                mstore(dataArea, mload(receiverData))
                dataArea := add(dataArea, 32)
                receiverData := add(receiverData, 32)
            }

            /////// Call `token.safeTransferFrom` using the constructed calldata ///////
            success := call(
                gas,
                token,
                0,
                cdStart,
                sub(cdEnd, cdStart),
                cdStart,
                0
            )
        }

        require(
            success,
            TRANSFER_FAILED
        );
    }

    /// @dev Decodes ERC721 Asset data.
    /// @param assetData Encoded byte array.
    /// @return proxyId Intended ERC721 proxy id.
    /// @return token ERC721 token address.
    /// @return tokenId ERC721 token id.
    /// @return receiverData Additional data with no specific format, which
    ///                      is passed to the receiving contract's onERC721Received.
    function decodeERC721AssetData(bytes memory assetData)
        internal
        pure
        returns (
            address token,
            uint256 tokenId,
            bytes memory receiverData
        )
    {
        // Decode asset data.
        token = assetData.readAddress(16);
        tokenId = assetData.readUint256(36);
        receiverData = assetData.readBytesWithLength(100);

        return (
            token,
            tokenId,
            receiverData
        );
    }
}
